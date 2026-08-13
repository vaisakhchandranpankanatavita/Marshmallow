/* Order log.
 *
 * A JSON file, not a database. It is enough to answer "what did we send Qikink
 * and what did they say", which is the question you need answered when an order
 * goes wrong — and it keeps the server dependency-free. Swap the four exported
 * functions for real queries when order volume justifies it.
 *
 * Writes go through a promise chain so two orders landing in the same tick
 * cannot interleave and truncate the file, and each write is atomic (write to a
 * temp file, then rename) so a crash mid-write cannot leave invalid JSON.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { ROOT } from './config.js';

const FILE = resolve(ROOT, 'server/data/orders.json');

let queue = Promise.resolve();

async function readAll() {
  try {
    const raw = await readFile(FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    console.warn('[storage] order log unreadable, starting a new one:', err.message);
    return [];
  }
}

async function writeAll(orders) {
  await mkdir(dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(orders, null, 2));
  await rename(tmp, FILE);
}

/* Serialises against every other mutation. Returns whatever `mutate` returns. */
function withLock(mutate) {
  const run = queue.then(async () => {
    const orders = await readAll();
    const result = await mutate(orders);
    await writeAll(orders);
    return result;
  });
  // Keep the chain alive even if this link rejects, so one bad write does not
  // wedge every later one.
  queue = run.catch(() => {});
  return run;
}

export function saveOrder(order) {
  return withLock(orders => {
    orders.push(order);
    return order;
  });
}

export function updateOrder(orderNumber, patch) {
  return withLock(orders => {
    const found = orders.find(o => o.orderNumber === orderNumber);
    if (!found) return null;
    Object.assign(found, patch, { updatedAt: new Date().toISOString() });
    return found;
  });
}

export async function findOrder(orderNumber) {
  const orders = await readAll();
  return orders.find(o => o.orderNumber === orderNumber) || null;
}

export async function listOrders({ limit = 50 } = {}) {
  const orders = await readAll();
  return orders.slice(-limit).reverse();
}
