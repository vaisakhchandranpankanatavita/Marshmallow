import test from 'node:test';
import assert from 'node:assert/strict';
import { skuFor } from './skus.js';

test('skuFor', async t => {
  await t.test('derives tee SKUs from blank/colour/size codes', () => {
    // cosmic-checker is an oversized tee in several colours
    const sku = skuFor('cosmic-checker', 'pink', 'M');
    assert.ok(sku);
    assert.ok(sku.sku.includes('-')); // Has the hyphenated format
    assert.equal(sku.source, 'derived');
  });

  await t.test('returns null for unmapped products', () => {
    assert.equal(skuFor('no-such-product', 'pink', 'M'), null);
  });

  await t.test('returns null for unmapped colourways', () => {
    assert.equal(skuFor('cosmic-checker', 'neon-green', 'M'), null);
  });

  await t.test('returns null for unmapped sizes', () => {
    assert.equal(skuFor('cosmic-checker', 'pink', 'XXL-EXTRA'), null);
  });

  await t.test('includes placement and print type', () => {
    const sku = skuFor('cosmic-checker', 'pink', 'M');
    assert.ok(sku);
    assert.ok(sku.placementSku);
    assert.ok(sku.printTypeId);
  });
});
