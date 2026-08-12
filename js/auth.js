/* Account UI shell.
 *
 * ===========================================================================
 * THIS IS NOT AUTHENTICATION. It is the front-end only.
 * ===========================================================================
 * There is no server, no verification and no security here. Any OTP is
 * accepted, any password is accepted, and the "session" is a name and a
 * contact string in localStorage. It exists so the account flow can be
 * designed and reviewed, not so anyone can log in.
 *
 * Deliberate choices that follow from that:
 *   - The password field is read to validate length and then discarded. It is
 *     never stored, never logged, and never leaves the function.
 *   - The UI says it is a demo, in the modal, every time it opens. A sign-in
 *     form that looks real but accepts anything is how people end up typing a
 *     password they actually use.
 *
 * Before launch, delete the fake checks below and hand the whole flow to
 * Shopify's Customer Account API, which already does email/OTP login, password
 * reset and order history. Do not build your own credential store.
 */

window.Auth = (function () {
  const KEY = 'FT_USER_V1';
  const $ = id => document.getElementById(id);

  let user = load();
  let mode = 'signin';     // 'signin' | 'signup'
  let method = 'mobile';   // 'mobile' | 'email'
  let otpSentTo = null;

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      return raw && raw.name ? raw : null;
    } catch { return null; }
  }

  function save() {
    try {
      if (user) localStorage.setItem(KEY, JSON.stringify(user));
      else localStorage.removeItem(KEY);
    } catch (err) {
      console.warn('[auth] could not persist session:', err.message);
    }
  }

  /* ------------------------------------------------------------ validation */

  const validMobile = v => /^[6-9]\d{9}$/.test(v.replace(/[\s-]/g, ''));
  const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  /* --------------------------------------------------------------- modal */

  function open(which) {
    mode = which || 'signin';
    method = 'mobile';
    otpSentTo = null;
    render();
    $('authModal').classList.add('is-open');
    $('authModal').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('authModal').querySelector('input')?.focus(), 60);
  }

  function close() {
    $('authModal').classList.remove('is-open');
    $('authModal').setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function render() {
    const box = $('authBody');
    if (!box) return;

    const isSignup = mode === 'signup';

    if (otpSentTo) {
      box.innerHTML = `
        <p class="auth__lead">We sent a 6-digit code to <strong>${otpSentTo}</strong>.</p>
        <label class="field">
          <span>Enter OTP</span>
          <input id="authOtp" inputmode="numeric" maxlength="6" placeholder="······"
                 autocomplete="one-time-code">
        </label>
        <button class="btn btn--block" id="authVerify">Verify &amp; continue</button>
        <button class="auth__link" id="authBack">Use a different number</button>`;
      return;
    }

    box.innerHTML = `
      <div class="auth__tabs" role="tablist">
        <button class="auth__tab" data-mode="signin" aria-selected="${!isSignup}" role="tab">Sign in</button>
        <button class="auth__tab" data-mode="signup" aria-selected="${isSignup}" role="tab">Create account</button>
      </div>

      <div class="auth__methods">
        <button class="chip" data-method="mobile" aria-pressed="${method === 'mobile'}">Mobile OTP</button>
        <button class="chip" data-method="email" aria-pressed="${method === 'email'}">Email</button>
      </div>

      ${isSignup ? `
        <label class="field">
          <span>Full name</span>
          <input id="authName" autocomplete="name" placeholder="Your name">
        </label>` : ''}

      ${method === 'mobile' ? `
        <label class="field">
          <span>Mobile number</span>
          <div class="field__group">
            <span class="field__prefix">+91</span>
            <input id="authMobile" inputmode="numeric" maxlength="10"
                   autocomplete="tel-national" placeholder="98765 43210">
          </div>
        </label>
        <button class="btn btn--block" id="authSendOtp">Send OTP</button>
      ` : `
        <label class="field">
          <span>Email</span>
          <input id="authEmail" type="email" autocomplete="email" placeholder="you@email.com">
        </label>
        <label class="field">
          <span>Password</span>
          <input id="authPassword" type="password"
                 autocomplete="${isSignup ? 'new-password' : 'current-password'}"
                 placeholder="At least 8 characters">
        </label>
        <button class="btn btn--block" id="authSubmit">
          ${isSignup ? 'Create account' : 'Sign in'}
        </button>
      `}

      <p class="auth__fine">
        ${isSignup
          ? 'By creating an account you agree to our terms and privacy policy.'
          : 'Trouble signing in? Write to hello@funkythreads.in'}
      </p>`;
  }

  /* ------------------------------------------------------------- actions */

  function signIn(name, contact) {
    user = { name, contact, since: new Date().toISOString() };
    save();
    paintNav();
    close();
    window.toast(`Signed in — welcome, ${name.split(' ')[0]}`);
  }

  function signOut() {
    user = null;
    save();
    paintNav();
    window.toast('Signed out');
  }

  function handle(e) {
    const t = e.target;

    const tab = t.closest('[data-mode]');
    if (tab) { mode = tab.dataset.mode; render(); return; }

    const meth = t.closest('[data-method]');
    if (meth) { method = meth.dataset.method; render(); return; }

    if (t.closest('#authBack')) { otpSentTo = null; render(); return; }

    if (t.closest('#authSendOtp')) {
      const raw = $('authMobile').value.trim();
      if (!validMobile(raw)) {
        return window.toast('Enter a valid 10-digit Indian mobile number', true);
      }
      if (mode === 'signup' && !$('authName').value.trim()) {
        return window.toast('Tell us your name first', true);
      }
      otpSentTo = '+91 ' + raw.replace(/[\s-]/g, '');
      pendingName = mode === 'signup' ? $('authName').value.trim() : null;
      render();
      window.toast('Demo: any 6 digits will work');
      return;
    }

    if (t.closest('#authVerify')) {
      const otp = $('authOtp').value.trim();
      if (!/^\d{6}$/.test(otp)) return window.toast('Enter the 6-digit code', true);
      return signIn(pendingName || 'Friend', otpSentTo);
    }

    if (t.closest('#authSubmit')) {
      const email = $('authEmail').value.trim();
      const passwordField = $('authPassword');
      // Read the length, then let the value go. It is never stored or sent.
      const passwordLength = passwordField.value.length;
      passwordField.value = '';

      if (!validEmail(email)) return window.toast('That email looks off', true);
      if (passwordLength < 8) return window.toast('Password needs at least 8 characters', true);

      const name = mode === 'signup'
        ? ($('authName').value.trim() || email.split('@')[0])
        : email.split('@')[0];
      if (mode === 'signup' && !$('authName').value.trim()) {
        return window.toast('Tell us your name first', true);
      }
      return signIn(name, email);
    }
  }

  let pendingName = null;

  /* ----------------------------------------------------------------- nav */

  function paintNav() {
    const btn = $('accountBtn');
    const menu = $('accountMenu');
    if (!btn) return;

    if (user) {
      btn.textContent = user.name.trim().charAt(0).toUpperCase();
      btn.classList.add('is-in');
      btn.setAttribute('aria-label', `Account: ${user.name}`);
      if (menu) {
        menu.innerHTML = `
          <p class="account__who">${user.name}<span>${user.contact}</span></p>
          <button data-account="orders">My orders</button>
          <button data-account="addresses">Saved addresses</button>
          <button data-account="signout">Sign out</button>`;
      }
    } else {
      btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      btn.classList.remove('is-in');
      btn.setAttribute('aria-label', 'Sign in');
      if (menu) menu.innerHTML = '';
    }
  }

  function toggleMenu(force) {
    const menu = $('accountMenu');
    if (!menu) return;
    const open = force !== undefined ? force : menu.hidden;
    menu.hidden = !open;
    $('accountBtn')?.setAttribute('aria-expanded', String(open));
  }

  /* ---------------------------------------------------------------- boot */

  function init() {
    paintNav();

    $('accountBtn')?.addEventListener('click', e => {
      e.stopPropagation();
      if (user) toggleMenu();
      else open('signin');
    });

    $('accountMenu')?.addEventListener('click', e => {
      const b = e.target.closest('[data-account]');
      if (!b) return;
      toggleMenu(false);
      if (b.dataset.account === 'signout') return signOut();
      window.toast('Demo build — no order history behind this yet');
    });

    document.addEventListener('click', () => toggleMenu(false));

    $('authClose')?.addEventListener('click', close);
    $('authScrim')?.addEventListener('click', close);
    $('authBody')?.addEventListener('click', handle);
    $('authModal')?.addEventListener('submit', e => e.preventDefault());

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { close(); toggleMenu(false); }
    });

    document.querySelectorAll('[data-auth-open]').forEach(el => {
      el.addEventListener('click', ev => {
        ev.preventDefault();
        open(el.dataset.authOpen);
      });
    });
  }

  return { init, open, close, signOut, get user() { return user; } };
})();
