/* Cart state + drawer.
 *
 * A line is identified by slug + colourway + size, so the same tee in two
 * colours is two lines. Persisted to localStorage under FT_CART_V1.
 */

window.Cart = (function () {
  const KEY = 'FT_CART_V1';
  const money = n => window.Store.money(n);
  const keyOf = l => `${l.slug}::${l.colorway}::${l.size}`;

  let lines = load();

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      // Drop anything whose product no longer exists — the catalog can change
      // under a saved cart, and a stale line would render as a blank card.
      return Array.isArray(raw)
        ? raw.filter(l => l && l.slug && window.PRODUCT_BY_SLUG(l.slug))
        : [];
    } catch { return []; }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); }
    catch (err) { console.warn('[cart] could not persist:', err.message); }
  }

  /* ---------------------------------------------------------------- state */

  function add(slug, colorway, size, qty = 1) {
    const product = window.PRODUCT_BY_SLUG(slug);
    if (!product) return { ok: false, reason: 'No such product' };
    if (!size) return { ok: false, reason: 'Pick a size first' };

    const line = { slug, colorway, size, qty };
    const existing = lines.find(l => keyOf(l) === keyOf(line));
    if (existing) existing.qty += qty;
    else lines.push(line);

    save(); render();
    return { ok: true, product };
  }

  function setQty(key, qty) {
    const line = lines.find(l => keyOf(l) === key);
    if (!line) return;
    if (qty <= 0) lines = lines.filter(l => keyOf(l) !== key);
    else line.qty = Math.min(qty, 99);
    save(); render();
  }

  function remove(key) {
    lines = lines.filter(l => keyOf(l) !== key);
    save(); render();
  }

  function clear() { lines = []; save(); render(); }

  const count = () => lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = () => lines.reduce((n, l) => {
    const p = window.PRODUCT_BY_SLUG(l.slug);
    return n + (p ? p.price * l.qty : 0);
  }, 0);

  /* ----------------------------------------------------------------- ui */

  const $ = id => document.getElementById(id);

  function open() {
    $('drawer').classList.add('is-open');
    $('drawer').setAttribute('aria-hidden', 'false');
    $('overlay').classList.add('is-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    $('cartClose').focus();
  }

  function close() {
    $('drawer').classList.remove('is-open');
    $('drawer').setAttribute('aria-hidden', 'true');
    $('overlay').classList.remove('is-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  function render() {
    const n = count();
    const badge = $('cartCount');
    if (badge) {
      badge.textContent = n;
      badge.dataset.empty = n === 0;
    }
    const dc = $('drawerCount');
    if (dc) dc.textContent = n ? `(${n})` : '';

    const wrap = $('drawerItems');
    if (!wrap) return;

    if (!lines.length) {
      wrap.innerHTML = `
        <div class="drawer__empty">
          <h3>Nothing in here yet</h3>
          <p>Your bag is suspiciously beige.</p>
          <a href="shop.html" class="btn btn--sm">Start shopping</a>
        </div>`;
      $('drawerFoot').hidden = true;
      updateShipMeter(0);
      return;
    }

    wrap.innerHTML = lines.map(l => {
      const p = window.PRODUCT_BY_SLUG(l.slug);
      const k = keyOf(l);
      return `
        <div class="line">
          <img src="${window.PRODUCT_IMAGE(p, l.colorway)}" alt="${p.name}">
          <div>
            <div class="line__name">${p.name}</div>
            <div class="line__variant">${cap(l.colorway)} · ${l.size}</div>
            <div class="line__price">${money(p.price * l.qty)}</div>
            <div class="stepper">
              <button data-qty="${k}" data-delta="-1" aria-label="Decrease quantity">−</button>
              <span>${l.qty}</span>
              <button data-qty="${k}" data-delta="1" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <button class="line__remove" data-remove="${k}">Remove</button>
        </div>`;
    }).join('');

    const sub = subtotal();
    $('subtotal').textContent = money(sub);
    $('total').textContent = money(sub);
    $('shipping').textContent =
      sub >= window.Store.CONFIG.freeShippingThreshold ? 'Free' : 'Calculated at checkout';
    const cod = $('codNote');
    if (cod) {
      const limit = window.Store.CONFIG.codLimit;
      cod.textContent = sub <= limit
        ? `Cash on Delivery available · +${money(window.Store.CONFIG.codFee)} handling`
        : `Prepaid only above ${money(limit)}`;
    }

    $('drawerFoot').hidden = false;
    updateShipMeter(sub);
  }

  function updateShipMeter(sub) {
    const threshold = window.Store.CONFIG.freeShippingThreshold;
    const fill = $('shipFill');
    const text = $('shipText');
    if (!fill || !text) return;
    const pct = Math.min(100, (sub / threshold) * 100);
    fill.style.width = pct + '%';
    text.textContent = sub >= threshold
      ? 'Nice — shipping is on us 🎉'
      : `${money(threshold - sub)} away from free shipping`;
  }

  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ------------------------------------------------------------- wiring */

  function init() {
    $('cartOpen')?.addEventListener('click', open);
    $('cartClose')?.addEventListener('click', close);
    $('overlay')?.addEventListener('click', close);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });

    $('drawerItems')?.addEventListener('click', e => {
      const q = e.target.closest('[data-qty]');
      if (q) {
        const line = lines.find(l => keyOf(l) === q.dataset.qty);
        if (line) setQty(q.dataset.qty, line.qty + Number(q.dataset.delta));
        return;
      }
      const r = e.target.closest('[data-remove]');
      if (r) remove(r.dataset.remove);
    });

    $('checkout')?.addEventListener('click', () => {
      if (!lines.length) return window.toast('Your bag is empty', true);
      window.location.href = '/checkout.html';
    });

    render();
  }

  return { init, add, remove, setQty, clear, open, close, render, count, subtotal, get lines() { return lines; } };
})();
