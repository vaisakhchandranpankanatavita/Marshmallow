import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-proxy-server'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await page.goto('http://localhost:4000/about.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
const scenes = await page.$$eval('.story-scene', els => els.length);
console.log(`SCENES ${scenes}`);
const stageH = await page.$eval('#storyStage', el => el.clientHeight);
console.log(`STAGE_HEIGHT ${stageH}`);
let trackX = await page.$eval('#storyTrack', el => el.style.transform);
console.log(`INITIAL_TRANSFORM ${trackX}`);
// Simulate wheel scroll
await page.mouse.wheel(0, 400);
await page.waitForTimeout(800);
let afterX = await page.$eval('#storyTrack', el => el.style.transform);
console.log(`AFTER_WHEEL_TRANSFORM ${afterX}`);
let active = await page.$eval('.story-scene.is-active', el => el.textContent.slice(0,60).replace(/\s+/g,' '));
console.log(`ACTIVE_SCENE ${active}`);
// Second wheel
await page.mouse.wheel(0, 600);
await page.waitForTimeout(800);
let after2X = await page.$eval('#storyTrack', el => el.style.transform);
console.log(`AFTER_WHEEL2 ${after2X}`);
// Check smooth: transform should be translate3d with px
const isSmooth = afterX.includes('translate3d') && after2X.includes('translate3d');
console.log(`SMOOTH_HORIZONTAL ${isSmooth ? 'PASS' : 'FAIL'}`);
await page.screenshot({ path: `M:\\money\\dropshipping\\verify-out\\about-new-1280.png`, fullPage: false });
console.log('SCREENSHOT done');
await browser.close();
