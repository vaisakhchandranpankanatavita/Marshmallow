import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-proxy-server'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await page.goto('http://localhost:4000/about.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
// Scroll to a frame scene (scene 3)
await page.mouse.wheel(0, 1500);
await page.waitForTimeout(1000);
let activeIdx = await page.$$eval('.story-scene', els=> els.findIndex(e=>e.classList.contains('is-active')));
console.log(`ACTIVE_IDX ${activeIdx}`);
let frame = await page.$('.story-scene.is-active .story-scene__frame');
let card = await page.$('.story-scene.is-active .story-scene__card');
console.log(`FRAME_EXISTS ${!!frame} CARD_EXISTS ${!!card}`);
if (frame) {
  let ft = await page.$eval('.story-scene.is-active .story-scene__frame', el=> el.style.transform);
  console.log(`FRAME_TX ${ft}`);
  console.log(`FRAME_PARALLAX ${ft.includes('translate3d') ? 'PASS' : 'FAIL'}`);
}
if (card) {
  let ct = await page.$eval('.story-scene.is-active .story-scene__card', el=> el.style.transform);
  console.log(`CARD_TX ${ct}`);
  console.log(`CARD_PARALLAX ${ct.includes('translateZ') ? 'PASS' : 'FAIL'}`);
}
let clip = await page.$eval('.story-scene.is-active .story-scene__inner', el=> getComputedStyle(el).clipPath);
console.log(`ACTIVE_CLIP ${clip.slice(0,60)}`);
let sceneTx = await page.$eval('.story-scene.is-active', el=> el.style.transform);
console.log(`SCENE_3D ${sceneTx.slice(0,80)}`);
await page.screenshot({ path: `M:\\money\\dropshipping\\verify-out\\about-creative2-1280.png`, fullPage: false });
console.log('SCREENSHOT2 done');
await browser.close();
