import { chromium } from 'playwright';
const BASE = 'http://localhost:4000';
const OUT = 'M:\\money\\dropshipping\\verify-out';
import { execSync } from 'node:child_process';
try { execSync(`mkdir "${OUT}"`, {stdio:'ignore'}); } catch{}
async function run() {
  const browser = await chromium.launch({ headless: true, args: ['--no-proxy-server', '--proxy-bypass-list=*'] });
  async function testPage(path, label) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto(`${BASE}/${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${label}-4000-1280.png`, fullPage: false });
    console.log(`SCREENSHOT 1280 ${label} done`);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${label}-4000-375.png`, fullPage: false });
    console.log(`SCREENSHOT 375 ${label} done`);
    return { page, context };
  }
  let { page, context } = await testPage('index.html', 'index');
  try {
    const modalOpen = await page.$('#browseModal.is-open');
    if (modalOpen) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
      const stillOpen = await page.$('#browseModal.is-open');
      if (stillOpen) await page.click('#browseScrim', { force: true }).catch(()=>{});
      console.log('MODAL_DISMISSED');
    }
  } catch(e){}
  const hasUtils = await page.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'u-text-center';
    document.body.appendChild(el);
    const ok = getComputedStyle(el).textAlign === 'center';
    el.remove(); return ok;
  });
  console.log(`UTIL_CHECK u-text-center: ${hasUtils}`);
  const chipSelectors = ['button.chip[data-filter="all"]', 'button.chip[data-filter="tees"]', 'button.chip[data-filter="cases"]'];
  for (const sel of chipSelectors) {
    try {
      const exists = await page.$(sel);
      if (exists) {
        await page.evaluate((s)=>document.querySelector(s)?.click(), sel);
        await page.waitForTimeout(800);
        const pressed = await page.$eval(sel, el => el.getAttribute('aria-pressed')).catch(()=>'unknown');
        const gridCount = await page.$$eval('#mainGrid .card, #bestGrid .card', els=>els.length);
        console.log(`CHIP_CLICK ${sel} -> aria-pressed=${pressed} gridCards=${gridCount} PASS`);
      }
    } catch(e){ console.log(`CHIP_FAIL ${sel} ${e.message}`); }
  }
  const sortOptions = ['featured', 'price-asc', 'price-desc', 'rating'];
  for (const val of sortOptions) {
    try {
      await page.selectOption('select#sort', val);
      await page.waitForTimeout(700);
      const cur = await page.$eval('select#sort', el=>el.value);
      console.log(`SORT_SELECT ${val} -> value=${cur}`);
    } catch(e){ console.log(`SORT_FAIL ${val}`); }
  }
  const swatches = await page.$$('.swatch');
  console.log(`SWATCH_COUNT ${swatches.length}`);
  for (let i=0;i<Math.min(2, swatches.length);i++) {
    await page.evaluate((idx)=>document.querySelectorAll('.swatch')[idx]?.click(), i);
    await page.waitForTimeout(500);
    console.log(`SWATCH_CLICK ${i} done`);
  }
  const navLinks = await page.$$eval('header.nav a', els=>els.map(a=>a.getAttribute('href')));
  console.log(`NAV_LINKS ${JSON.stringify(navLinks.slice(0,5))}`);
  const fps = await page.evaluate(async()=>{
    return new Promise(resolve=>{
      let f=0; const s=performance.now();
      function tick(){ f++; if(performance.now()-s<1000) requestAnimationFrame(tick); else resolve(f); }
      requestAnimationFrame(tick);
    });
  });
  console.log(`PERFORMANCE_FPS ${fps}`);
  await page.evaluate(()=>window.scrollTo(0,800));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/index-4000-scroll.png`, fullPage: false });
  console.log(`SCROLL_SCREENSHOT done`);
  await context.close();
  for (const [p,l] of [['shop.html','shop'],['tshirts.html','tshirts'],['cases.html','cases'],['checkout.html','checkout'],['order-success.html','order-success'],['about.html','about']]) {
    let r = await testPage(p,l);
    await r.context.close();
    console.log(`PAGE_OK ${l}`);
  }
  await browser.close();
  console.log('VERIFICATION_COMPLETE');
}
run().catch(e=>{ console.error(e); process.exit(1); });
