/* Rendering + interactions shared by every page. */

(function () {
  const $ = id => document.getElementById(id);
  const money = n => window.Shop.money(n);
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

  function cardHTML(p, index) {
    const first = p.colorways[0];
    const sizes = window.SIZES_FOR(p);
    return `
      <article class="card" style="--i:${index % 8}" data-slug="${p.slug}" data-colorway="${first}">
        <div class="card__media">
          <img src="${window.PRODUCT_IMAGE(p, first)}" alt="${p.name} in ${first}"
               data-role="img" width="600" height="600" loading="lazy">
          ${p.badge ? `<span class="card__badge" data-badge="${p.badge}">${p.badge}</span>` : ''}
          <div class="card__quick">
            <button class="btn btn--sm btn--block" data-role="quick">Quick add</button>
          </div>
        </div>
        <div class="card__body">
          <div class="card__rating"><span class="stars">${stars(p.rating)}</span> ${p.rating} (${p.reviews})</div>
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
           Nothing matches that filter yet.</p>`;
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
      const img = card.querySelector('[data-role="img"]');
      img.src = window.PRODUCT_IMAGE(p, c);
      img.alt = `${p.name} in ${c}`;
      card.querySelectorAll('[data-role="swatch"]')
        .forEach(s => s.setAttribute('aria-pressed', s === swatch));
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
  let sort = 'featured';

  function visible() {
    let out = filter === 'all'
      ? window.PRODUCTS.slice()
      : window.PRODUCTS.filter(p => p.category === filter);

    if (sort === 'price-asc') out.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') out.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') out.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    return out;
  }

  function applyFilters() {
    const list = visible();
    renderGrid($('mainGrid'), list);
    const count = $('resultCount');
    if (count) count.textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;
    $('filters')?.querySelectorAll('[data-filter]').forEach(b =>
      b.setAttribute('aria-pressed', b.dataset.filter === filter));
  }

  function initFilters() {
    if (!$('mainGrid')) return;

    // A "Tees" link on another page hands its choice over through sessionStorage.
    const handoff = sessionStorage.getItem(FILTER_KEY);
    if (handoff) {
      filter = handoff;
      sessionStorage.removeItem(FILTER_KEY);
    }

    $('filters')?.addEventListener('click', e => {
      const b = e.target.closest('[data-filter]');
      if (!b) return;
      filter = b.dataset.filter;
      applyFilters();
    });

    $('sort')?.addEventListener('change', e => {
      sort = e.target.value;
      applyFilters();
    });

    applyFilters();
  }

  document.querySelectorAll('[data-filter-link]').forEach(link => {
    link.addEventListener('click', () => {
      sessionStorage.setItem(FILTER_KEY, link.dataset.filterLink);
    });
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

  function initReviews() {
    const el = $('reviewGrid');
    if (!el) return;
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

  /* ---------------------------------------------------------------- boot */

  async function boot() {
    const status = await window.Shop.init();
    console.info(`[shop] catalog source: ${status.source} (${status.count} products)`);

    initBestSellers();
    initFilters();
    initReviews();
    initFaq();
    initNav();
    initSignup();
    window.Cart.init();

    // Grids are populated above, so scroll.js has to (re)bind after this.
    // It listens for this rather than racing DOMContentLoaded.
    document.dispatchEvent(new CustomEvent('ft:content-ready'));
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
