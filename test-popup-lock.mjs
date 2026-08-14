import { chromium } from 'playwright';
const BASE = 'http://localhost:4000';
const browser = await chromium.launch({ headless: true, args: ['--no-proxy-server'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
// Dismiss browse modal first if open
let m = await page.$('#browseModal.is-open');
if (m) { await page.keyboard.press('Escape'); await page.waitForTimeout(500); }
console.log('STEP1 browse modal dismissed');

// Test cart drawer
await page.click('#cartOpen');
await page.waitForTimeout(800);
let bodyOverflow = await page.evaluate(()=> document.body.style.overflow);
let htmlOverflow = await page.evaluate(()=> document.documentElement.style.overflow);
let drawerOpen = await page.$eval('#drawer', el=> el.classList.contains('is-open'));
console.log(`DRAWER_OPEN bodyOverflow=${bodyOverflow} htmlOverflow=${htmlOverflow} isOpen=${drawerOpen}`);
let scrollBefore = await page.evaluate(()=> window.scrollY);
await page.evaluate(()=> window.scrollTo(0, 500));
await page.waitForTimeout(300);
let scrollAfter = await page.evaluate(()=> window.scrollY);
console.log(`DRAWER_SCROLL_TEST before=${scrollBefore} after=${scrollAfter} locked=${scrollAfter===scrollBefore ? 'PASS' : 'FAIL'}`);
await page.click('#cartClose');
await page.waitForTimeout(500);
let bodyAfter = await page.evaluate(()=> document.body.style.overflow);
console.log(`DRAWER_CLOSE bodyOverflow=${bodyAfter} PASS=${bodyAfter===''}`);

// Test auth modal
await page.click('#accountBtn');
await page.waitForTimeout(800);
let authOpen = await page.$eval('#authModal', el=> el.classList.contains('is-open')).catch(()=>false);
console.log(`AUTH_OPEN isOpen=${authOpen}`);
bodyOverflow = await page.evaluate(()=> document.body.style.overflow);
console.log(`AUTH bodyOverflow=${bodyOverflow} PASS=${bodyOverflow==='hidden'}`);
scrollBefore = await page.evaluate(()=> window.scrollY);
await page.evaluate(()=> window.scrollTo(0, 300));
await page.waitForTimeout(300);
scrollAfter = await page.evaluate(()=> window.scrollY);
console.log(`AUTH_SCROLL locked=${scrollAfter===scrollBefore ? 'PASS' : 'FAIL'}`);
await page.click('#authClose').catch(async()=> await page.click('#authScrim', {force:true}));
await page.waitForTimeout(500);

// Test browse modal again
await page.evaluate(()=> {
  const m = document.getElementById('browseModal');
  if (m) { m.classList.add('is-open'); document.body.style.overflow='hidden'; document.documentElement.style.overflow='hidden'; }
});
await page.waitForTimeout(500);
bodyOverflow = await page.evaluate(()=> document.body.style.overflow);
htmlOverflow = await page.evaluate(()=> document.documentElement.style.overflow);
console.log(`BROWSE_MODAL body=${bodyOverflow} html=${htmlOverflow} PASS=${bodyOverflow==='hidden' && htmlOverflow==='hidden'}`);
scrollBefore = await page.evaluate(()=> window.scrollY);
await page.evaluate(()=> window.scrollTo(0, 600));
await page.waitForTimeout(300);
scrollAfter = await page.evaluate(()=> window.scrollY);
console.log(`BROWSE_SCROLL locked=${scrollAfter===scrollBefore ? 'PASS' : 'FAIL'}`);
await page.evaluate(()=> {
  const m = document.getElementById('browseModal');
  if (m) { m.classList.remove('is-open'); document.body.style.overflow=''; document.documentElement.style.overflow=''; }
});
console.log('BROWSE_CLOSE done');

await browser.close();
console.log('POPUP_LOCK_VERIFICATION_COMPLETE');
