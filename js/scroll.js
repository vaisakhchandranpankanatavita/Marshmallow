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
      targets.forEach(el => {
        el.classList.add('is-in');
        if (el.dataset.count) el.textContent = formatCount(Number(el.dataset.count));
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
      height: el.offsetHeight
    }));
  }

  function updateParallax(vh, y) {
    for (const item of parallaxItems) {
      const relTop = item.top - y;
      if (relTop + item.height < -200 || relTop > vh + 200) continue;
      // -1 while the element is still below the fold, +1 once it has passed above.
      const centre = item.top + item.height / 2;
      const progress = ((y + vh / 2) - centre) / (vh / 2 + item.height / 2);
      const clamped = Math.max(-1.5, Math.min(1.5, progress));
      item.el.style.setProperty('--py', (clamped * item.speed * -100).toFixed(1) + 'px');
    }
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
      return {
        el, frame,
        speed: parseFloat(el.dataset.track) || 0.5,
        amplitude: overflow / 2,
        base: -overflow / 2
      };
    });
    tracks.forEach(t => {
      t.el.style.transform = `translate3d(0, ${t.base.toFixed(1)}px, 0)`;
    });
  }

  function updateTracks(vh, y) {
    for (const t of tracks) {
      if (!t.frame || !t.amplitude) continue;
      const rect = t.frame.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > vh + 100) continue;
      // -1 as the section enters from below, +1 as it leaves past the top.
      const progress = (vh - rect.top) / (vh + rect.height) * 2 - 1;
      const offset = t.base + progress * t.amplitude * t.speed;
      t.el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    }
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

    updateProgress(y);
    updateParallax(vh, y);
    updateTracks(vh, y);
    updateMarquees(velocity);

    // Marquees animate continuously, so keep ticking while they exist.
    if (marquees.length || tracks.length || Math.abs(velocity) > 0.05) request();
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
      collectParallax();
      collectTracks();
      request();
    });

    if (reduced) return;

    initProgress();
    collectParallax();
    collectTracks();
    initMarquees();

    window.addEventListener('scroll', request, { passive: true });

    const remeasure = debounce(() => {
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
