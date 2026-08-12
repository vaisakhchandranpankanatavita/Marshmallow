/* Payment gateway — Razorpay.
 *
 * Qikink prints and ships; it never collects money. Shopify Payments does not
 * operate in India, so the storefront needs its own gateway, and the ordering
 * has to be: take the payment, verify it *on the server*, and only then create
 * the print order. Do it the other way around and you pay for prints on every
 * abandoned payment.
 *
 * The verification is the part that matters. Razorpay's browser checkout hands
 * the page back three values, and the page can say anything it likes about
 * them. The signature is an HMAC of `<order_id>|<payment_id>` keyed with your
 * secret — which only the server has — so recomputing it here is what turns a
 * claim from the browser into a fact.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { CONFIG, razorpayConfigured } from './config.js';

const API = 'https://api.razorpay.com/v1';

export class PaymentError extends Error {
  constructor(message, { code = 'payment_failed' } = {}) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
  }
}

const authHeader = () =>
  'Basic ' + Buffer.from(`${CONFIG.razorpay.keyId}:${CONFIG.razorpay.keySecret}`).toString('base64');

/* Razorpay works in paise. Rupees here, paise on the wire — the conversion
   lives in this file only. */
export async function createPaymentOrder({ orderNumber, amountInRupees }) {
  if (!razorpayConfigured()) {
    throw new PaymentError('Online payment is not configured', { code: 'not_configured' });
  }

  const res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: Math.round(amountInRupees * 100),
      currency: CONFIG.commerce.currency,
      receipt: orderNumber,
      notes: { order_number: orderNumber }
    })
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new PaymentError(body?.error?.description || `Razorpay responded ${res.status}`);
  }
  return { id: body.id, amount: body.amount, currency: body.currency, keyId: CONFIG.razorpay.keyId };
}

/* Constant-time compare so a wrong signature cannot be narrowed down by timing
   the response. Both sides are hex of the same length, so a length mismatch is
   already a failure. */
function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!razorpayConfigured()) {
    throw new PaymentError('Online payment is not configured', { code: 'not_configured' });
  }
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new PaymentError('Payment confirmation was incomplete', { code: 'missing_fields' });
  }

  const expected = createHmac('sha256', CONFIG.razorpay.keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (!safeEqual(expected, razorpay_signature)) {
    throw new PaymentError('Payment could not be verified', { code: 'bad_signature' });
  }
  return { paymentId: razorpay_payment_id, orderId: razorpay_order_id };
}

/* Second line of defence: ask Razorpay what it actually captured. A valid
   signature proves the payment belongs to this order; it does not prove the
   amount, and the amount is the part a tampered client would change. */
export async function assertPaymentCaptured({ paymentId, expectedRupees }) {
  const res = await fetch(`${API}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: authHeader() }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new PaymentError(body?.error?.description || `Razorpay responded ${res.status}`);
  }

  const expectedPaise = Math.round(expectedRupees * 100);
  if (body.amount !== expectedPaise) {
    throw new PaymentError('Paid amount does not match the order total', { code: 'amount_mismatch' });
  }
  if (body.status !== 'captured' && body.status !== 'authorized') {
    throw new PaymentError(`Payment is ${body.status}, not captured`, { code: 'not_captured' });
  }
  return { paymentId, amount: body.amount, status: body.status, method: body.method };
}

export { razorpayConfigured };
