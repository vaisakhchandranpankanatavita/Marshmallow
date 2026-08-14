import { chromium } from 'playwright';
const BASE = 'http://localhost:4000/about.html';
const browser = await chromium.launch({ headless: true, args: ['--no-proxy-server'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

async function state(label) {
  const tx = await page.$eval('#storyTrack', el => el.style.transform);
  const idx = await page.$$eval('.story-scene', els => els.findIndex(e=>e.classList.contains('is-active')));
  const dotIdx = await page.$$eval('.story-dot', els => els.findIndex(e=>e.classList.contains('is-active')));
  const gradX = await page.$eval('.story-backdrop__gradient', el => el.style.transform).catch(()=>'none');
  const skyX = await page.$eval('.story-backdrop__skyline', el => el.style.transform);
  console.log(`${label} track=${tx} activeScene=${idx} activeDot=${dotIdx} grad=${gradX} sky=${skyX}`);
  return {tx, idx};
}

console.log('INITIAL');
await state('INIT');

// 1. Wheel scroll
await page.mouse.wheel(0, 500);
await page.waitForTimeout(900);
await state('WHEEL_500');
await page.mouse.wheel(0, 500);
await page.waitForTimeout(900);
await state('WHEEL_1000');

// 2. ArrowRight
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(800);
await state('ARROW_RIGHT');

// 3. ArrowLeft
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(800);
await state('ARROW_LEFT');

// 4. Story-dot click (go to scene 4)
const dots = await page.$$('.story-dot');
console.log(`DOTS ${dots.length}`);
if (dots.length >= 4) {
  await dots[3].click();
  await page.waitForTimeout(900);
  await state('DOT_CLICK_3');
}

// 5. Touch swipe/drag simulation via touch events
await page.evaluate(() => {
  const stage = document.getElementById('storyStage');
  const rect = stage.getBoundingClientRect();
  const x = rect.left + rect.width/2;
  const y = rect.top + rect.height/2;
  stage.dispatchEvent(new TouchEvent('touchstart', { touches: [{ clientX: x, clientY: y }], bubbles: true }));
});
await page.waitForTimeout(100);
await page.evaluate(() => {
  const stage = document.getElementById('storyStage');
  const rect = stage.getBoundingClientRect();
  const x = rect.left + rect.width/2 - 120;
  const y = rect.top + rect.height/2;
  stage.dispatchEvent(new TouchEvent('touchmove', { touches: [{ clientX: x, clientY: y }], bubbles: true }));
});
await page.waitForTimeout(600);
await state('TOUCH_DRAG');

// 6. Multi-frame sequence to confirm smooth lerp and parallax
console.log('MULTI_FRAME_START');
for (let i=0;i<5;i++) {
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(250);
  const tx = await page.$eval('#storyTrack', el => el.style.transform);
  const sky = await page.$eval('.story-backdrop__skyline', el => el.style.transform);
  console.log(`FRAME ${i} track=${tx} sky=${sky}`);
  await page.screenshot({ path: `M:\\money\\dropshipping\\verify-out\\about-multi-${i}.png`, fullPage: false });
}
console.log('MULTI_FRAME_DONE');

// Final check
const finalIdx = await page.$$eval('.story-scene', els => els.findIndex(e=>e.classList.contains('is-active')));
console.log(`FINAL_SCENE ${finalIdx}`);
await browser.close();
console.log('FULL_VERIFICATION_COMPLETE');
