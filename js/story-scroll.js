/* Story scroll — about.html only.
 *
 * The whole page is one viewport-height stage; scenes sit side by side in
 * .story-track and vertical wheel/trackpad/keyboard input drags the track
 * left instead of scrolling the document down. There is no vertical page
 * scroll here at all, so this is deliberately a separate, much smaller
 * engine than js/scroll.js rather than a mode bolted onto it.
 *
 *   #storyStage / #storyTrack   required containers
 *   .story-scene                 one per "shot"; whichever is nearest the
 *                                 stage centre gets .is-active (and keeps
 *                                 .was-active after, so its Ken Burns image
 *                                 doesn't snap back when you scroll on)
 *   #storyDots / #storyHint      optional; built/hidden automatically
 *   #storyProgress / #storyCounter optional; progress + 01/09 counter
 *   .story-floaters              optional debris at varying Z
 *
 * Collapses to an ordinary vertical page (CSS handles the layout switch)
 * under prefers-reduced-motion, and this script no-ops entirely there.
 */

(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const stage = document.getElementById('storyStage');
  const track = document.getElementById('storyTrack');
  if (!stage || !track) return;

  const scenes = [...track.children];
  if (!scenes.length) return;

  if (reduced) {
    scenes.forEach(s => s.classList.add('is-active', 'was-active'));
    return;
  }

  const dotsWrap = document.getElementById('storyDots');
  const hint = document.getElementById('storyHint');
  const progressFill = document.getElementById('storyProgress');
  const counterCur = document.getElementById('storyCounterCurrent');
  const counterTot = document.getElementById('storyCounterTotal');
  const btnPrev = document.getElementById('storyPrev');
  const btnNext = document.getElementById('storyNext');
  const floaters = document.querySelector('.story-floaters');

  if (counterTot) counterTot.textContent = String(scenes.length).padStart(2, '0');

  // Backdrop layers drift at their own (slower) rate under the foreground —
  // depth cues that keep the world reading as one continuous place instead
  // of scene 1 being physically replaced by scene 2.
  const layers = [
    { el: document.querySelector('.story-backdrop__gradient'), rate: 0.32 },
    { el: document.querySelector('.story-backdrop__grid'), rate: 0.38 },
    { el: document.querySelector('.story-backdrop__orbs'), rate: 0.18 },
    { el: document.querySelector('.story-backdrop__skyline'), rate: 0.52 },
    { el: document.querySelector('.story-backdrop__doodles'), rate: 0.75 },
    { el: document.querySelector('.story-backdrop__grain'), rate: 0.62 },
    { el: floaters, rate: 0.45 }
  ].filter(l => l.el);

  // cards that tilt with mouse
  const tiltCards = [...document.querySelectorAll('[data-tilt]')];

  let current = 0;
  let target = 0;
  let max = 0;
  let activeIndex = -1;
  let queued = false;
  let lastCurrent = 0;

  function paint() {
    const x = -current;
    const velocity = current - lastCurrent;
    lastCurrent = current;

    track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0) skewX(${(velocity * -0.06).toFixed(2)}deg)`;
    for (const l of layers) {
      l.el.style.transform = `translate3d(${(x * l.rate).toFixed(1)}px, 0, 0) translateZ(${l.rate * -80}px)`;
    }
    scenes.forEach((s) => {
      const center = stage.clientWidth / 2;
      const dist = (s.offsetLeft + s.offsetWidth / 2) - (current + center);
      const rotY = dist * 0.018;
      const z = -Math.abs(dist) * 0.14;
      const scale = 1 - Math.min(0.12, Math.abs(dist) * 0.00012);
      const prog = 1 - Math.min(1, Math.abs(dist) / (stage.clientWidth * 0.72));
      s.style.transform = `translateZ(${z.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      s.style.opacity = (0.35 + prog * 0.65).toFixed(2);
      const frame = s.querySelector('.story-scene__frame');
      const card = s.querySelector('.story-scene__card');
      if (frame) {
        const depth = parseFloat(frame.getAttribute('data-depth') || '1');
        frame.style.transform = `translate3d(${dist * -0.08 * depth}px, ${Math.sin(current * 0.0012 + s.offsetLeft * 0.001) * 4}px, 0) rotate(${dist * 0.008}deg) translateZ(${40 + prog*12}px)`;
      }
      if (card) {
        card.style.transform = `translate3d(${dist * 0.05}px, 0, 0) translateZ(${60 + prog*10}px) perspective(900px) rotateX(calc(var(--my,0)* -1deg)) rotateY(calc(var(--mx,0)* 1deg))`;
      }
    });

    // progress
    if (progressFill) {
      const pct = max ? (current / max) * 100 : 0;
      progressFill.style.width = pct.toFixed(2) + '%';
    }
    // nav button states
    if (btnPrev) btnPrev.style.opacity = current <= 2 ? '.45' : '1';
    if (btnNext) btnNext.style.opacity = current >= max - 2 ? '.45' : '1';

    // subtle floater parallax extra
    if (floaters) {
      floaters.style.transform = `translate3d(${x * 0.45}px, 0, 0)`;
    }
  }

  function measure() {
    max = Math.max(0, track.scrollWidth - stage.clientWidth);
    target = Math.min(target, max);
    current = Math.min(current, max);
    paint();
    updateActive(true);
  }

  function nearestIndex(pos) {
    let idx = 0, best = Infinity;
    scenes.forEach((s, i) => {
      const d = Math.abs(s.offsetLeft - pos);
      if (d < best) { best = d; idx = i; }
    });
    return idx;
  }

  function animateCount(el) {
    const to = parseInt(el.getAttribute('data-count') || el.textContent, 10);
    if (isNaN(to)) return;
    el.textContent = '0';
    let cur = 0;
    const dur = 900;
    const start = performance.now();
    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      cur = Math.round(eased * to);
      el.textContent = cur;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = to;
    }
    requestAnimationFrame(step);
  }

  function updateActive(force) {
    const idx = nearestIndex(current);
    if (idx === activeIndex && !force) return;
    const changed = idx !== activeIndex;
    activeIndex = idx;
    scenes.forEach((s, i) => {
      s.classList.toggle('is-active', i === idx);
      if (i === idx) s.classList.add('was-active');
    });
    if (dotsWrap) {
      [...dotsWrap.children].forEach((d, i) => d.classList.toggle('is-active', i === idx));
    }
    if (hint) hint.classList.toggle('is-hidden', idx > 0);
    if (counterCur) counterCur.textContent = String(idx + 1).padStart(2, '0');
    if (changed) {
      const activeScene = scenes[idx];
      if (activeScene) {
        activeScene.querySelectorAll('[data-count]').forEach(animateCount);
      }
    }
  }

  const EASE = 0.05;
  let velocity = 0;

  function frame() {
    queued = false;
    const delta = target - current;
    velocity += delta * 0.018;
    velocity *= 0.86;
    current += velocity + delta * EASE;
    if (Math.abs(delta) < 0.3 && Math.abs(velocity) < 0.3) { current = target; velocity = 0; }
    paint();
    updateActive();
    if (Math.abs(target - current) > 0.3 || Math.abs(velocity) > 0.3) request();
  }

  function request() {
    if (!queued) { queued = true; requestAnimationFrame(frame); }
  }

  function setTarget(v) {
    target = Math.max(0, Math.min(max, v));
    request();
  }

  function sceneStart(i) { return scenes[i] ? scenes[i].offsetLeft : 0; }

  // wheel — whichever axis moved more wins (trackpad horizontal swipe works too)
  window.addEventListener('wheel', (e) => {
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    // amplify slightly for faster feel, but clamp
    setTarget(target + delta * 0.95);
    e.preventDefault();
  }, { passive: false });

  // touch drag
  let touchX = null;
  let touchStartTarget = 0;
  stage.addEventListener('touchstart', e => {
    touchX = e.touches[0].clientX;
    touchStartTarget = target;
  }, { passive: true });
  stage.addEventListener('touchmove', e => {
    if (touchX === null) return;
    const x = e.touches[0].clientX;
    const diff = touchX - x;
    setTarget(touchStartTarget + diff);
    // allow vertical scroll if user moves vertically a lot — but we are horizontal only
    if (Math.abs(diff) > 8) e.preventDefault();
  }, { passive: false });
  stage.addEventListener('touchend', () => { touchX = null; }, { passive: true });

  // pointer drag (mouse)
  let dragging = false;
  let dragStartX = 0;
  let dragStartTarget = 0;
  stage.addEventListener('mousedown', e => {
    // ignore clicks on buttons / links / dots
    if (e.target.closest('button, a, .story-dots')) return;
    dragging = true;
    dragStartX = e.clientX;
    dragStartTarget = target;
    stage.style.cursor = 'grabbing';
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) {
      // tilt handling when not dragging
      if (tiltCards.length) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const nx = (e.clientX - cx) / (window.innerWidth / 2);
        const ny = (e.clientY - cy) / (window.innerHeight / 2);
        tiltCards.forEach(card => {
          // only active card tilts noticeably, others subtle
          const isActive = card.closest('.story-scene.is-active');
          const mul = isActive ? 1 : 0.35;
          card.style.setProperty('--mx', (nx * 6 * mul).toFixed(2));
          card.style.setProperty('--my', (ny * 6 * mul).toFixed(2));
        });
      }
      return;
    }
    const dx = dragStartX - e.clientX;
    setTarget(dragStartTarget + dx);
  });
  window.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      stage.style.cursor = '';
      // snap to nearest
      setTarget(sceneStart(nearestIndex(target)));
    }
  });
  stage.addEventListener('mouseleave', () => {
    tiltCards.forEach(c => { c.style.setProperty('--mx','0'); c.style.setProperty('--my','0'); });
  });

  window.addEventListener('keydown', (e) => {
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) {
      setTarget(sceneStart(Math.min(scenes.length - 1, activeIndex + 1)));
      e.preventDefault();
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
      setTarget(sceneStart(Math.max(0, activeIndex - 1)));
      e.preventDefault();
    } else if (e.key === 'Home') {
      setTarget(0);
      e.preventDefault();
    } else if (e.key === 'End') {
      setTarget(max);
      e.preventDefault();
    }
  });

  // dots
  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    scenes.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'story-dot';
      b.type = 'button';
      b.setAttribute('aria-label', `Go to scene ${i + 1} of ${scenes.length}`);
      b.addEventListener('click', () => setTarget(sceneStart(i)));
      dotsWrap.appendChild(b);
    });
  }

  // nav arrows
  if (btnPrev) btnPrev.addEventListener('click', () => setTarget(sceneStart(Math.max(0, activeIndex - 1))));
  if (btnNext) btnNext.addEventListener('click', () => setTarget(sceneStart(Math.min(scenes.length - 1, activeIndex + 1))));

  // click on stage edge to go next/prev (desktop helper)
  stage.addEventListener('click', (e) => {
    if (e.target.closest('button, a, .story-dots, .story-nav')) return;
    if (!dragging && Math.abs(target - current) < 2) {
      // if click on right half, go next
      const rect = stage.getBoundingClientRect();
      const mid = rect.left + rect.width / 2;
      if (e.clientX > mid) setTarget(sceneStart(Math.min(scenes.length - 1, activeIndex + 1)));
      else setTarget(sceneStart(Math.max(0, activeIndex - 1)));
    }
  });

  window.addEventListener('resize', measure, { passive: true });

  measure();
  updateActive(true);
  // initial count anim
  const first = scenes[0];
  if (first) first.querySelectorAll('[data-count]').forEach(animateCount);
})();
