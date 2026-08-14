import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-proxy-server'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await page.goto('http://localhost:4000/about.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
// Reset to start
await page.evaluate(()=> window.scrollTo(0,0));
await page.keyboard.press('Home');
await page.waitForTimeout(600);
// Touch drag via proper TouchEvent
await page.evaluate(() => {
  const stage = document.getElementById('storyStage');
  const rect = stage.getBoundingClientRect();
  const x = rect.left + rect.width/2;
  const y = rect.top + rect.height/2;
  const touch = new Touch({ identifier: 0, target: stage, clientX: x, clientY: y, force: 1 });
  stage.dispatchEvent(new TouchEvent('touchstart', { touches: [touch], changedTouches: [touch], bubbles: true }));
});
await page.waitForTimeout(100);
await page.evaluate(() => {
  const stage = document.getElementById('storyStage');
  const rect = stage.getBoundingClientRect();
  const x = rect.left + rect.width/2 - 150;
  const y = rect.top + rect.height/2;
  const touch = new Touch({ identifier: 0, target: stage, clientX: x, clientY: y, force: 1 });
  stage.dispatchEvent(new TouchEvent('touchmove', { touches: [touch], changedTouches: [touch], bubbles: true }));
});
await page.waitForTimeout(700);
let tx = await page.$eval('#storyTrack', el=> el.style.transform);
let idx = await page.$$eval('.story-scene', els=> els.findIndex(e=>e.classList.contains('is-active')));
console.log(`TOUCH_DRAG track=${tx} active=${idx} ${tx.includes('-') ? 'PASS' : 'FAIL'}`);
// Multi-frame lerp + parallax
console.log('MULTI_FRAME_START');
for (let i=0;i<5;i++) {
  await page.mouse.wheel(0, 280);
  await page.waitForTimeout(220);
  const t = await page.$eval('#storyTrack', el=> el.style.transform);
  const sky = await page.$eval('.story-backdrop__skyline', el=> el.style.transform);
  const grad = await page.$eval('.story-backdrop__gradient', el=> el.style.transform).catch(()=>'none');
  console.log(`FRAME ${i} track=${t} sky=${sky} grad=${grad}`);
  await page.screenshot({ path: `M:\\money\\dropshipping\\verify-out\\about-multi-${i}.png`, fullPage: false });
}
console.log('MULTI_FRAME_DONE');
await browser.close();
console.log('TOUCH_MULTI_COMPLETE');
