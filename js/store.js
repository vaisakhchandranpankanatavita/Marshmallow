/* Storefront config + the ordering seam.
 *
 * Replaces the previous Shopify adapter. Fulfilment is Qikink (print-on-demand,
 * Bengaluru). Nothing else in the codebase knows how orders are placed — the
 * rest of the site reads window.PRODUCTS and calls Store.checkout(...).
 *
 * ===========================================================================
 * READ THIS BEFORE WIRING ANYTHING
 * ===========================================================================
 *
 * 1. QIKINK CREDENTIALS MUST NOT LIVE IN THE BROWSER.
 *
 *    This is the important difference from the Shopify setup this replaces.
 *    A Shopify *Storefront* token is designed to be public — it is scoped to
 *    reading the catalog and building a cart. Qikink's API credentials are
 *    account credentials: whoever holds them can place real print orders that
 *    you get billed for. Putting them in client-side JavaScript — including in
 *    a React bundle, an .env file consumed by Vite/CRA, or a "hidden" config
 *    endpoint — publishes them to every visitor.
 *
 *    So the shape has to be:
 *
 *        React app  ──POST /api/orders──►  your backend  ──►  Qikink API
 *                                              │
 *                                              └──►  payment gateway verify
 *
 *    Your backend is the only thing holding the Qikink client id and token. It
 *    is also the only place that decides what an order costs — never trust a
 *    price sent up from the browser, or a customer can edit it before it is
 *    submitted. Re-price every line server-side from your own catalog.
 *
 * 2. I COULD NOT REACH QIKINK'S DOCUMENTATION.
 *
 *    Outbound network access is blocked in the environment this was written in,
 *    so the payload below is a *structural* sketch of what a print-on-demand
 *    order needs, not a transcription of Qikink's actual contract. Field names,
 *    the auth header names, the endpoint paths and the SKU format all need
 *    checking against their current API docs before this will work. Treat every
 *    identifier here as a placeholder.
 *
 * 3. PAYMENTS ARE SEPARATE FROM FULFILMENT.
 *
 *    Qikink prints and ships. It does not collect money from your customer.
 *    You still need a gateway — Razorpay, PayU or Cashfree for an Indian
 *    business. The usual order is: take payment, verify the signature on your
 *    server, and only then create the Qikink order. Creating the print order
 *    first means paying for prints on abandoned payments.
 */

window.Store = (function () {
  const CONFIG = {
    /* Presentation */
    currency: 'INR',
    currencySymbol: '₹',
    locale: 'en-IN',

    /* Commerce rules the UI quotes back to the shopper */
    freeShippingThreshold: 1499,
    codLimit: 3000,
    codFee: 49,

    /* Your own backend. Not Qikink directly — see the note above. */
    orderEndpoint: '/api/orders',
    catalogEndpoint: '/api/catalog',        // Load only Qikink-mapped products from the server

    /* Flip on once orderEndpoint is live. */
    enabled: false
  };

  /* Indian digit grouping is 2,2,3 from the right — 1,49,999 rather than
     149,999 — so this goes through en-IN rather than a manual formatter.
     Prices are whole rupees, so decimals only appear if a value has paise. */
  function money(n) {
    const v = Number(n) || 0;
    const decimals = Number.isInteger(v) ? 0 : 2;
    return CONFIG.currencySymbol + v.toLocaleString(CONFIG.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /* Optional: pull the catalog from your API instead of the bundled file.
     Keeps the local catalog on failure — a storefront showing slightly stale
     products beats a blank page. */
  async function init() {
    if (!CONFIG.catalogEndpoint) {
      return { source: 'local', count: window.PRODUCTS.length };
    }
    try {
      const res = await fetch(CONFIG.catalogEndpoint);
      if (!res.ok) throw new Error(`catalog responded ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length) window.PRODUCTS = data;
      return { source: 'api', count: window.PRODUCTS.length };
    } catch (err) {
      console.warn('[store] catalog fetch failed, using bundled catalog:', err.message);
      return { source: 'local', count: window.PRODUCTS.length, error: err.message };
    }
  }

  /* A cart line -> the fields a print-on-demand order needs.
   *
   * `sku` is the join between this catalog and Qikink's product list. Whatever
   * their SKU format turns out to be, generate it here so there is exactly one
   * place to fix. The design/artwork reference matters as much as the garment:
   * Qikink needs to know *what to print*, not only what blank to print it on.
   */
  function toOrderLine(line) {
    const product = window.PRODUCT_BY_SLUG(line.slug);
    if (!product) return null;
    return {
      sku: [product.slug, line.colorway, line.size].join('-').toLowerCase(),
      slug: product.slug,
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,   // fit / case style -> the blank to use
      colour: line.colorway,
      size: line.size,
      quantity: line.qty,
      // Where the print file lives. Swap for your hosted artwork URL — Qikink
      // needs a real downloadable asset, not a relative path.
      design: window.PRODUCT_IMAGE(product, line.colorway)
      // NOTE: deliberately no price. The server prices the order.
    };
  }

  /* Get a price quote from the server for the current bag. Does not create an
     order, just prices it so the checkout page can show totals. */
  async function quote(lines, gateway = 'Prepaid') {
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines, gateway })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, reason: data.reason || `Server responded ${res.status}` };
      return { ok: true, ...data };
    } catch (err) {
      return { ok: false, reason: err.message };
    }
  }

  /* Create a Razorpay payment order for the current bag. Steps are:
     1. quote() — price the bag
     2. createPayment() — open a Razorpay order
     3. show Razorpay checkout UI
     4. verify the signature on the client
     5. finalize() — send payment proof + customer address to backend
  */
  async function createPayment(lines) {
    try {
      const res = await fetch('/api/payments/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, reason: data.reason || `Server responded ${res.status}` };
      return { ok: true, ...data };
    } catch (err) {
      return { ok: false, reason: err.message };
    }
  }

  /* After payment is captured, send the customer address and payment proof to
     the backend to complete the order. */
  async function finalize(lines, customer, paymentProof) {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines,
          customer,
          gateway: paymentProof ? 'Prepaid' : 'COD',
          payment: paymentProof,
          orderNumber: paymentProof?.orderNumber
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, reason: data.reason || `Server responded ${res.status}`, code: data.code };
      return { ok: true, ...data };
    } catch (err) {
      return { ok: false, reason: err.message };
    }
  }

  /* Convenience: hand over the whole bag. Used by the checkout page. */
  async function checkout(lines, customer, gateway = 'COD') {
    return finalize(lines, customer, null);
  }

  return { CONFIG, init, checkout, createPayment, finalize, quote, money, toOrderLine };
})();

/* Back-compat: cart.js and main.js were written against window.Shop. Keeping
   the alias means the rename is not a flag day, but new code should use Store. */
window.Shop = window.Store;
