/* Scroll behaviour.
 *
 * Everything here runs off a single passive scroll listener feeding one
 * requestAnimationFrame loop, and only ever writes transforms and opacity —
 * no layout-triggering properties, so it stays at frame rate on a long page.
 *
 * Entirely opt-in from markup:
 *
 *   data-reveal              fade + rise on entry
 *   data-stagger             same, but children come in one after another
 *   data-words               splits text into words that rise individually
 *   data-zoom                scales up slightly on entry
 *   data-parallax="0.12"     drifts against the scroll; sets --py on the node
 *   data-track="0.5"         column in a .parallel section; negative reverses
 *   data-count="2140"        counts up to the number on entry
 *
 * One page-level flag, set on <body>:
 *
 *   data-smooth              content eases after the scroll, scrollbar hidden
 *
 * All of it collapses to "just show the content" under prefers-reduced-motion.
 */

(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------- word splitting */

  /* Walks text nodes so inline markup inside a headline (<em>, <span class=hl>)
     survives the split — a naive innerHTML replace would destroy it. */
  function splitWords(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.textContent.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(node => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(chunk => {
        if (!chunk) return;
        if (/^\s+$/.test(chunk)) {
          frag.appendChild(document.createTextNode(chunk));
        } else {
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = chunk;
          frag.appendChild(span);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });

    root.querySelectorAll('.word').forEach((w, i) => w.style.setProperty('--i', i));
  }

  /* ------------------------------------------------------------- reveals */

  let io = null;

  /* Safe to call again after JS injects more markup — anything already bound
     is skipped, so words never get double-split. */
  function initReveals() {
    document.querySelectorAll('[data-words]:not([data-ft-bound])').forEach(splitWords);
    document.querySelectorAll('[data-stagger]').forEach(el => {
      [...el.children].forEach((child, i) => {
        if (!child.style.getPropertyValue('--i')) child.style.setProperty('--i', i);
      });
    });

    const targets = document.querySelectorAll(
      '[data-reveal]:not([data-ft-bound]), [data-stagger]:not([data-ft-bound]),' +
      '[data-words]:not([data-ft-bound]), [data-zoom]:not([data-ft-bound]),' +
      '[data-count]:not([data-ft-bound])'
    );
    targets.forEach(el => el.setAttribute('data-ft-bound', ''));

    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-in'));
      // Not gated on data-ft-bound, unlike the loop above: main.js's boot()
      // is async (it awaits a catalog fetch before syncCatalogStats() sets
      // the real product count), so this first pass — which runs on
      // DOMContentLoaded, before that fetch resolves — would otherwise print
      // a stale data-count from the raw HTML and, without an
      // IntersectionObserver pass to correct it later, never fix itself.
      // Cheap and idempotent, so re-running it on every call is fine.
      document.querySelectorAll('[data-count]').forEach(el => {
        el.textContent = formatCount(Number(el.dataset.count));
      });
      return;
    }

    io = io || new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        if (entry.target.dataset.count) countUp(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -70px' });

    targets.forEach(el => io.observe(el));
  }

  const formatCount = n => n.toLocaleString('en-GB');

  function countUp(el) {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.countSuffix || '';
    const start = performance.now();
    const dur = 1300;
    const tick = now => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatCount(Math.round(target * eased)) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------- parallax */

  let parallaxItems = [];

  /* Document-relative offset from layout boxes only.
     getBoundingClientRect() would include the transform we are about to write,
     which feeds the output back into the input and settles at a fixed point —
     the element then never moves again. offsetTop/offsetHeight are layout
     values and ignore transforms, so they stay a stable reference. */
  function docTop(el) {
    let y = 0, node = el;
    while (node) { y += node.offsetTop; node = node.offsetParent; }
    return y;
  }

  function collectParallax() {
    parallaxItems = [...document.querySelectorAll('[data-parallax]')].map(el => ({
      el,
      speed: parseFloat(el.dataset.parallax) || 0.1,
      top: docTop(el),
      height: el.offsetHeight,
      current: 0,
      target: 0
    }));
  }

  // Lerping current toward target each frame (rather than writing target
  // straight to the transform) is what makes the drift feel like inertia
  // instead of being pixel-locked to the scroll position — the difference
  // between "smooth parallax" and parallax that just tracks the scrollbar.
  const PARALLAX_EASE = 0.12;
  const SETTLE_EPSILON = 0.05;

  function updateParallax(vh, y) {
    let unsettled = false;
    for (const item of parallaxItems) {
      const relTop = item.top - y;
      if (relTop + item.height < -200 || relTop > vh + 200) continue;
      // -1 while the element is still below the fold, +1 once it has passed above.
      const centre = item.top + item.height / 2;
      const progress = ((y + vh / 2) - centre) / (vh / 2 + item.height / 2);
      const clamped = Math.max(-1.5, Math.min(1.5, progress));
      item.target = clamped * item.speed * -100;
      item.current += (item.target - item.current) * PARALLAX_EASE;
      if (Math.abs(item.target - item.current) > SETTLE_EPSILON) unsettled = true;
      item.el.style.setProperty('--py', item.current.toFixed(1) + 'px');
    }
    return unsettled;
  }

  /* --------------------------------------------- parallel scrolling columns */

  let tracks = [];

  /* Each column is taller than its frame; it starts centred on that overflow
     and slides across it as the section crosses the viewport, so the column is
     covered at both extremes and never reveals a gap. */
  function collectTracks() {
    tracks = [...document.querySelectorAll('[data-track]')].map(el => {
      const frame = el.closest('.parallel');
      const overflow = Math.max(0, el.scrollHeight - (frame ? frame.clientHeight : 0));
      const base = -overflow / 2;
      return {
        el, frame,
        speed: parseFloat(el.dataset.track) || 0.5,
        amplitude: overflow / 2,
        base,
        current: base,
        target: base
      };
    });
    tracks.forEach(t => {
      t.el.style.transform = `translate3d(0, ${t.base.toFixed(1)}px, 0)`;
    });
  }

  function updateTracks(vh, y) {
    let unsettled = false;
    for (const t of tracks) {
      if (!t.frame || !t.amplitude) continue;
      const rect = t.frame.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > vh + 100) continue;
      // -1 as the section enters from below, +1 as it leaves past the top.
      const progress = (vh - rect.top) / (vh + rect.height) * 2 - 1;
      t.target = t.base + progress * t.amplitude * t.speed;
      t.current += (t.target - t.current) * PARALLAX_EASE;
      if (Math.abs(t.target - t.current) > SETTLE_EPSILON) unsettled = true;
      t.el.style.transform = `translate3d(0, ${t.current.toFixed(1)}px, 0)`;
    }
    return unsettled;
  }

  /* ------------------------------------------------- scroll-driven marquee */

  const marquees = [];

  function initMarquees() {
    if (reduced) return;
    document.querySelectorAll('.marquee').forEach((wrap, idx) => {
      const track = wrap.querySelector('.marquee__track');
      if (!track) return;
      // Content is duplicated in the markup, so half the track is one full loop.
      const half = track.scrollWidth / 2;
      if (!half) return;
      wrap.classList.add('is-driven');
      marquees.push({
        wrap, track, half,
        x: 0,
        dir: idx % 2 === 0 ? -1 : 1,   // alternate direction down the page
        base: wrap.classList.contains('marquee--fast') ? 1.5 : 0.9
      });
    });
  }

  function updateMarquees(vel) {
    const boost = Math.min(Math.abs(vel) * 0.35, 22);
    for (const m of marquees) {
      m.x += m.dir * (m.base + boost);
      // Wrap by exactly one copy so the seam never shows.
      if (m.x <= -m.half) m.x += m.half;
      if (m.x >= 0) m.x -= m.half;
      m.track.style.transform = `translate3d(${m.x.toFixed(1)}px,0,0)`;
    }
  }

  /* ------------------------------------------------------ smooth page scroll */

  /* Native scroll stays in charge — we never intercept the wheel — but the
     content is drawn at an eased position that trails it, so the page glides
     to a stop instead of tracking the scrollbar pixel for pixel. Everything
     downstream (parallax, tracks, progress) is then fed that eased position
     rather than window.scrollY, or the layers would drift against a page that
     is still catching up. */
  let smooth = null;

  const SMOOTH_EASE = 0.085;

  /* Anything position:fixed has to stay a direct child of <body>: inside a
     transformed wrapper a fixed element is positioned against the wrapper, not
     the viewport, so the cart drawer, the scrim and the modals would scroll
     away with the page. */
  const SMOOTH_KEEP = '#nav, #overlay, #drawer, #authModal, .toast-stack, .progress, script, template';

  function initSmooth() {
    if (reduced || !document.body.hasAttribute('data-smooth')) return;

    const wrap = document.createElement('div');
    wrap.className = 'smooth-wrap';
    // A spacer carries the document height, since the fixed wrapper no longer
    // contributes any — without it there is nothing left to scroll.
    const spacer = document.createElement('div');
    spacer.className = 'smooth-spacer';

    const moving = [...document.body.children].filter(el => !el.matches(SMOOTH_KEEP));
    document.body.appendChild(wrap);
    document.body.appendChild(spacer);
    moving.forEach(el => wrap.appendChild(el));

    document.documentElement.classList.add('is-smooth');

    smooth = { wrap, spacer, current: window.scrollY };
    measureSmooth();

    if ('ResizeObserver' in window) {
      new ResizeObserver(() => { measureSmooth(); request(); }).observe(wrap);
    }
  }

  function measureSmooth() {
    if (!smooth) return;
    const nav = document.getElementById('nav');
    // Replaces the space the now-fixed nav used to take up in flow.
    smooth.wrap.style.paddingTop = (nav ? nav.offsetHeight : 0) + 'px';
    smooth.spacer.style.height = smooth.wrap.offsetHeight + 'px';
  }

  /* Returns the position the content is actually drawn at this frame. */
  function updateSmooth(y) {
    if (!smooth) return y;
    smooth.current += (y - smooth.current) * SMOOTH_EASE;
    if (Math.abs(y - smooth.current) < 0.05) smooth.current = y;
    smooth.wrap.style.transform = `translate3d(0, ${(-smooth.current).toFixed(2)}px, 0)`;
    return smooth.current;
  }

  /* -------------------------------------------------------- progress rail */

  let fill = null;

  function initProgress() {
    const rail = document.createElement('div');
    rail.className = 'progress';
    rail.setAttribute('aria-hidden', 'true');
    fill = document.createElement('div');
    fill.className = 'progress__fill';
    rail.appendChild(fill);
    document.body.appendChild(rail);
  }

  function updateProgress(y) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    fill.style.width = (max > 0 ? (y / max) * 100 : 0).toFixed(2) + '%';
  }

  /* ------------------------------------------------------------- the loop */

  let lastY = window.scrollY;
  let velocity = 0;
  let queued = false;

  function frame() {
    queued = false;
    const y = window.scrollY;
    const vh = window.innerHeight;

    velocity = velocity * 0.82 + (y - lastY) * 0.18;
    lastY = y;

    // Drawn position, which trails y on a data-smooth page and equals it
    // everywhere else.
    const drawY = updateSmooth(y);
    const smoothUnsettled = smooth ? Math.abs(y - smooth.current) > 0.05 : false;

    updateProgress(y);
    const parallaxUnsettled = updateParallax(vh, drawY);
    const tracksUnsettled = updateTracks(vh, drawY);
    updateMarquees(velocity);

    // Marquees animate continuously, and easing keeps drifting for a few
    // frames after the scroll itself stops, so keep ticking through both.
    if (marquees.length || smoothUnsettled || parallaxUnsettled || tracksUnsettled ||
        Math.abs(velocity) > 0.05) request();
  }

  function request() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(frame);
    }
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  /* ---------------------------------------------------------------- boot */

  function init() {
    initReveals();

    // main.js injects the product grids after boot; rebind against them.
    // Bound even under reduced motion, where initReveals just makes them visible.
    document.addEventListener('ft:content-ready', () => {
      initReveals();
      if (reduced) return;
      measureSmooth();
      collectParallax();
      collectTracks();
      request();
    });

    if (reduced) return;

    // Before initProgress and the measuring passes: it reparents the page, so
    // every cached offset below has to be taken afterwards.
    initSmooth();

    initProgress();
    collectParallax();
    collectTracks();
    initMarquees();

    window.addEventListener('scroll', request, { passive: true });

    const remeasure = debounce(() => {
      measureSmooth();
      collectParallax();
      collectTracks();
      marquees.forEach(m => { m.half = m.track.scrollWidth / 2; });
      request();
    }, 120);

    window.addEventListener('resize', remeasure, { passive: true });

    // Product images are lazy — each one that arrives reflows the page and
    // invalidates the cached offsets, so re-measure as they land. `load` does
    // not bubble, hence the capture phase.
    document.addEventListener('load', e => {
      if (e.target.tagName === 'IMG') remeasure();
    }, true);

    request();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
