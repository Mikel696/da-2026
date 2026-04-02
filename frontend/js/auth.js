/* ═══════════════════════════════════════════════════════════════
   DA-2026 · Auth Module — Vanilla JS
   ─────────────────────────────────────────────────────────────
   Login / Signup modal + floating widget.
   Depends on: window.SB (supabase-client.js loaded first)
   Events dispatched: sb:signed_in, sb:signed_out
═══════════════════════════════════════════════════════════════ */

const AUTH = (() => {
  let _user = null;

  /* ── Init ── */
  function init() {
    _injectCSS();
    _injectWidget();
    SB.auth.getSession().then(({ data: { session } }) => {
      _user = session?.user ?? null;
      _renderWidget();
    });
    SB.auth.onAuthStateChange((event, session) => {
      _user = session?.user ?? null;
      _renderWidget();
      if (event === 'SIGNED_IN')  window.dispatchEvent(new CustomEvent('sb:signed_in',  { detail: _user }));
      if (event === 'SIGNED_OUT') window.dispatchEvent(new CustomEvent('sb:signed_out'));
    });
  }

  function getUser()    { return _user; }
  function getUserId()  { return _user?.id ?? null; }
  function isLoggedIn() { return !!_user; }

  /* ── Auth actions ── */
  async function signUp(email, password) {
    return await SB.auth.signUp({ email, password });
  }

  async function signIn(email, password) {
    return await SB.auth.signInWithPassword({ email, password });
  }

  async function signOut() {
    await SB.auth.signOut();
    _user = null;
    _renderWidget();
  }

  /* ── Floating widget ── */
  function _injectWidget() {
    if (document.getElementById('sb-auth-widget')) return;
    const el = document.createElement('div');
    el.id = 'sb-auth-widget';
    document.body.appendChild(el);
    _renderWidget();
  }

  function _renderWidget() {
    const el = document.getElementById('sb-auth-widget');
    if (!el) return;
    if (_user) {
      const name = _user.email?.split('@')[0] || 'User';
      el.innerHTML =
        '<span class="sb-synced">&#9679; synced</span>' +
        '<span class="sb-email">' + _escHtml(name) + '</span>' +
        '<button onclick="AUTH.signOut()" class="sb-btn-out">Salir</button>';
    } else {
      el.innerHTML = '<button onclick="AUTH.openModal()" class="sb-btn-in">\u2601 Sync</button>';
    }
  }

  /* ── Modal ── */
  function openModal() {
    let modal = document.getElementById('sb-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sb-modal';
      modal.innerHTML =
        '<div class="sb-backdrop" onclick="AUTH.closeModal()"></div>' +
        '<div class="sb-box">' +
          '<h3>\u2601 Cloud Sync</h3>' +
          '<p class="sb-sub">Sincroniza tus datos en todos los dispositivos</p>' +
          '<input id="sb-email" type="email" placeholder="Email" autocomplete="email"/>' +
          '<input id="sb-password" type="password" placeholder="Contrase\u00f1a (min. 6 chars)" autocomplete="current-password" onkeydown="if(event.key===\'Enter\')AUTH._submit(\'in\')"/>' +
          '<div class="sb-actions">' +
            '<button onclick="AUTH._submit(\'in\')">Entrar</button>' +
            '<button onclick="AUTH._submit(\'up\')" class="sb-secondary">Registrarme</button>' +
          '</div>' +
          '<p id="sb-msg" class="sb-msg"></p>' +
          '<button onclick="AUTH.closeModal()" class="sb-close">\u2715</button>' +
        '</div>';
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('sb-email')?.focus(), 100);
  }

  function closeModal() {
    const modal = document.getElementById('sb-modal');
    if (modal) modal.style.display = 'none';
  }

  async function _submit(mode) {
    const email    = document.getElementById('sb-email')?.value?.trim();
    const password = document.getElementById('sb-password')?.value;
    const msg      = document.getElementById('sb-msg');
    if (!msg) return;

    if (!email || !password) { msg.textContent = 'Completa todos los campos'; msg.className = 'sb-msg sb-err'; return; }
    if (password.length < 6)  { msg.textContent = 'La contrase\u00f1a debe tener al menos 6 caracteres'; msg.className = 'sb-msg sb-err'; return; }

    msg.textContent = 'Conectando...';
    msg.className = 'sb-msg';

    const fn = mode === 'in' ? signIn : signUp;
    const { error } = await fn(email, password);

    if (error) {
      msg.textContent = error.message;
      msg.className = 'sb-msg sb-err';
      return;
    }

    if (mode === 'up') {
      msg.textContent = '\u2705 Cuenta creada. Revisa tu email para confirmar.';
      msg.className = 'sb-msg';
    } else {
      msg.textContent = '\u2705 \u00a1Sesi\u00f3n iniciada!';
      msg.className = 'sb-msg';
      setTimeout(closeModal, 800);
    }
  }

  function _injectCSS() {
    if (document.getElementById('sb-auth-css')) return;
    const link = document.createElement('link');
    link.id = 'sb-auth-css';
    link.rel = 'stylesheet';
    link.href = 'css/auth.css';
    document.head.appendChild(link);
  }

  function _escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  return { init, getUser, getUserId, isLoggedIn, signUp, signIn, signOut, openModal, closeModal, _submit };
})();

document.addEventListener('DOMContentLoaded', AUTH.init);
