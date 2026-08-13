/* Qikink API client.
 *
 * Every wire-level detail of the integration is in this file — endpoint paths,
 * header names, field names, the token dance. If Qikink changes their contract,
 * or if a field name here turns out to be wrong, this is the only file to edit.
 * Nothing above it knows what a `line_items` looks like.
 *
 * Auth is a two-step: POST the client id and secret to /api/token, get back an
 * Accesstoken, then send that token *and* the client id as headers on every
 * other call. The token is cached in memory until it is close to expiry —
 * fetching a fresh one per order would work but wastes a round trip on the
 * critical path of a checkout.
 *
 * Sandbox is https://sandbox.qikink.com, live is https://api.qikink.com. Live
 * access has to be requested from your dashboard (Integration -> Custom API)
 * before it will answer.
 */

import { CONFIG, qikinkConfigured } from './config.js';

const ENDPOINTS = {
  token: '/api/token',
  order: '/api/order',
  products: '/api/products'
};

/* Qikink does not document a token lifetime we can rely on, so the cache is
   deliberately short and any 401 drops it and retries once. */
const TOKEN_TTL_MS = 20 * 60 * 1000;

let cached = null;   // { token, fetchedAt }

export class QikinkError extends Error {
  constructor(message, { status = 0, body = null, stage = 'request' } = {}) {
    super(message);
    this.name = 'QikinkError';
    this.status = status;
    this.body = body;
    this.stage = stage;
  }
}

function requireCredentials() {
  if (!qikinkConfigured()) {
    throw new QikinkError(
      'Qikink credentials are not configured — set QIKINK_CLIENT_ID and QIKINK_CLIENT_SECRET',
      { stage: 'config' }
    );
  }
}

async function readBody(res) {
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { return text; }
}

/* The token call is form-encoded, not JSON — it is the one endpoint that does
   not take a JSON body. */
async function fetchToken() {
  requireCredentials();

  const body = new URLSearchParams({
    ClientId: CONFIG.qikink.clientId,
    client_secret: CONFIG.qikink.clientSecret
  });

  const res = await fetch(CONFIG.qikink.baseUrl + ENDPOINTS.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const parsed = await readBody(res);
  if (!res.ok) {
    throw new QikinkError(`token request failed (${res.status})`, {
      status: res.status, body: parsed, stage: 'token'
    });
  }

  /* Their documented field is `Accesstoken`. The alternates are cheap
     insurance against a casing change on their side. */
  const token = typeof parsed === 'object' && parsed
    ? (parsed.Accesstoken || parsed.AccessToken || parsed.access_token || parsed.accesstoken)
    : null;

  if (!token) {
    throw new QikinkError('token response contained no access token', {
      status: res.status, body: parsed, stage: 'token'
    });
  }
  return token;
}

export async function accessToken({ force = false } = {}) {
  const fresh = cached && Date.now() - cached.fetchedAt < TOKEN_TTL_MS;
  if (fresh && !force) return cached.token;

  const token = await fetchToken();
  cached = { token, fetchedAt: Date.now() };
  return token;
}

export function clearTokenCache() { cached = null; }

/* Every non-token call goes through here so the headers, the 401 retry and the
   error shape stay identical across endpoints. */
async function call(path, { method = 'GET', body = null, query = null, retryOn401 = true } = {}) {
  requireCredentials();

  const url = new URL(CONFIG.qikink.baseUrl + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }

  const token = await accessToken();
  const headers = {
    ClientId: CONFIG.qikink.clientId,
    Accesstoken: token,
    Accept: 'application/json'
  };
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  // An expired token reads as a 401. Drop the cache and try once more before
  // failing an order that would otherwise have gone through.
  if (res.status === 401 && retryOn401) {
    clearTokenCache();
    return call(path, { method, body, query, retryOn401: false });
  }

  const parsed = await readBody(res);
  if (!res.ok) {
    throw new QikinkError(`${method} ${path} failed (${res.status})`, {
      status: res.status, body: parsed, stage: 'request'
    });
  }
  return parsed;
}

/* ------------------------------------------------------------------ orders */

/* `payload` is built by orders.js and is already in Qikink's shape — this
   function deliberately does no mapping, so there is exactly one place where
   our vocabulary becomes theirs. */
export async function createOrder(payload) {
  return call(ENDPOINTS.order, { method: 'POST', body: payload });
}

/* Qikink echoes an order back by *their* id, or by the order_number we sent.
   Both are supported so a customer-facing "track my order" only needs ours. */
export async function getOrder({ qikinkOrderId, orderNumber } = {}) {
  if (qikinkOrderId) return call(`${ENDPOINTS.order}/${encodeURIComponent(qikinkOrderId)}`);
  if (orderNumber) return call(ENDPOINTS.order, { query: { order_number: orderNumber } });
  throw new QikinkError('getOrder needs a qikinkOrderId or an orderNumber', { stage: 'config' });
}

/* ---------------------------------------------------------------- products */

/* Your product list on their side — the source of truth for SKUs. Used by
   verify-qikink.mjs to check our mapping against reality.

   NOTE: If Qikink's API does not provide a products listing endpoint,
   you will need to manually define SKU mappings in server/qikink-skus.json
   and run `npm run verify:qikink` without the --skus flag. */
export async function listProducts({ page = 1 } = {}) {
  return call(ENDPOINTS.products, { query: { page } });
}

export const endpoints = ENDPOINTS;
