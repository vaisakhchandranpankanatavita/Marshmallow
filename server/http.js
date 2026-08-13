/* Small helpers over node:http — body parsing, JSON replies, static files.
 * Kept apart from the routes so index.js reads as the API surface and nothing
 * else.
 */

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { ROOT } from './config.js';

const MAX_BODY_BYTES = 256 * 1024;

export function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

export function readJsonBody(req) {
  return new Promise((resolvePromise, reject) => {
    let size = 0;
    const chunks = [];

    req.on('data', chunk => {
      size += chunk.length;
      // A cart is a few kilobytes at most; anything larger is a mistake or an
      // attempt to exhaust memory. Stop reading rather than buffering it.
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Request body too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('error', reject);
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolvePromise({});
      try { resolvePromise(JSON.parse(raw)); }
      catch { reject(Object.assign(new Error('Request body was not valid JSON'), { status: 400 })); }
    });
  });
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

/* Never served, whatever the path looks like: credentials, server source, git
   history, and the local order log. The check is on the resolved path, so
   `../` cannot walk into them either. */
const BLOCKED = ['.env', '.git', 'node_modules', 'server', 'tools'];

export async function serveStatic(req, res, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const relative = normalize(decoded).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '');
  const full = resolve(join(ROOT, relative || 'index.html'));

  if (!full.startsWith(ROOT + sep) && full !== ROOT) return notFound(res);

  const firstSegment = full.slice(ROOT.length + 1).split(sep)[0];
  if (BLOCKED.includes(firstSegment) || firstSegment.startsWith('.')) return notFound(res);

  let target = full;
  try {
    const info = await stat(target);
    if (info.isDirectory()) target = join(target, 'index.html');
  } catch {
    // Bare paths like /checkout resolve to checkout.html, so links can drop
    // the extension.
    if (!extname(target)) target += '.html';
  }

  let info;
  try { info = await stat(target); }
  catch { return notFound(res); }
  if (!info.isFile()) return notFound(res);

  res.writeHead(200, {
    'Content-Type': TYPES[extname(target).toLowerCase()] || 'application/octet-stream',
    'Content-Length': info.size,
    'Cache-Control': extname(target) === '.html' ? 'no-cache' : 'public, max-age=3600'
  });

  if (req.method === 'HEAD') return res.end();
  createReadStream(target).pipe(res);
}

export function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}
