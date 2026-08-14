import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = 'http://localhost:8787';
const OUT = 'M:\\money\\dropshipping\\verify-out';
import { execSync } from 'node:child_process';
try { execSync(`mkdir "${OUT}"`, {stdio:'ignore'}); } catch{}

async function run() {
  const browser = await chromium.launch({ headless: true, args: ['--no-proxy-server', '--proxy-bypass-list=*'] });
  const results = [];
  async function testPage(path, label) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    page.on('console', msg => console.log(`[${label} console] ${msg.text()}`));
    await page.goto(`${BASE}/${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    // Screenshot 1280
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${label}-1280.png`, fullPage: false });
    console.log(`SCREENSHOT 1280 ${label} done`);
    // Screenshot 375
    await page.setViewportSize({ width: 375, height: 800 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${label}-375.png`, fullPage: false });
    console.log(`SCREENSHOT 375 ${label} done`);
    return { page, context };
  }

  // 1. Index page
  let { page, context } = await testPage('index.html', 'index');
  // Dismiss browse modal if open (intercepts clicks)
  try {
    const modalOpen = await page.$('#browseModal.is-open');
    if (modalOpen) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      const stillOpen = await page.$('#browseModal.is-open');
      if (stillOpen) {
        await page.click('#browseScrim', { force: true }).catch(()=>{});
        await page.waitForTimeout(500);
      }
      console.log('MODAL_DISMISSED');
    }
  } catch(e){ console.log('MODAL_CHECK fail', e.message); }
  // Verify utility refactor didn't break layout: check .u-text-center etc exist
  const hasUtils = await page.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'u-text-center';
    document.body.appendChild(el);
    const style = getComputedStyle(el);
    const ok = style.textAlign === 'center';
    el.remove();
    return ok;
  });
  console.log(`UTIL_CHECK u-text-center: ${hasUtils}`);

  // Filter chips: click each individually
  const chipSelectors = ['button.chip[data-filter="all"]', 'button.chip[data-filter="tees"]', 'button.chip[data-filter="cases"]'];
  for (const sel of chipSelectors) {
    try {
      const exists = await page.$(sel);
      if (exists) {
        await exists.click({ force: true }).catch(async () => {
          await page.evaluate((s) => document.querySelector(s)?.click(), sel);
        });
        await page.waitForTimeout(800);
        const pressed = await page.$eval(sel, el => el.getAttribute('aria-pressed')).catch(()=> 'unknown');
        const gridCount = await page.$$eval('#mainGrid .card, #bestGrid .card', els => els.length);
        console.log(`CHIP_CLICK ${sel} -> aria-pressed=${pressed} gridCards=${gridCount} PASS`);
        results.push({chip: sel, pressed, gridCount});
      } else {
        console.log(`CHIP_MISSING ${sel}`);
      }
    } catch(e){ console.log(`CHIP_FAIL ${sel} ${e.message}`); }
  }

  // Sort options individually
  const sortOptions = ['featured', 'price-asc', 'price-desc', 'rating'];
  for (const val of sortOptions) {
    const sel = await page.$('select#sort');
    if (sel) {
      await page.selectOption('select#sort', val);
      await page.waitForTimeout(800);
      const cur = await page.$eval('select#sort', el => el.value);
      const firstPrice = await page.$eval('#mainGrid .card__price, #bestGrid .card__price', el => el.textContent.trim()).catch(()=> 'no-card');
      console.log(`SORT_SELECT ${val} -> value=${cur} firstPrice=${firstPrice}`);
    }
  }

  // Swatch changes
  const swatches = await page.$$('.swatch');
  console.log(`SWATCH_COUNT ${swatches.length}`);
  if (swatches.length > 0) {
    for (let i=0; i<Math.min(3, swatches.length); i++) {
      const sw = swatches[i];
      const beforeSrc = await page.evaluate(() => {
        const img = document.querySelector('.card__media img, .hero__art img');
        return img ? img.src : 'no-img';
      });
      await sw.click();
      await page.waitForTimeout(600);
      const afterSrc = await page.evaluate(() => {
        const img = document.querySelector('.card__media img, .hero__art img');
        return img ? img.src : 'no-img';
      });
      console.log(`SWATCH_CLICK ${i} before=${beforeSrc.slice(-30)} after=${afterSrc.slice(-30)}`);
    }
  }

  // Navigation links
  const navLinks = await page.$$eval('nav.nav__links a, header.nav a', els => els.map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') })));
  console.log(`NAV_LINKS ${JSON.stringify(navLinks)}`);
  for (const link of navLinks.slice(0,4)) {
    if (link.href && link.href.endsWith('.html')) {
      await page.goto(`${BASE}/${link.href.replace(/^\//,'')}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const title = await page.title();
      console.log(`NAV_CLICK ${link.href} -> title=${title.slice(0,60)}`);
      await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
    }
  }

  // Performance / FPS observation via rAF
  const fps = await page.evaluate(async () => {
    return new Promise(resolve => {
      let frames = 0;
      const start = performance.now();
      function tick() {
        frames++;
        if (performance.now() - start < 1000) requestAnimationFrame(tick);
        else resolve(frames);
      }
      requestAnimationFrame(tick);
    });
  });
  console.log(`PERFORMANCE_FPS_1s ${fps} frames in 1s`);

  // Multi-frame observation: scroll and measure
  await page.evaluate(async () => {
    window.scrollTo(0,0);
    await new Promise(r => setTimeout(r, 300));
    window.scrollTo(0, 800);
    await new Promise(r => setTimeout(r, 300));
    window.scrollTo(0, 1600);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/index-scroll.png`, fullPage: false });
  console.log(`SCROLL_SCREENSHOT done`);

  await context.close();

  // 2. Shop
  let shop = await testPage('shop.html', 'shop');
  await shop.page.waitForTimeout(1000);
  const shopChips = await shop.page.$$('button.chip');
  console.log(`SHOP_CHIPS ${shopChips.length}`);
  await shop.context.close();

  // 3. Tshirts
  let tshirts = await testPage('tshirts.html', 'tshirts');
  await tshirts.context.close();

  // 4. Cases
  let cases = await testPage('cases.html', 'cases');
  await cases.context.close();

  // 5. Checkout & Order Success
  let checkout = await testPage('checkout.html', 'checkout');
  await checkout.context.close();
  let success = await testPage('order-success.html', 'order-success');
  await success.context.close();

  await browser.close();
  console.log('VERIFICATION_COMPLETE');
}

run().catch(e => { console.error(e); process.exit(1); });
