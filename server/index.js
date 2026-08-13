/* The order backend.
 *
 * Also serves the static storefront, so `npm start` gives you the whole site on
 * one origin and the browser never needs CORS. In production you can put the
 * static files on a CDN and run this for /api alone — nothing here depends on
 * serving the HTML.
 *
 * Routes:
 *   GET  /api/health              config summary, no secrets
 *   POST /api/quote               price a bag (no side effects)
 *   POST /api/payments/razorpay   open a payment for a priced bag
 *   POST /api/orders              place the order with Qikink
 *   GET  /api/orders/:number      order status, refreshed from Qikink
 */

import { createServer } from 'node:http';
import { CONFIG, describeConfig, qikinkConfigured } from './config.js';
import { notFound, readJsonBody, sendJson, serveStatic } from './http.js';
import {
  OrderError, newOrderNumber, priceOrder, toQikinkPayload, validateCustomer, validateLines
} from './orders.js';
import { QikinkError, createOrder, getOrder } from './qikink.js';
import {
  PaymentError, assertPaymentCaptured, createPaymentOrder, razorpayConfigured, verifyPaymentSignature
} from './payments.js';
import { findOrder, saveOrder, updateOrder } from './storage.js';
import { unmappedVariants } from './skus.js';

/* ------------------------------------------------------------------ routes */

async function handleQuote(req, res) {
  const body = await readJsonBody(req);
  const gateway = body.gateway === 'COD' ? 'COD' : 'Prepaid';
  const lines = validateLines(body.lines);
  const quote = priceOrder(lines, { gateway });

  sendJson(res, 200, {
    ok: true,
    quote: {
      lines: quote.lines.map(l => ({
        slug: l.slug, colorway: l.colorway, size: l.size, qty: l.qty,
        name: l.product.name, unitPrice: l.unitPrice, lineTotal: l.lineTotal
      })),
      subtotal: quote.subtotal,
      shipping: quote.shipping,
      codFee: quote.codFee,
      total: quote.total,
      currency: quote.currency,
      codAvailable: quote.codAvailable
    },
    payment: { prepaidAvailable: razorpayConfigured() }
  });
}

/* Step one of a prepaid checkout. Prices the bag, opens a Razorpay order for
   exactly that amount and reserves our order number, so the amount the customer
   is asked to pay is one the server chose. */
async function handleCreatePayment(req, res) {
  const body = await readJsonBody(req);
  const lines = validateLines(body.lines);
  const quote = priceOrder(lines, { gateway: 'Prepaid' });
  const orderNumber = newOrderNumber();

  const payment = await createPaymentOrder({ orderNumber, amountInRupees: quote.total });

  await saveOrder({
    orderNumber,
    status: 'awaiting_payment',
    gateway: 'Prepaid',
    createdAt: new Date().toISOString(),
    quotedTotal: quote.total,
    lines: quote.lines.map(l => ({ slug: l.slug, colorway: l.colorway, size: l.size, qty: l.qty })),
    razorpayOrderId: payment.id
  });

  sendJson(res, 200, {
    ok: true,
    orderNumber,
    razorpay: { orderId: payment.id, amount: payment.amount, currency: payment.currency, keyId: payment.keyId },
    quote: { subtotal: quote.subtotal, shipping: quote.shipping, codFee: quote.codFee, total: quote.total }
  });
}

async function handlePlaceOrder(req, res) {
  const body = await readJsonBody(req);
  const gateway = body.gateway === 'COD' ? 'COD' : 'Prepaid';

  const lines = validateLines(body.lines);
  const customer = validateCustomer(body.customer);
  const quote = priceOrder(lines, { gateway });

  let orderNumber = null;
  let paymentRecord = null;

  if (gateway === 'Prepaid') {
    if (!razorpayConfigured()) {
      throw new OrderError('Online payment is not configured on this store', { field: 'gateway', code: 'no_gateway' });
    }

    // The signature proves the payment belongs to the Razorpay order we
    // opened; the capture check proves the amount. Both run before a single
    // rupee of print cost is committed.
    const verified = verifyPaymentSignature(body.payment || {});
    const reserved = await findOrder(body.orderNumber);
    if (!reserved || reserved.razorpayOrderId !== verified.orderId) {
      throw new OrderError('This payment does not match a pending order', { field: 'payment', code: 'unknown_payment' });
    }
    if (reserved.quotedTotal !== quote.total) {
      throw new OrderError('Your bag changed after payment was started — please try again', {
        field: 'lines', code: 'quote_changed'
      });
    }

    paymentRecord = await assertPaymentCaptured({
      paymentId: verified.paymentId,
      expectedRupees: quote.total
    });
    orderNumber = reserved.orderNumber;
  } else {
    orderNumber = newOrderNumber();
    await saveOrder({
      orderNumber,
      status: 'placing',
      gateway: 'COD',
      createdAt: new Date().toISOString(),
      quotedTotal: quote.total,
      lines: quote.lines.map(l => ({ slug: l.slug, colorway: l.colorway, size: l.size, qty: l.qty }))
    });
  }

  const payload = toQikinkPayload({ orderNumber, quote, customer, gateway });

  let qikinkResponse;
  try {
    qikinkResponse = await createOrder(payload);
  } catch (err) {
    // A paid order that Qikink rejected is the one case that must never be
    // lost: the money is taken and nothing is printing. Record it so it can be
    // retried or refunded by hand.
    await updateOrder(orderNumber, {
      status: gateway === 'Prepaid' ? 'paid_fulfilment_failed' : 'fulfilment_failed',
      error: { message: err.message, status: err.status ?? null, body: err.body ?? null },
      payment: paymentRecord
    });
    throw err;
  }

  const record = await updateOrder(orderNumber, {
    status: 'placed',
    customer: { name: customer.name, phone: customer.phone, email: customer.email, city: customer.city, pincode: customer.pincode },
    payment: paymentRecord,
    total: quote.total,
    qikink: {
      orderId: qikinkResponse?.order_id ?? qikinkResponse?.id ?? null,
      response: qikinkResponse
    }
  });

  sendJson(res, 201, {
    ok: true,
    orderNumber,
    status: record?.status ?? 'placed',
    total: quote.total,
    qikinkOrderId: record?.qikink?.orderId ?? null
  });
}

async function handleOrderStatus(res, orderNumber) {
  const local = await findOrder(orderNumber);
  if (!local) return sendJson(res, 404, { ok: false, reason: 'No such order' });

  let live = null;
  if (local.qikink?.orderId) {
    try {
      live = await getOrder({ qikinkOrderId: local.qikink.orderId });
    } catch (err) {
      // A tracking lookup that fails should still show what we know locally.
      console.warn(`[orders] status lookup failed for ${orderNumber}:`, err.message);
    }
  }

  sendJson(res, 200, {
    ok: true,
    order: {
      orderNumber: local.orderNumber,
      status: local.status,
      gateway: local.gateway,
      total: local.total ?? local.quotedTotal,
      createdAt: local.createdAt,
      qikinkOrderId: local.qikink?.orderId ?? null
    },
    fulfilment: live
  });
}

/* ------------------------------------------------------------ error shaping */

function fail(res, err) {
  if (err instanceof OrderError) {
    return sendJson(res, 400, { ok: false, reason: err.message, field: err.field, code: err.code });
  }
  if (err instanceof PaymentError) {
    return sendJson(res, 402, { ok: false, reason: err.message, code: err.code });
  }
  if (err instanceof QikinkError) {
    // Their error bodies can quote our payload back; that is for our logs, not
    // for the shopper's browser.
    console.error('[qikink]', err.message, JSON.stringify(err.body));
    return sendJson(res, 502, {
      ok: false,
      reason: 'We could not place this order with our print partner. Nothing has been charged twice — please try again in a minute.',
      code: 'fulfilment_unavailable'
    });
  }
  if (err.status === 400 || err.status === 413) {
    return sendJson(res, err.status, { ok: false, reason: err.message });
  }

  console.error('[server]', err);
  return sendJson(res, 500, { ok: false, reason: 'Something went wrong on our side' });
}

/* ------------------------------------------------------------------ server */

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  if (!path.startsWith('/api/')) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return notFound(res);
    return serveStatic(req, res, path).catch(() => notFound(res));
  }

  try {
    if (req.method === 'GET' && path === '/api/health') {
      return sendJson(res, 200, {
        ok: true,
        qikink: qikinkConfigured() ? describeConfig() : { configured: false },
        prepaidAvailable: razorpayConfigured(),
        unmappedVariants: unmappedVariants().length,
        commerce: CONFIG.commerce
      });
    }

    if (req.method === 'POST' && path === '/api/quote') return await handleQuote(req, res);
    if (req.method === 'POST' && path === '/api/payments/razorpay') return await handleCreatePayment(req, res);
    if (req.method === 'POST' && path === '/api/orders') return await handlePlaceOrder(req, res);

    const status = path.match(/^\/api\/orders\/([A-Za-z0-9-]+)$/);
    if (req.method === 'GET' && status) return await handleOrderStatus(res, status[1]);

    return sendJson(res, 404, { ok: false, reason: 'No such endpoint' });
  } catch (err) {
    return fail(res, err);
  }
});

server.listen(CONFIG.port, () => {
  console.log(`\n  Funky Threads — http://localhost:${CONFIG.port}\n`);
  console.log('  Qikink:', qikinkConfigured() ? JSON.stringify(describeConfig(), null, 4) : 'NOT CONFIGURED (set QIKINK_CLIENT_ID / QIKINK_CLIENT_SECRET in .env)');

  const unmapped = unmappedVariants();
  if (unmapped.length) {
    const categories = [...new Set(unmapped.map(v => v.category))].join(', ');
    console.log(`\n  ⚠ ${unmapped.length} variants have no Qikink SKU (${categories}).`);
    console.log('    Orders containing them will be refused. Fill in server/qikink-skus.json,');
    console.log('    then run `npm run verify:skus` to check them against your Qikink account.\n');
  }
  if (!razorpayConfigured()) {
    console.log('  ℹ Razorpay not configured — checkout offers COD only.\n');
  }
});
