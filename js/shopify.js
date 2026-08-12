/* Shopify integration seam.
 *
 * Nothing else in the codebase talks to Shopify. The rest of the site reads
 * window.PRODUCTS and calls Shop.checkout(lines) — so connecting a real store
 * means filling in this one file and changing nothing else.
 *
 * ---------------------------------------------------------------------------
 * TO GO LIVE
 * ---------------------------------------------------------------------------
 * 1. In Shopify admin: Settings → Apps → Develop apps → create an app, enable
 *    the Storefront API, and copy the public access token. A Storefront token
 *    is safe in client-side code; an Admin API token is NOT — never ship one.
 *
 * 2. Fill in CONFIG below and set enabled: true.
 *
 * 3. Add a metafield or tag on each Shopify product so it maps to the artwork
 *    here, or upload real product photos and drop the `image` field from the
 *    mapper. Variants must be Colour × Size to match the picker.
 *
 * Until enabled is true, everything runs off the local catalog in products.js
 * and checkout just reports what it would have sent.
 *
 * ACCOUNTS: js/auth.js is a front-end shell only. Do not wire it to a database
 * of your own — Shopify already issues customer accounts, and its Customer
 * Account API should own login, password reset and order history. Point the
 * sign-in button at that instead of storing credentials anywhere yourself.
 *
 * INDIA NOTES: Shopify Payments is not available in India. Use Razorpay, PayU
 * or Cashfree as the gateway, and add a COD option at checkout if you want the
 * COD copy on the site to be true.
 */

window.Shop = (function () {
  const CONFIG = {
    enabled: false,
    domain: 'your-store.myshopify.com',
    token: '',                       // Storefront API public access token
    apiVersion: '2025-01',
    currency: 'INR',
    currencySymbol: '\u20B9',
    locale: 'en-IN',
    freeShippingThreshold: 1499,
    codLimit: 3000,
    codFee: 49
  };

  const endpoint = () => `https://${CONFIG.domain}/api/${CONFIG.apiVersion}/graphql.json`;

  async function gql(query, variables) {
    const res = await fetch(endpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': CONFIG.token
      },
      body: JSON.stringify({ query, variables })
    });
    if (!res.ok) throw new Error(`Shopify responded ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(json.errors.map(e => e.message).join('; '));
    return json.data;
  }

  const PRODUCTS_QUERY = `
    query Products($first: Int!) {
      products(first: $first) {
        nodes {
          handle title description
          priceRange { minVariantPrice { amount } }
          compareAtPriceRange { minVariantPrice { amount } }
          images(first: 1) { nodes { url altText } }
          options { name values }
          variants(first: 100) {
            nodes { id title availableForSale selectedOptions { name value } }
          }
        }
      }
    }`;

  const CART_CREATE = `
    mutation CartCreate($lines: [CartLineInput!]!) {
      cartCreate(input: { lines: $lines }) {
        cart { checkoutUrl }
        userErrors { message }
      }
    }`;

  /* Shopify product → the shape products.js already uses. */
  function mapProduct(node) {
    const opt = name => (node.options.find(o => o.name.toLowerCase() === name) || {}).values || [];
    return {
      slug: node.handle,
      name: node.title,
      description: node.description,
      price: Number(node.priceRange.minVariantPrice.amount),
      compareAt: Number(node.compareAtPriceRange?.minVariantPrice?.amount) || null,
      colorways: opt('colour').concat(opt('color')).map(v => v.toLowerCase()),
      sizes: opt('size'),
      image: node.images.nodes[0]?.url || null,
      variants: node.variants.nodes.map(v => ({
        id: v.id,
        available: v.availableForSale,
        options: Object.fromEntries(v.selectedOptions.map(o => [o.name.toLowerCase(), o.value]))
      }))
    };
  }

  /* Called once on boot. Silently keeps the local catalog if anything fails —
     a storefront that renders stale products beats a blank page. */
  async function init() {
    if (!CONFIG.enabled) return { source: 'local', count: window.PRODUCTS.length };
    try {
      const data = await gql(PRODUCTS_QUERY, { first: 100 });
      const mapped = data.products.nodes.map(mapProduct);
      if (mapped.length) window.PRODUCTS = mapped;
      return { source: 'shopify', count: mapped.length };
    } catch (err) {
      console.warn('[shop] Shopify fetch failed, using local catalog:', err.message);
      return { source: 'local', count: window.PRODUCTS.length, error: err.message };
    }
  }

  /* Resolve a cart line to a Shopify variant id. */
  function variantIdFor(line) {
    const product = window.PRODUCTS.find(p => p.slug === line.slug);
    if (!product || !product.variants) return null;
    const match = product.variants.find(v => {
      const o = v.options;
      const colour = (o.colour || o.color || '').toLowerCase();
      return colour === line.colorway.toLowerCase() && o.size === line.size;
    });
    return match ? match.id : null;
  }

  /* Hand the bag over to Shopify's hosted checkout. */
  async function checkout(lines) {
    if (!CONFIG.enabled) {
      console.info('[shop] Checkout payload (Shopify disabled):', lines);
      return { ok: false, reason: 'disabled', lines };
    }
    const cartLines = [];
    for (const line of lines) {
      const id = variantIdFor(line);
      if (!id) return { ok: false, reason: 'unmapped', line };
      cartLines.push({ merchandiseId: id, quantity: line.qty });
    }
    const data = await gql(CART_CREATE, { lines: cartLines });
    const errors = data.cartCreate.userErrors;
    if (errors.length) return { ok: false, reason: errors[0].message };
    window.location.href = data.cartCreate.cart.checkoutUrl;
    return { ok: true };
  }

  /* Indian digit grouping is 2,2,3 from the right — 1,49,999 rather than
     149,999 — so this has to go through en-IN, not a manual toFixed. Prices are
     whole rupees, so no decimals unless a value actually has paise. */
  function money(n) {
    const v = Number(n) || 0;
    const decimals = Number.isInteger(v) ? 0 : 2;
    return CONFIG.currencySymbol + v.toLocaleString(CONFIG.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  return { CONFIG, init, checkout, money, gql };
})();
