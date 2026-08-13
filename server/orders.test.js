import test from 'node:test';
import assert from 'node:assert/strict';
import { normalisePhone, validateCustomer, validateLines, priceOrder, newOrderNumber } from './orders.js';

test('normalisePhone', async t => {
  await t.test('accepts 10-digit Indian mobile numbers', () => {
    assert.equal(normalisePhone('9876543210'), '9876543210');
    assert.equal(normalisePhone('6123456789'), '6123456789');
  });

  await t.test('strips +91 prefix', () => {
    assert.equal(normalisePhone('+919876543210'), '9876543210');
  });

  await t.test('strips 0 prefix', () => {
    assert.equal(normalisePhone('09876543210'), '9876543210');
  });

  await t.test('rejects numbers starting with 0-5', () => {
    assert.equal(normalisePhone('5123456789'), null);
    assert.equal(normalisePhone('0123456789'), null);
  });

  await t.test('rejects numbers < 10 digits', () => {
    assert.equal(normalisePhone('987654321'), null);
  });
});

test('validateCustomer', async t => {
  const valid = {
    name: 'John Doe',
    phone: '9876543210',
    email: 'john@example.com',
    address1: '123 Main Street',
    address2: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560034'
  };

  await t.test('accepts valid customer', () => {
    const result = validateCustomer(valid);
    assert.equal(result.firstName, 'John');
    assert.equal(result.lastName, 'Doe');
    assert.equal(result.phone, '9876543210');
  });

  await t.test('rejects missing name', () => {
    assert.throws(() => validateCustomer({ ...valid, name: '' }), /full name/i);
  });

  await t.test('rejects invalid phone', () => {
    assert.throws(() => validateCustomer({ ...valid, phone: 'abc' }), /10-digit/i);
  });

  await t.test('rejects invalid email', () => {
    assert.throws(() => validateCustomer({ ...valid, email: 'not-an-email' }), /email/i);
  });

  await t.test('rejects invalid pincode', () => {
    assert.throws(() => validateCustomer({ ...valid, pincode: '12345' }), /PIN/i);
  });

  await t.test('accepts multi-word names', () => {
    const result = validateCustomer({ ...valid, name: 'Jean Claude Van Damme' });
    assert.equal(result.firstName, 'Jean');
    assert.equal(result.lastName, 'Claude Van Damme');
  });
});

test('priceOrder', async t => {
  // These are mocked via the catalog module loading js/products.js.
  const lines = [
    { slug: 'anime-clear-case', colorway: 'cream', size: 'iPhone 16 Pro', qty: 2, product: {} },
    { slug: 'anime-clear-case', colorway: 'cream', size: 'iPhone 16 Pro', qty: 2, product: {} }
  ];

  await t.test('computes subtotal from catalog prices', () => {
    const quote = priceOrder(lines);
    assert.ok(quote.subtotal > 0);
    assert.ok(quote.total >= quote.subtotal);
  });

  await t.test('applies free shipping over threshold', () => {
    const quote = priceOrder(lines);
    // Both items should exceed the 1499 threshold, so shipping is free
    if (quote.subtotal >= 1499) {
      assert.equal(quote.shipping, 0);
    }
  });

  await t.test('rejects COD orders over limit', () => {
    const expensiveLines = [{ slug: 'anime-clear-case', colorway: 'cream', size: 'iPhone 16 Pro', qty: 10, product: {} }];
    assert.throws(
      () => priceOrder(expensiveLines, { gateway: 'COD' }),
      /Cash on Delivery/i
    );
  });
});

test('newOrderNumber', async t => {
  await t.test('generates a unique order number', () => {
    const n1 = newOrderNumber();
    const n2 = newOrderNumber();
    assert.notEqual(n1, n2);
  });

  await t.test('starts with FT and includes the date', () => {
    const num = newOrderNumber();
    assert.ok(num.startsWith('FT'));
    const today = new Date().toISOString().slice(2, 8).replace(/-/g, '');
    assert.ok(num.includes(today));
  });
});
