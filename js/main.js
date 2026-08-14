/* Rendering + interactions shared by every page. */

(function () {
  const $ = id => document.getElementById(id);
  const money = n => window.Store.money(n);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------------------------------------------------------------- toast */

  window.toast = function (message, isError) {
    const stack = $('toasts');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'toast' + (isError ? ' toast--err' : '');
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .25s, translate .25s';
      el.style.opacity = '0';
      el.style.translate = '-24px 0';
      setTimeout(() => el.remove(), 250);
    }, 2600);
  };

  /* ---------------------------------------------------------- product card */

  const stars = r => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

  /* Dot strip only appears (via CSS :empty) when a colourway has more than
     one real photo — same markup is reused on initial render and on swatch
     change, so there is exactly one place that knows the button shape. */
  function dotsButtonsHTML(images) {
    return images.length < 2 ? '' : images.map((_, i) => `
      <button class="card__dot" data-role="dot" data-idx="${i}"
              aria-label="Photo ${i + 1}" aria-pressed="${i === 0}"></button>`).join('');
  }

  function cardHTML(p, index) {
    const first = p.colorways[0];
    const images = window.PRODUCT_IMAGES(p, first);
    const sizes = window.SIZES_FOR(p);
    return `
      <article class="card" style="--i:${index % 8}" data-slug="${p.slug}" data-category="${p.category}" data-colorway="${first}" data-img-index="0">
        <div class="card__media">
          <img src="${images[0]}" alt="${p.name} in ${first}"
               data-role="img" width="600" height="600" loading="lazy">
          ${p.badge ? `<span class="card__badge" data-badge="${p.badge}">${p.badge}</span>` : ''}
          <div class="card__quick">
            <button class="btn btn--sm btn--block" data-role="quick">Quick add</button>
          </div>
          <div class="card__dots" data-role="dots" role="group" aria-label="Product photos">${dotsButtonsHTML(images)}</div>
        </div>
        <div class="card__body">
          <div class="card__meta">
            <span class="card__sub">${window.SUBCATEGORY_LABEL(p.category, p.subcategory)}</span>
            <span class="card__theme">${window.THEME_LABEL(p.theme)}</span>
            ${p.rating != null
              ? `<span class="card__rating"><span class="stars">${stars(p.rating)}</span> ${p.rating} (${p.reviews})</span>`
              : `<span class="card__rating">No reviews yet</span>`}
          </div>
          <h3 class="card__name">${p.name}</h3>
          <p class="card__tagline">${p.tagline}</p>
          <div class="swatches" role="group" aria-label="Choose a colourway">
            ${p.colorways.map((c, i) => `
              <button class="swatch" data-role="swatch" data-colorway="${c}"
                      style="background:${window.SWATCHES[c]}"
                      aria-label="${cap(c)}" aria-pressed="${i === 0}"></button>`).join('')}
          </div>
          <div class="card__price">${money(p.price)}${p.compareAt ? `<s>${money(p.compareAt)}</s>` : ''}</div>
          <div class="card__sizes" data-role="sizes" hidden>
            <p class="kicker" style="margin-bottom:.5rem;opacity:.6">Pick a size</p>
            <div class="chips">
              ${sizes.map(s => `<button class="chip btn--sm" data-role="size" data-size="${s}">${s}</button>`).join('')}
            </div>
          </div>
        </div>
      </article>`;
  }

  function renderGrid(el, products) {
    if (!el) return;
    el.innerHTML = products.length
      ? products.map((p, i) => cardHTML(p, i)).join('')
      : `<p style="grid-column:1/-1;text-align:center;padding:3rem 0;opacity:.7">
           Nothing matches all of those filters. Try clearing the theme or the fit.</p>`;
  }

  /* Card interactions are delegated from the document, so grids can re-render
     freely without rebinding anything. */
  document.addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (!card) return;
    const p = window.PRODUCT_BY_SLUG(card.dataset.slug);
    if (!p) return;

    const swatch = e.target.closest('[data-role="swatch"]');
    if (swatch) {
      const c = swatch.dataset.colorway;
      card.dataset.colorway = c;
      card.dataset.imgIndex = '0';
      const images = window.PRODUCT_IMAGES(p, c);
      const img = card.querySelector('[data-role="img"]');
      img.src = images[0];
      img.alt = `${p.name} in ${c}`;
      const dots = card.querySelector('[data-role="dots"]');
      if (dots) dots.innerHTML = dotsButtonsHTML(images);
      card.querySelectorAll('[data-role="swatch"]')
        .forEach(s => s.setAttribute('aria-pressed', s === swatch));
      return;
    }

    const dot = e.target.closest('[data-role="dot"]');
    if (dot) {
      const idx = Number(dot.dataset.idx);
      const images = window.PRODUCT_IMAGES(p, card.dataset.colorway);
      card.dataset.imgIndex = String(idx);
      const img = card.querySelector('[data-role="img"]');
      img.src = images[idx];
      dot.parentElement.querySelectorAll('[data-role="dot"]')
        .forEach(d => d.setAttribute('aria-pressed', d === dot));
      return;
    }

    if (e.target.closest('[data-role="quick"]')) {
      const box = card.querySelector('[data-role="sizes"]');
      box.hidden = !box.hidden;
      return;
    }

    const size = e.target.closest('[data-role="size"]');
    if (size) {
      const res = window.Cart.add(p.slug, card.dataset.colorway, size.dataset.size);
      if (res.ok) {
        window.toast(`Added ${p.name} · ${size.dataset.size}`);
        card.querySelector('[data-role="sizes"]').hidden = true;
        const btn = $('cartOpen');
        btn.classList.add('is-bumped');
        setTimeout(() => btn.classList.remove('is-bumped'), 400);
      } else {
        window.toast(res.reason, true);
      }
    }
  });

  /* --------------------------------------------------------- filter + sort */

  const FILTER_KEY = 'FT_FILTER';
  let filter = 'all';
  let sub = null;          // subcategory id, only meaningful when filter !== 'all'
  let theme = null;        // theme id — independent of category
  let sort = 'featured';

  function visible() {
    let out = filter === 'all'
      ? window.PRODUCTS.slice()
      : window.PRODUCTS.filter(p => p.category === filter);

    if (sub) out = out.filter(p => p.subcategory === sub);
    if (theme) out = out.filter(p => p.theme === theme);

    if (sort === 'price-asc') out.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') out.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') out.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    return out;
  }

  /* The subcategory row only exists for a chosen category — "Oversized" is
     meaningless while phone cases are also in the grid. */
  function renderSubfilters() {
    const row = $('subfilters');
    if (!row) return;

    if (filter === 'all') {
      row.innerHTML = '';
      row.hidden = true;
      return;
    }


    // Count against every active filter except this row's own, so a chip never
    // advertises a number that yields an empty grid when clicked.
    const subs = window.SUBCATEGORIES[filter] || [];
    const counts = {};
    window.PRODUCTS.forEach(p => {
      if (p.category !== filter) return;
      if (theme && p.theme !== theme) return;
      counts[p.subcategory] = (counts[p.subcategory] || 0) + 1;
    });

    row.hidden = false;
    row.innerHTML =
      `<button class="chip chip--sub" data-sub="" aria-pressed="${sub === null}">
         All ${window.CATEGORY_LABEL[filter]}
       </button>` +
      subs.filter(sc => counts[sc.id] || sc.id === sub).map(sc => `
        <button class="chip chip--sub" data-sub="${sc.id}" aria-pressed="${sub === sc.id}"
                title="${sc.blurb}">
          ${sc.label} <span class="chip__n">${counts[sc.id] || 0}</span>
        </button>`).join('');
  }

  /* Themes cross both categories, so this row is always available — unlike the
     subcategory row, which only makes sense once a category is chosen. Counts
     respect the current category so a theme showing "0" is never offered. */
  function renderThemes() {
    const row = $('themefilters');
    if (!row) return;
    const counts = {};
    window.PRODUCTS.forEach(p => {
      if (filter !== 'all' && p.category !== filter) return;
      if (sub && p.subcategory !== sub) return;
      counts[p.theme] = (counts[p.theme] || 0) + 1;
    });

    row.innerHTML =
      `<button class="chip chip--theme" data-theme="" aria-pressed="${theme === null}">All themes</button>` +
      window.THEMES.filter(t => counts[t.id] || t.id === theme).map(t => `
        <button class="chip chip--theme" data-theme="${t.id}" aria-pressed="${theme === t.id}"
                title="${t.blurb}">
          <span aria-hidden="true">${t.emoji}</span> ${t.label}
          <span class="chip__n">${counts[t.id]}</span>
        </button>`).join('');
  }

  function applyFilters() {
    let list = visible();
    // HARDEN: locked pages must never show empty due to stale theme/sub handoff
    const gridLocked = $('mainGrid')?.dataset.lockedCategory || null;
    if (gridLocked && list.length === 0 && (sub || theme)) {
      // clear stale filters and retry once
      sub = null; theme = null;
      list = visible();
      try{ sessionStorage.removeItem(FILTER_KEY); }catch(e){}
    }
    renderGrid($('mainGrid'), list);
    // fallback: ensure staggered grid becomes visible even if IntersectionObserver fails
    const gridEl = $('mainGrid');
    if (gridEl && !gridEl.classList.contains('is-in')) {
      setTimeout(()=>{ if(gridEl.children.length) gridEl.classList.add('is-in'); }, 600);
    }
    const bestEl = $('bestGrid');
    if (bestEl && bestEl.children.length && !bestEl.classList.contains('is-in')) {
      setTimeout(()=> bestEl.classList.add('is-in'), 650);
    }

    const count = $('resultCount');
    if (count) count.textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;

    $('filters')?.querySelectorAll('[data-filter]').forEach(b =>
      b.setAttribute('aria-pressed', b.dataset.filter === filter));
    renderSubfilters();
    renderThemes();

    const note = $('subNote');
    if (note) {
      const sc = (window.SUBCATEGORIES[filter] || []).find(x => x.id === sub);
      note.textContent = sc ? sc.blurb : '';
      note.hidden = !sc;
    }
  }

  function initFilters() {
    const grid = $('mainGrid');
    if (!grid) return;

    /* Dedicated category pages pin the grid to one category. The category chip
       row is absent there, so `filter` must not be reachable from the UI —
       otherwise a stray deep-link could drop phone cases onto the tee page. */
    const locked = grid.dataset.lockedCategory || null;
    if (locked) filter = locked;

    // A "Tees" link on another page hands its choice over through sessionStorage.
    // Value is "category" or "category:subcategory".
    const handoff = sessionStorage.getItem(FILTER_KEY);
    if (handoff) {
      const [cat, subId, themeId] = handoff.split(':');
      if (cat === 'theme') {
        theme = subId || null;            // "theme:anime"
      } else if (locked) {
        // On a locked page the category is fixed; only carry the finer filters,
        // and only when the incoming category matches this page.
        if (cat === locked) { sub = subId || null; theme = themeId || null; }
        else if (themeId) { theme = themeId; }
      } else {
        filter = cat || 'all';            // "cases", "cases:magsafe", "tees::anime"
        sub = subId || null;
        theme = themeId || null;
      }
      sessionStorage.removeItem(FILTER_KEY);
    }

    $('filters')?.addEventListener('click', e => {
      const b = e.target.closest('[data-filter]');
      if (!b || locked) return;
      filter = b.dataset.filter;
      sub = null;                 // a new category invalidates the old subcategory
      applyFilters();
    });

    $('subfilters')?.addEventListener('click', e => {
      const b = e.target.closest('[data-sub]');
      if (!b) return;
      sub = b.dataset.sub || null;
      applyFilters();
    });

    $('themefilters')?.addEventListener('click', e => {
      const b = e.target.closest('[data-theme]');
      if (!b) return;
      theme = b.dataset.theme || null;
      applyFilters();
    });

    $('sort')?.addEventListener('change', e => {
      sort = e.target.value;
      applyFilters();
    });

    applyFilters();
  }

  function handleFilterLink(val) {
    if (!val) return;
    const [cat, subId, themeId] = val.split(':');
    const grid = $('mainGrid');
    const locked = grid?.dataset.lockedCategory || null;
    if (cat === 'theme') {
      theme = subId || null;
    } else if (locked) {
      if (cat === locked) { sub = subId || null; theme = themeId || null; }
      else if (themeId) { theme = themeId; }
      else if (cat !== locked) return;
    } else {
      if (cat === 'tees' || cat === 'cases' || cat === 'all') filter = cat;
      sub = subId || null;
      theme = themeId || null;
    }
    // in-page filtering: if grid exists on this page, apply immediately
    if (grid) { applyFilters(); if (location.hash !== '#grid') history.replaceState(null,'','#grid'); $('grid')?.scrollIntoView({behavior:'smooth'}); }
  }

  document.querySelectorAll('[data-filter-link]').forEach(link => {
    link.addEventListener('click', e => {
      const val = link.dataset.filterLink;
      sessionStorage.setItem(FILTER_KEY, val);
      const href = link.getAttribute('href') || '';
      const isInPageGrid = href === '#grid' || href.endsWith('#grid');
      // if link is an in-page anchor on a page that has a grid, handle without navigation
      if (isInPageGrid && $('mainGrid')) {
        e.preventDefault();
        handleFilterLink(val);
      }
    });
  });
  // also handle dynamically injected tiles (theme/sub tiles) via delegation
  document.addEventListener('click', e => {
    const link = e.target.closest('[data-filter-link]');
    if (!link || link.__bound) return;
    // fallback for elements added after boot that missed the direct binding
    if (!link.dataset.__delegated) {
      link.dataset.__delegated = '1';
      const val = link.dataset.filterLink;
      const href = link.getAttribute('href') || '';
      if ((href === '#grid' || href.endsWith('#grid')) && $('mainGrid')) {
        // storage already set by direct handler if present, but ensure
        sessionStorage.setItem(FILTER_KEY, val);
      }
    }
  });

  /* ------------------------------------------------------ static sections */

  function initBestSellers() {
    const el = $('bestGrid');
    if (!el) return;
    const best = window.PRODUCTS
      .slice()
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, 6);
    renderGrid(el, best);
  }

  function initThemeTiles() {
    const el = $('themeTiles');
    if (!el) return;
    const counts = {};
    window.PRODUCTS.forEach(p => { counts[p.theme] = (counts[p.theme] || 0) + 1; });
    el.innerHTML = window.THEMES.filter(t => counts[t.id]).map(t => `
      <a class="themetile" href="shop.html#grid" data-filter-link="theme:${t.id}">
        <span class="themetile__emoji" aria-hidden="true">${t.emoji}</span>
        <h3>${t.label}</h3>
        <p>${t.blurb}</p>
        <span class="themetile__n">${counts[t.id]} design${counts[t.id] === 1 ? '' : 's'}</span>
      </a>`).join('');
    // These are injected, so they miss the document-load binding pass.
    el.querySelectorAll('[data-filter-link]').forEach(link => {
      link.addEventListener('click', () => {
        sessionStorage.setItem('FT_FILTER', link.dataset.filterLink);
      });
    });
  }

  /* Fit/style tiles per category, image + count sourced from real products.
     A subcategory with zero products is never shown — same rule as themes. */
  function initSubcatTiles(category, elId, hrefBase) {
    const el = $(elId);
    if (!el) return;
    const inCategory = window.PRODUCTS.filter(p => p.category === category);
    const counts = {};
    inCategory.forEach(p => { counts[p.subcategory] = (counts[p.subcategory] || 0) + 1; });
    const subs = (window.SUBCATEGORIES[category] || []).filter(sc => counts[sc.id]);
    if (!subs.length) { el.closest('[data-subtile-block]')?.setAttribute('hidden', ''); return; }
    el.innerHTML = subs.map(sc => {
      const sample = inCategory.find(p => p.subcategory === sc.id);
      return `
      <a class="subtile" href="${hrefBase}#grid" data-filter-link="${category}:${sc.id}">
        <img src="${window.PRODUCT_IMAGE(sample)}" alt="${sc.label}" width="600" height="600" loading="lazy">
        <div class="subtile__body"><h3>${sc.label}</h3><p>${sc.blurb}</p><span class="subtile__n">${counts[sc.id]} design${counts[sc.id] === 1 ? '' : 's'}</span></div>
      </a>`;
    }).join('');
    el.querySelectorAll('[data-filter-link]').forEach(link => {
      link.addEventListener('click', () => {
        sessionStorage.setItem('FT_FILTER', link.dataset.filterLink);
      });
    });
  }

  function initReviews() {
    const el = $('reviewGrid');
    if (!el) return;
    if (!window.REVIEWS.length) { el.closest('section')?.setAttribute('hidden', ''); return; }
    el.innerHTML = window.REVIEWS.map(r => `
      <article class="review">
        <div class="review__stars">${stars(r.rating)}</div>
        <h3 class="review__title">${r.title}</h3>
        <p class="review__body">${r.body}</p>
        <div class="review__who">
          <img src="assets/avatar-${r.initials}.svg" alt="" width="40" height="40">
          <div>
            <div class="review__name">${r.name}</div>
            <div class="review__meta">Verified buyer · ${r.product}</div>
          </div>
        </div>
      </article>`).join('');
  }

  function initFaq() {
    const el = $('faqList');
    if (!el) return;
    el.innerHTML = window.FAQS.map((f, i) => `
      <details class="acc"${i === 0 ? ' open' : ''}>
        <summary class="acc__q">${f.q}<span class="acc__sign">+</span></summary>
        <p class="acc__a">${f.a}</p>
      </details>`).join('');
  }

  /* ------------------------------------------------------------- chrome */

  function initNav() {
    const burger = $('burger');
    burger?.addEventListener('click', () => {
      const nav = $('nav');
      const open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open);
    });
  }

  function initSignup() {
    document.querySelectorAll('.signup').forEach(form => {
      const submit = form.querySelector('button');
      const input = form.querySelector('input');
      const go = e => {
        e.preventDefault();
        const v = input.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
          return window.toast('That email looks off', true);
        }
        input.value = '';
        window.toast("You're on the list — check your inbox");
      };
      form.addEventListener('submit', go);
      if (submit && form.tagName !== 'FORM') submit.addEventListener('click', go);
    });
  }

  /* ------------------------------------------------------- browse modal */

  function initBrowseModal() {
    const modal = $('browseModal');
    const scrim = $('browseScrim');
    const close = $('browseClose');
    if (!modal) return;

    const show = () => { modal.classList.add('is-open'); };
    const hide = () => { modal.classList.remove('is-open'); };

    scrim?.addEventListener('click', hide);
    close?.addEventListener('click', hide);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) hide();
    });

    show();
  }

  /* ---------------------------------------------------------------- boot */

  async function boot() {
    try {
      let status = { source: 'local', count: (window.PRODUCTS||[]).length };
      try { status = await window.Store.init(); } catch(err){ console.warn('[store] init failed, using local catalog', err); }
      console.info(`[store] catalog source: ${status.source} (${status.count} products)`);

      initBestSellers();
      initThemeTiles();
      initSubcatTiles('tees', 'teeFitTiles', 'tshirts.html');
      initSubcatTiles('cases', 'caseStyleTiles', 'cases.html');
      initFilters();
      initReviews();
      initFaq();
      initNav();
      initSignup();
      initBrowseModal();
      window.Cart.init();
      window.Auth.init();

      // Grids are populated above, so scroll.js has to (re)bind after this.
      // It listens for this rather than racing DOMContentLoaded.
      document.dispatchEvent(new CustomEvent('ft:content-ready'));
      // safety net: if filters/grid still empty due to late PRODUCTS, retry once
      setTimeout(()=>{
        const mg=$('mainGrid');
        if(mg && mg.children.length===0 && window.PRODUCTS && window.PRODUCTS.length){
          try{ applyFilters(); document.dispatchEvent(new CustomEvent('ft:content-ready')); }catch(e){ console.warn(e); }
        }
      }, 900);
    } catch(e){
      console.error('[boot] fatal', e);
      // last-ditch: try to render at least something
      try{ const g=$('mainGrid'); if(g && window.PRODUCTS){ renderGrid(g, window.PRODUCTS.slice(0,8)); g.classList.add('is-in'); } }catch(_){}
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
  // also support pages where DOMContentLoaded already fired (e.g. cached)
  if(document.readyState !== 'loading'){ setTimeout(()=>{ if(!$('mainGrid') || $('mainGrid').children.length===0) boot(); }, 400); }
})();
