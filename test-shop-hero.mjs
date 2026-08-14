import { chromium } from 'playwright';
const BASE = 'http://localhost:4000';
const browser = await chromium.launch({ headless: true, args: ['--no-proxy-server'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/shop.html`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
// Dismiss browse modal if open
let m = await page.$('#browseModal.is-open');
if (m) { await page.keyboard.press('Escape'); await page.waitForTimeout(500); }
const heroBox = await page.$eval('.shop-hero', el => {
  const r = el.getBoundingClientRect();
  return { h: r.height, top: r.top };
});
const imgBox = await page.$eval('.shop-hero__woman', el => {
  const r = el.getBoundingClientRect();
  const s = getComputedStyle(el);
  return { w: r.width, h: r.height, top: r.top, bottom: r.bottom, objectFit: s.objectFit, maxHeight: s.maxHeight, overflow: getComputedStyle(el.parentElement).overflow };
});
const heroOverflow = await page.$eval('.shop-hero', el => getComputedStyle(el).overflow);
const artOverflow = await page.$eval('.shop-hero__art', el => getComputedStyle(el).overflow);
console.log(`HERO h=${heroBox.h} overflow=${heroOverflow}`);
console.log(`ART overflow=${artOverflow}`);
console.log(`IMG w=${imgBox.w} h=${imgBox.h} top=${imgBox.top} bottom=${imgBox.bottom} objectFit=${imgBox.objectFit} maxHeight=${imgBox.maxHeight}`);
const isFullyVisible = await page.evaluate(() => {
  const img = document.querySelector('.shop-hero__woman');
  const hero = document.querySelector('.shop-hero');
  if (!img || !hero) return false;
  const ir = img.getBoundingClientRect();
  const hr = hero.getBoundingClientRect();
  // Check if image bottom is inside hero and not clipped
  return ir.bottom <= hr.bottom + 20 && ir.top >= hr.top - 20 && ir.height > 0;
});
console.log(`FULLY_VISIBLE=${isFullyVisible}`);
await page.screenshot({ path: `M:\\money\\dropshipping\\verify-out\\shop-hero-redesign-1280.png`, fullPage: false });
await page.setViewportSize({ width: 375, height: 800 });
await page.waitForTimeout(500);
await page.screenshot({ path: `M:\\money\\dropshipping\\verify-out\\shop-hero-redesign-375.png`, fullPage: false });
console.log('SCREENSHOTS done');
await browser.close();
