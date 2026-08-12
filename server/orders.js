/* Order validation, pricing and the mapping into Qikink's payload.
 *
 * The rule that shapes this file: the browser sends *what* the customer wants,
 * never what it costs. Quantities, slugs, colourways, sizes and an address come
 * up from the page; every rupee is computed here from the catalog. A price in a
 * request body is a price the customer can edit before sending it.
 */

import { randomBytes } from 'node:crypto';
import { CONFIG } from './config.js';
import { priceOf, productBySlug, sizesFor, artworkPath } from './catalog.js';
import { skuFor } from './skus.js';

const MAX_LINES = 25;
const MAX_QTY_PER_LINE = 10;

/* Print dimensions Qikink prints the design at, in inches. A tee's front print
   area and a phone case's back are not remotely the same shape, so these are
   per category rather than one global default. */
const PRINT_SIZE = {
  tees: { width: 12, height: 14 },
  cases: { width: 3.2, height: 6.3 }
};

export class OrderError extends Error {
  constructor(message, { field = null, code = 'invalid' } = {}) {
    super(message);
    this.name = 'OrderError';
    this.field = field;
    this.code = code;
  }
}

/* ------------------------------------------------------------- validation */

const isString = v => typeof v === 'string' && v.trim().length > 0;
const clean = v => (typeof v === 'string' ? v.trim() : '');

/* Indian mobile numbers are ten digits starting 6-9. Accepts the +91 and 0
   prefixes people actually type, and stores the bare ten digits. */
export function normalisePhone(raw) {
  const digits = clean(raw).replace(/[^\d]/g, '');
  const local = digits.startsWith('91') && digits.length === 12 ? digits.slice(2)
    : digits.startsWith('0') && digits.length === 11 ? digits.slice(1)
      : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

export function validateCustomer(customer) {
  if (!customer || typeof customer !== 'object') {
    throw new OrderError('Delivery details are missing', { field: 'customer' });
  }

  const name = clean(customer.name);
  if (name.length < 2) throw new OrderError('Enter the full name for delivery', { field: 'name' });

  const phone = normalisePhone(customer.phone);
  if (!phone) throw new OrderError('Enter a valid 10-digit Indian mobile number', { field: 'phone' });

  const email = clean(customer.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new OrderError('Enter a valid email address', { field: 'email' });
  }

  const address1 = clean(customer.address1);
  if (address1.length < 6) throw new OrderError('Enter the house/flat and street', { field: 'address1' });

  const city = clean(customer.city);
  if (!isString(city)) throw new OrderError('Enter the city', { field: 'city' });

  const state = clean(customer.state);
  if (!isString(state)) throw new OrderError('Select the state', { field: 'state' });

  const pincode = clean(customer.pincode).replace(/\s/g, '');
  // Indian PIN codes are six digits and never start with zero.
  if (!/^[1-9]\d{5}$/.test(pincode)) {
    throw new OrderError('Enter a valid 6-digit PIN code', { field: 'pincode' });
  }

  // Qikink's address takes a first and last name separately.
  const parts = name.split(/\s+/);
  return {
    name,
    firstName: parts[0],
    lastName: parts.slice(1).join(' ') || parts[0],
    phone,
    email,
    address1,
    address2: clean(customer.address2),
    city,
    state,
    pincode
  };
}

export function validateLines(rawLines) {
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    throw new OrderError('Your bag is empty', { field: 'lines', code: 'empty' });
  }
  if (rawLines.length > MAX_LINES) {
    throw new OrderError(`An order can hold at most ${MAX_LINES} different items`, { field: 'lines' });
  }

  return rawLines.map((line, i) => {
    const at = `line ${i + 1}`;
    const product = productBySlug(clean(line?.slug));
    if (!product) throw new OrderError(`Unknown product in ${at}`, { field: 'lines' });

    const colorway = clean(line.colorway);
    if (!product.colorways.includes(colorway)) {
      throw new OrderError(`${product.name} does not come in ${colorway || 'that colour'}`, { field: 'lines' });
    }

    const size = clean(line.size);
    if (!sizesFor(product).includes(size)) {
      throw new OrderError(`${product.name} is not available as ${size || 'that size'}`, { field: 'lines' });
    }

    const qty = Number(line.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      throw new OrderError(`Quantity for ${product.name} must be between 1 and ${MAX_QTY_PER_LINE}`, { field: 'lines' });
    }

    return { product, slug: product.slug, colorway, size, qty };
  });
}

/* ---------------------------------------------------------------- pricing */

export function priceOrder(lines, { gateway = 'Prepaid' } = {}) {
  const { freeShippingThreshold, shippingFee, codLimit, codFee } = CONFIG.commerce;

  const priced = lines.map(l => {
    const unitPrice = priceOf(l.slug);
    return { ...l, unitPrice, lineTotal: unitPrice * l.qty };
  });

  const subtotal = priced.reduce((n, l) => n + l.lineTotal, 0);
  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
  const isCod = gateway === 'COD';

  if (isCod && subtotal > codLimit) {
    throw new OrderError(
      `Cash on Delivery is only available up to ₹${codLimit.toLocaleString('en-IN')} — please pay online for this order`,
      { field: 'gateway', code: 'cod_limit' }
    );
  }

  const codHandling = isCod ? codFee : 0;
  const total = subtotal + shipping + codHandling;

  return {
    lines: priced,
    subtotal,
    shipping,
    codFee: codHandling,
    total,
    currency: CONFIG.commerce.currency,
    freeShippingThreshold,
    codAvailable: subtotal <= codLimit
  };
}

/* ---------------------------------------------------------------- mapping */

export function newOrderNumber() {
  const d = new Date();
  const stamp = [
    d.getUTCFullYear().toString().slice(2),
    String(d.getUTCMonth() + 1).padStart(2, '0'),
    String(d.getUTCDate()).padStart(2, '0')
  ].join('');
  return `FT${stamp}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

const absoluteUrl = path => `${CONFIG.publicBaseUrl}/${path.replace(/^\/+/, '')}`;

/* Our vocabulary -> Qikink's. The field names below are their contract, not
   ours; see server/qikink.js for why they all live on this side of the fence.
 *
 * `search_from_my_products` is 0 because we send the artwork with every line
 * rather than relying on a product saved in the Qikink dashboard. Set it to 1
 * (and drop `designs`) for lines you have already created on their side. */
export function toQikinkPayload({ orderNumber, quote, customer, gateway }) {
  const lineItems = quote.lines.map(line => {
    const mapped = skuFor(line.slug, line.colorway, line.size);
    if (!mapped) {
      throw new OrderError(
        `${line.product.name} (${line.colorway}, ${line.size}) has no Qikink SKU mapped — see server/qikink-skus.json`,
        { field: 'sku', code: 'unmapped_sku' }
      );
    }

    const print = PRINT_SIZE[line.product.category] || PRINT_SIZE.tees;
    const art = absoluteUrl(artworkPath(line.product, line.colorway));

    return {
      search_from_my_products: 0,
      quantity: String(line.qty),
      price: String(line.unitPrice),
      sku: mapped.sku,
      print_type_id: mapped.printTypeId,
      designs: [{
        design_code: `${line.slug}-${line.colorway}`,
        width_inches: String(print.width),
        height_inches: String(print.height),
        placement_sku: mapped.placementSku,
        design_link: art,
        mockup_link: art
      }]
    };
  });

  return {
    order_number: orderNumber,
    qikink_shipping: CONFIG.qikink.qikinkShipping,
    gateway: gateway === 'COD' ? 'COD' : 'Prepaid',
    total_order_value: String(quote.total),
    line_items: lineItems,
    shipping_address: {
      first_name: customer.firstName,
      last_name: customer.lastName,
      address1: customer.address1,
      address2: customer.address2 || '',
      phone: customer.phone,
      email: customer.email,
      city: customer.city,
      zip: customer.pincode,
      province: customer.state,
      country_code: 'IN'
    }
  };
}
