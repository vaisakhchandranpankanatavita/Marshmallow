#!/usr/bin/env node
/* CLI tool to verify the SKU mapping against Qikink's actual product list.
 *
 * Usage:
 *   npm run verify:qikink                 test connection and list endpoints
 *   npm run verify:qikink -- --skus       check every variant mapping
 *
 * Runs against the sandbox so it is safe to use on a dev box. The mapping
 * validation step will list every unmapped variant, so a full zero-warnings
 * state is the target before going live.
 */

import { CONFIG, describeConfig, qikinkConfigured } from './config.js';
import { PRODUCTS, sizesFor } from './catalog.js';
import { allVariants, unmappedVariants } from './skus.js';
import { accessToken, listProducts } from './qikink.js';

console.log('\n  Verifying Qikink connection...\n');

if (!qikinkConfigured()) {
  console.error('  ✗ Qikink credentials not configured');
  console.error('  Set QIKINK_CLIENT_ID and QIKINK_CLIENT_SECRET in .env\n');
  process.exit(1);
}

console.log('  Config:', JSON.stringify(describeConfig(), null, 4));

try {
  const token = await accessToken();
  console.log(`\n  ✓ Auth successful (token length: ${token.length})`);

  if (process.argv.includes('--skus')) {
    // Qikink's public API does not document a products-listing endpoint —
    // their nav is only Introduction / Authorization / Orders. This call is
    // speculative and will most likely 404; when it does, fall back to the
    // one check that doesn't need it: does every variant have *a* SKU
    // mapped. Whether that SKU is *correct* has to be eyeballed against
    // dashboard.qikink.com -> Products, there's nothing to check it against.
    let qikinkSkus = null;
    console.log('\n  Checking for a Qikink product-list endpoint (not documented — may 404)...\n');
    try {
      const result = await listProducts({ page: 1 });
      const isArray = Array.isArray(result);
      const isList = isArray || (typeof result === 'object' && result.data && Array.isArray(result.data));
      if (isList) {
        const products = isArray ? result : result.data || [];
        qikinkSkus = new Set(products.flatMap(p => [
          p.sku, p.id, p.code,
          ...((p.variants || []).map(v => v.sku || v.id || v.code))
        ]).filter(Boolean));
        console.log(`  Found ${qikinkSkus.size} SKU(s) on Qikink.\n`);
      } else {
        console.log('  Qikink returned an unexpected shape — skipping existence check.\n');
      }
    } catch (err) {
      console.log(`  No product-list endpoint available (${err.message}) — skipping existence check.`);
      console.log('  Confirm each SKU by hand against dashboard.qikink.com -> Products.\n');
    }

    const variants = allVariants();
    const unmapped = unmappedVariants();

    if (unmapped.length) {
      console.log(`  ✗ ${unmapped.length} variant(s) have no SKU mapping:`);
      unmapped.forEach(v => {
        console.log(`    • ${v.slug} (${v.colorway}, ${v.size}) → ${v.category}/${v.subcategory}`);
      });
      console.log();
    } else {
      console.log('  ✓ All variants have SKU mappings.\n');
    }

    let missing = [];
    if (qikinkSkus) {
      missing = variants.filter(v => v.sku && !qikinkSkus.has(v.sku));
      if (missing.length) {
        console.log(`  ✗ ${missing.length} mapped SKU(s) do not exist on Qikink:`);
        missing.slice(0, 20).forEach(v => {
          console.log(`    • ${v.sku} ← ${v.slug} (${v.colorway}, ${v.size})`);
        });
        if (missing.length > 20) {
          console.log(`    … and ${missing.length - 20} more`);
        }
        console.log();
      } else {
        console.log('  ✓ All mapped SKU(s) exist on Qikink.\n');
      }
    }

    const ready = unmapped.length === 0 && missing.length === 0;
    if (ready) {
      console.log(qikinkSkus
        ? '  ✅ Everything is ready to take orders!\n'
        : '  ✅ Every variant has a SKU mapped. Double-check each one by hand — see above.\n');
    } else {
      console.log('  Next steps:');
      if (unmapped.length > 0) {
        console.log('  1. Fill in server/qikink-skus.json with the codes from Qikink');
        console.log('  2. Run this script again to verify\n');
      }
      if (missing.length > 0) {
        console.log('  1. Check server/qikink-skus.json — the mapped codes do not exist');
        console.log('  2. Fix them against the SKU list above\n');
      }
      process.exit(1);
    }
  }
} catch (err) {
  console.error('  ✗ Error:', err.message);
  if (err.body) {
    console.error('    Response:', JSON.stringify(err.body, null, 2).split('\n').slice(0, 8).join('\n    '));
  }
  console.error();
  process.exit(1);
}
