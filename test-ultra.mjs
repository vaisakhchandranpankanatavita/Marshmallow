import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-proxy-server'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await page.goto('http://localhost:4000/about.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
let bg = await page.$eval('.story-stage', el => getComputedStyle(el).backgroundColor);
console.log(`STORY_BG ${bg}`);
let shopH = await page.evaluate(async () => {
  const r = await fetch('http://localhost:4000/shop.html').then(t=>t.text());
  return 'fetched';
});
// Check tshirts/cases height via new page
const p2 = await browser.newPage();
await p2.goto('http://localhost:4000/shop.html', { waitUntil: 'networkidle' });
await p2.waitForTimeout(600);
let shopHeroH = await p2.$eval('.shop-hero', el => el.getBoundingClientRect().height);
console.log(`SHOP_HERO_H ${shopHeroH}`);
await p2.goto('http://localhost:4000/tshirts.html', { waitUntil: 'networkidle' });
await p2.waitForTimeout(600);
let teeH = await p2.$eval('.tshirts-hero', el => el.getBoundingClientRect().height);
let teeBg = await p2.$eval('.tshirts-hero', el => getComputedStyle(el).backgroundColor);
let teeImgH = await p2.$eval('.tshirts-hero__art img', el => el.getBoundingClientRect().height);
console.log(`TEE_H ${teeH} BG ${teeBg} IMG_H ${teeImgH}`);
await p2.goto('http://localhost:4000/cases.html', { waitUntil: 'networkidle' });
await p2.waitForTimeout(600);
let caseH = await p2.$eval('.cases-hero', el => el.getBoundingClientRect().height);
let caseBg = await p2.$eval('.cases-hero', el => getComputedStyle(el).backgroundColor);
let caseImgH = await p2.$eval('.cases-hero__art img', el => el.getBoundingClientRect().height);
console.log(`CASE_H ${caseH} BG ${caseBg} IMG_H ${caseImgH}`);
console.log(`HEIGHT_MATCH ${Math.abs(shopHeroH - teeH) < 15 && Math.abs(shopHeroH - caseH) < 15 ? 'PASS' : 'FAIL'}`);
console.log(`BG_MATCH ${teeBg === caseBg ? 'PASS' : 'FAIL'} tee:${teeBg} case:${caseBg} shop red: rgb(224, 49, 39)`);
// Ultra smooth test
await page.bringToFront();
await page.waitForTimeout(300);
let before = await page.$eval('#storyTrack', el => el.style.transform);
await page.mouse.wheel(0, 800);
await page.waitForTimeout(1200);
let after = await page.$eval('#storyTrack', el => el.style.transform);
console.log(`ULTRA_SMOOTH before=${before} after=${after}`);
// Measure velocity smoothness: sample 5 frames
for(let i=0;i<5;i++){ await page.mouse.wheel(0, 200); await page.waitForTimeout(180); let t=await page.$eval('#storyTrack', el=> el.style.transform); console.log(`FRAME${i} ${t}`); }
await browser.close();
console.log('ULTRA_VERIFY_DONE');
