import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-proxy-server'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await page.goto('http://localhost:4000/about.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.mouse.wheel(0, 2500);
await page.waitForTimeout(1100);
let idx = await page.$$eval('.story-scene', els=> els.findIndex(e=>e.classList.contains('is-active')));
console.log(`ACTIVE_IDX ${idx}`);
let f = await page.$('.story-scene.is-active .story-scene__frame');
console.log(`FRAME_EXISTS ${!!f}`);
if (f) {
  let ft = await page.$eval('.story-scene.is-active .story-scene__frame', e=> e.style.transform);
  let ct = await page.$eval('.story-scene.is-active .story-scene__card', e=> e.style.transform);
  console.log(`FRAME ${ft.slice(0,80)}`);
  console.log(`CARD ${ct.slice(0,80)}`);
}
await page.screenshot({ path: `M:\\money\\dropshipping\\verify-out\\about-creative3-1280.png`, fullPage: false });
console.log('DONE');
await browser.close();
