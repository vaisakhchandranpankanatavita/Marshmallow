/* Server-side view of the catalog.
 *
 * js/products.js is written for the browser — it assigns onto `window`. Rather
 * than keeping a second copy of prices on the server (which would drift, and
 * drift in prices is money), it is evaluated here in a throwaway context with a
 * `window` object we supply. One file, one price.
 *
 * If you move the catalog into a database, this is the only module that has to
 * change: everything downstream just calls productBySlug()/priceOf().
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { ROOT } from './config.js';

function loadCatalog() {
  const source = readFileSync(resolve(ROOT, 'js/products.js'), 'utf8');
  const sandbox = { window: {} };
  createContext(sandbox);
  runInContext(source, sandbox, { filename: 'js/products.js' });

  const w = sandbox.window;
  if (!Array.isArray(w.PRODUCTS) || !w.PRODUCTS.length) {
    throw new Error('catalog: js/products.js produced no products');
  }
  return w;
}

const catalog = loadCatalog();

export const PRODUCTS = catalog.PRODUCTS;
export const TEE_SIZES = catalog.TEE_SIZES;
export const CASE_SIZES = catalog.CASE_SIZES;
export const SWATCHES = catalog.SWATCHES;

const bySlug = new Map(PRODUCTS.map(p => [p.slug, p]));

export const productBySlug = slug => bySlug.get(slug) || null;

export const sizesFor = product =>
  product.sizes || (product.category === 'tees' ? TEE_SIZES : CASE_SIZES);

/* The only place a line's price may come from. Never accept one from a
   request body — a browser-supplied price is a price the customer can edit. */
export function priceOf(slug) {
  const product = bySlug.get(slug);
  if (!product) throw new Error(`unknown product: ${slug}`);
  return product.price;
}

/* Artwork lives next to the site as `assets/<slug>--<colour>.svg`. Qikink
   downloads the print file from us, so it needs an absolute URL. */
export function artworkPath(product, colorway) {
  const colour = colorway || product.colorways[0];
  return `assets/${product.slug}--${colour}.svg`;
}
