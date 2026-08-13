/* Configuration + .env loading.
 *
 * No dotenv dependency: the file format we need is "KEY=value per line", and
 * reading it here keeps the server at zero npm dependencies. Real environment
 * variables always win over .env, so a host's config panel overrides the file.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadDotEnv(path = resolve(ROOT, '.env')) {
  let raw;
  try { raw = readFileSync(path, 'utf8'); }
  catch { return {}; }

  const out = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip one layer of matching quotes, so values with spaces survive.
    if (value.length > 1 && value[0] === value.at(-1) && (value[0] === '"' || value[0] === "'")) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const file = loadDotEnv();
const env = key => (process.env[key] ?? file[key] ?? '').trim();

/* Qikink publishes two hosts. Sandbox accepts orders and throws them away,
   which is the only safe place to test a create-order call. */
const HOSTS = {
  sandbox: 'https://sandbox.qikink.com',
  live: 'https://api.qikink.com'
};

const mode = env('QIKINK_MODE') === 'live' ? 'live' : 'sandbox';

export const CONFIG = {
  port: Number(env('PORT')) || 4000,

  qikink: {
    mode,
    baseUrl: (env('QIKINK_BASE_URL') || HOSTS[mode]).replace(/\/+$/, ''),
    clientId: env('QIKINK_CLIENT_ID'),
    clientSecret: env('QIKINK_CLIENT_SECRET'),
    /* Qikink ships the order itself unless you arrange your own courier. */
    qikinkShipping: env('QIKINK_SHIPPING') === '0' ? '0' : '1'
  },

  razorpay: {
    keyId: env('RAZORPAY_KEY_ID'),
    keySecret: env('RAZORPAY_KEY_SECRET')
  },

  /* Where Qikink's printers fetch the artwork from. Must be publicly
     reachable — their side downloads the file, your browser does not. */
  publicBaseUrl: (env('PUBLIC_BASE_URL') || `http://localhost:${Number(env('PORT')) || 4000}`)
    .replace(/\/+$/, ''),

  /* Commerce rules. These live server-side because they decide what an order
     costs; the storefront only quotes them back to the shopper. */
  commerce: {
    currency: 'INR',
    freeShippingThreshold: 1499,
    shippingFee: 79,
    codLimit: 3000,
    codFee: 49
  }
};

export const qikinkConfigured = () =>
  Boolean(CONFIG.qikink.clientId && CONFIG.qikink.clientSecret);

export const razorpayConfigured = () =>
  Boolean(CONFIG.razorpay.keyId && CONFIG.razorpay.keySecret);

/* Printed at boot so a misconfigured deploy is obvious in the logs rather
   than at the first order. Never logs the secret itself. */
export function describeConfig() {
  return {
    mode: CONFIG.qikink.mode,
    baseUrl: CONFIG.qikink.baseUrl,
    clientId: CONFIG.qikink.clientId
      ? `${CONFIG.qikink.clientId.slice(0, 4)}…${CONFIG.qikink.clientId.slice(-3)}`
      : '(missing)',
    clientSecret: CONFIG.qikink.clientSecret ? '(set)' : '(missing)',
    razorpay: razorpayConfigured() ? '(set)' : '(not configured — prepaid disabled)',
    publicBaseUrl: CONFIG.publicBaseUrl
  };
}
