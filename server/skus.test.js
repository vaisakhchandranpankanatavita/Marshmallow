import test from 'node:test';
import assert from 'node:assert/strict';
import { skuFor } from './skus.js';

test('skuFor', async t => {
  await t.test('returns the explicit override for the real Qikink product', () => {
    const sku = skuFor('anime-clear-case', 'cream', 'iPhone 16 Pro');
    assert.ok(sku);
    assert.equal(sku.sku, 'qikink_iphone15_anime');
    assert.equal(sku.source, 'override');
  });

  await t.test('flags search_from_my_products from the override', () => {
    const sku = skuFor('anime-clear-case', 'cream', 'iPhone 16 Pro');
    assert.equal(sku.searchFromMyProducts, 1);
  });

  await t.test('returns null for unmapped products', () => {
    assert.equal(skuFor('no-such-product', 'cream', 'iPhone 16 Pro'), null);
  });

  await t.test('returns null for unmapped colourways', () => {
    assert.equal(skuFor('anime-clear-case', 'neon-green', 'iPhone 16 Pro'), null);
  });

  await t.test('returns null for unmapped sizes', () => {
    assert.equal(skuFor('anime-clear-case', 'cream', 'iPhone 17'), null);
  });

  await t.test('refuses a SKU for a demo tee even though BLANK_CODES could derive one', () => {
    // cosmic-checker is a demo product (js/products.js DEMO_RAW) whose fit
    // ("oversized") has a real entry in BLANK_CODES.tees — without the
    // `product.demo` guard in skuFor(), this would silently resolve to a
    // real-looking SKU and let a demo product reach a real Qikink order.
    assert.equal(skuFor('cosmic-checker', 'pink', 'M'), null);
  });
});
