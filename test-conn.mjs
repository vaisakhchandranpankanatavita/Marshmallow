import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-proxy-server'] });
const ctx = await browser.newContext({ proxy: { server: 'per-context' } });
const page = await ctx.newPage();
try { await page.goto('http://localhost:8787/index.html', { waitUntil: 'domcontentloaded', timeout: 5000 }); console.log('goto ok', await page.title()); } catch(e){ console.log('goto fail', e.message); }
await browser.close();
