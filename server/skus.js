/* The join between this catalog and Qikink's.
 *
 * Our products are identified by slug + colourway + size. Qikink identifies a
 * blank by *its* SKU — a code for the garment, a code for the colour and a code
 * for the size, joined with hyphens (their docs show the shape `MRnFs-Wh-S`).
 * Nothing can be ordered until every variant a shopper can put in the bag maps
 * to a SKU that exists in your Qikink account.
 *
 * Two ways to supply that mapping, checked in this order:
 *
 *   1. server/qikink-skus.json — explicit entries, exact match wins. Use this
 *      for phone cases, whose SKU depends on the phone model, and for any
 *      garment whose derived code is wrong.
 *   2. The code tables below — derived as `<blank>-<colour>-<size>`. Fine for
 *      tees, where one blank covers every colour and size.
 *
 * VERIFY THE CODES BEFORE YOU SELL ANYTHING. They are written to the documented
 * shape, but a code that does not exist in your account is an order Qikink
 * rejects. `npm run verify:skus` pulls your product list and reports every
 * variant this module cannot map.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT } from './config.js';
import { PRODUCTS, productBySlug, sizesFor } from './catalog.js';

/* Garment code per subcategory. Tees are a real Qikink blank; cases are model-
   specific, so they have no derivable code and must come from the JSON file. */
const BLANK_CODES = {
  tees: {
    oversized: 'MRnHsOs',      // men's round neck, half sleeve, oversized
    classic: 'MRnHs',          // men's round neck, half sleeve
    crop: 'WRnHsCr',           // women's round neck, half sleeve, crop
    longsleeve: 'MRnFs'        // men's round neck, full sleeve
  },
  cases: {}                    // model-specific — see qikink-skus.json
};

/* Our colourway names -> Qikink colour codes. Our loud print colours are not
   all blank colours: a "lime" print goes on a white or black blank. Where the
   colourway names the artwork rather than the garment, map it to the blank the
   print is meant to sit on. */
const COLOUR_CODES = {
  black: 'Bl',
  cream: 'Wh',
  white: 'Wh',
  blue: 'Nb',
  red: 'Rd',
  yellow: 'Yl',
  pink: 'Pk',
  purple: 'Pu',
  lime: 'Wh',                  // print colour, not a blank colour
  orange: 'Wh',
  cyan: 'Wh'
};

const SIZE_CODES = {
  XS: 'XS', S: 'S', M: 'M', L: 'L', XL: 'XL', '2XL': 'XXL', '3XL': 'XXXL'
};

/* Qikink's print method id. 1 is direct-to-garment in their examples; check
   yours against the product list before going live. */
const PRINT_TYPE = { tees: 1, cases: 1 };

/* Where the design sits on the blank. Qikink calls this placement_sku. */
const PLACEMENT = { tees: 'fr', cases: 'default' };

function loadOverrides() {
  try {
    const raw = readFileSync(resolve(ROOT, 'server/qikink-skus.json'), 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('[skus] qikink-skus.json could not be read:', err.message);
    }
    return {};
  }
}

const overrides = loadOverrides();

const overrideKey = (slug, colorway, size) => `${slug}/${colorway}/${size}`;

/* One variant -> everything Qikink needs to know about the blank.
 * Returns null when the variant cannot be mapped, which callers must treat as
 * "do not place this order" rather than guessing. */
export function skuFor(slug, colorway, size) {
  const product = productBySlug(slug);
  if (!product) return null;

  // Demo/placeholder products (js/products.js DEMO_RAW) must never resolve
  // to a real SKU. Cases fall through to null on their own — cases has no
  // BLANK_CODES entries to derive from — but tees do, and a demo tee could
  // otherwise silently pick up a real derived SKU and place a real order for
  // a product that doesn't exist in Qikink. This check comes before the
  // override lookup for the same reason: nothing overrides it.
  if (product.demo) return null;

  const exact = overrides.variants?.[overrideKey(slug, colorway, size)];
  if (exact) {
    return {
      sku: exact.sku ?? exact,
      printTypeId: exact.print_type_id ?? PRINT_TYPE[product.category],
      placementSku: exact.placement_sku ?? PLACEMENT[product.category],
      // 1 when this SKU is a saved product in Qikink's "My Products" — their
      // API then pulls design/placement itself and `designs` must be omitted.
      searchFromMyProducts: exact.search_from_my_products ?? 0,
      source: 'override'
    };
  }

  // Cases are keyed by style + phone model, which is the size field here.
  const styleKey = overrides.caseModels?.[`${product.subcategory}/${size}`];
  if (styleKey) {
    return {
      sku: styleKey,
      printTypeId: PRINT_TYPE.cases,
      placementSku: PLACEMENT.cases,
      source: 'caseModels'
    };
  }

  const blank = BLANK_CODES[product.category]?.[product.subcategory];
  const colour = COLOUR_CODES[colorway];
  const sizeCode = SIZE_CODES[size];
  if (!blank || !colour || !sizeCode) return null;

  return {
    sku: `${blank}-${colour}-${sizeCode}`,
    printTypeId: PRINT_TYPE[product.category],
    placementSku: PLACEMENT[product.category],
    source: 'derived'
  };
}

/* Every variant the storefront can produce, with its mapping or the reason it
   has none. Used by the verification script and by the boot-time warning. */
export function allVariants() {
  const out = [];
  for (const product of PRODUCTS) {
    for (const colorway of product.colorways) {
      for (const size of sizesFor(product)) {
        const mapped = skuFor(product.slug, colorway, size);
        out.push({
          slug: product.slug,
          category: product.category,
          subcategory: product.subcategory,
          colorway,
          size,
          sku: mapped?.sku ?? null,
          source: mapped?.source ?? null
        });
      }
    }
  }
  return out;
}

export function unmappedVariants() {
  return allVariants().filter(v => !v.sku);
}
