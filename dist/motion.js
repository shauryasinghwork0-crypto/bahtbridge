/* Presentation motion only. Financial values and application state stay untouched. */
(() => {
  'use strict';
  window.BahtbridgeMotion?.destroy?.();

  const html = document.documentElement;
  const app = document.getElementById('app');
  if (!app) return;

  const preferenceKey = 'bahtbridge-motion-paused';
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)');
  let userPaused = false;
  try { userPaused = localStorage.getItem(preferenceKey) === 'true'; } catch {}
  let previousView = '';
  let refreshFrame = 0;
  let pointerFrame = 0;
  let pointerTarget = null;
  let pointerX = 0;
  let pointerY = 0;
  let destroyed = false;
  const paused = () => userPaused || Boolean(reduced?.matches);

  function clearEntrances() {
    app.querySelectorAll('.motion-enter').forEach(element => {
      element.classList.remove('motion-enter');
      element.style.removeProperty('--motion-delay');
    });
    app.querySelectorAll('.motion-view-enter').forEach(element => element.classList.remove('motion-view-enter'));
  }

  function updateControls() {
    const thai = html.lang.toLowerCase().startsWith('th');
    const system = Boolean(reduced?.matches);
    const active = paused();
    const label = system
      ? (thai ? 'ลดการเคลื่อนไหว' : 'Reduced motion')
      : active
        ? (thai ? 'เล่นภาพเคลื่อนไหว' : 'Resume motion')
        : (thai ? 'หยุดภาพเคลื่อนไหว' : 'Pause motion');
    const description = system
      ? (thai ? 'ลดการเคลื่อนไหวตามการตั้งค่าระบบของคุณ' : 'Motion is reduced by your system settings')
      : label;
    app.querySelectorAll('[data-motion-toggle]').forEach(button => {
      button.setAttribute('data-no-translate', '');
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', description);
      button.setAttribute('title', description);
      button.disabled = system;
      const text = button.querySelector('[data-motion-label]') || button.querySelector('span');
      if (text && text.textContent !== label) text.textContent = label;
    });
  }

  function resetPointer() {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    pointerX = pointerY = 0;
    pointerTarget?.style.removeProperty('--pointer-x');
    pointerTarget?.style.removeProperty('--pointer-y');
  }

  function movePointer(event) {
    if (paused() || document.hidden || !finePointer?.matches || (event.pointerType && event.pointerType !== 'mouse')) return;
    const box = pointerTarget.getBoundingClientRect();
    if (!box.width || !box.height) return;
    pointerX = Math.max(-2, Math.min(2, ((event.clientX - box.left) / box.width - .5) * 4));
    pointerY = Math.max(-2, Math.min(2, ((event.clientY - box.top) / box.height - .5) * 4));
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      if (!pointerTarget?.isConnected || paused() || document.hidden) return;
      pointerTarget.style.setProperty('--pointer-x', `${pointerX.toFixed(2)}px`);
      pointerTarget.style.setProperty('--pointer-y', `${pointerY.toFixed(2)}px`);
    });
  }

  function bindPointer(next) {
    if (next === pointerTarget) return;
    resetPointer();
    pointerTarget?.removeEventListener('pointermove', movePointer);
    pointerTarget?.removeEventListener('pointerleave', resetPointer);
    pointerTarget = next;
    pointerTarget?.addEventListener('pointermove', movePointer, { passive: true });
    pointerTarget?.addEventListener('pointerleave', resetPointer, { passive: true });
  }

  function view() {
    const shell = app.querySelector('.shell');
    if (shell) {
      const role = shell.querySelector('.role-switch .selected')?.getAttribute('data-action') || '';
      const page = shell.querySelector('.nav button.active')?.getAttribute('data-action') || '';
      return { key: `workspace:${role}:${page}`, screen: shell, type: 'workspace' };
    }
    const screen = app.querySelector('.public-page, .auth-page');
    if (!screen) return { key: '', screen: null, type: '' };
    if (screen.querySelector('.landing-hero')) return { key: 'landing', screen, type: 'landing' };
    if (screen.querySelector('.contact-layout')) return { key: 'contact', screen, type: 'contact' };
    const signin = screen.querySelector('#access-signin-form');
    if (signin) return { key: `signin:${signin.getAttribute('data-role')}`, screen, type: 'auth' };
    return { key: screen.querySelector('#access-register-form') ? 'register' : 'registered', screen, type: 'auth' };
  }

  function enter(elements, step = 65) {
    elements.filter(Boolean).forEach((element, index) => {
      element.style.setProperty('--motion-delay', `${Math.min(index * step, 420)}ms`);
      element.classList.add('motion-enter');
    });
  }

  function refresh() {
    if (destroyed) return;
    html.classList.add('motion-ready');
    html.classList.toggle('motion-paused', paused());
    html.classList.toggle('motion-background', document.hidden);
    updateControls();
    const current = view();
    bindPointer(!paused() && !document.hidden && finePointer?.matches
      ? current.screen?.querySelector('.editorial-visual') || null : null);

    if (paused()) clearEntrances();
    if (!current.screen || current.key === previousView) return;
    previousView = current.key;
    if (paused() || document.hidden) return;
    current.screen.classList.add('motion-view-enter');
    if (current.type === 'landing') {
      enter([...current.screen.querySelectorAll('.hero-copy > *, .editorial-visual')], 75);
    } else if (current.type === 'workspace') {
      const content = current.screen.querySelector('#content');
      if (content) enter([...content.children].flatMap(element => {
        if (element.classList.contains('footer')) return [];
        return element.classList.contains('stats') ? [...element.children] : [element];
      }));
    } else {
      enter([...current.screen.querySelectorAll('.auth-story, .auth-panel, .contact-story, .contact-form-panel')], 90);
    }
  }

  function scheduleRefresh() {
    if (refreshFrame || destroyed) return;
    refreshFrame = requestAnimationFrame(() => {
      refreshFrame = 0;
      refresh();
    });
  }

  function setPaused(value) {
    userPaused = Boolean(value);
    try { localStorage.setItem(preferenceKey, String(userPaused)); } catch {}
    refresh();
  }

  function onClick(event) {
    if (!event.target.closest?.('[data-motion-toggle]') || reduced?.matches) return;
    setPaused(!userPaused);
  }

  function onVisibility() {
    resetPointer();
    refresh();
  }

  const observer = typeof MutationObserver === 'function' ? new MutationObserver(scheduleRefresh) : null;
  observer?.observe(app, { childList: true, subtree: true });
  const languageObserver = typeof MutationObserver === 'function' ? new MutationObserver(scheduleRefresh) : null;
  languageObserver?.observe(html, { attributes: true, attributeFilter: ['lang'] });
  document.addEventListener('click', onClick);
  document.addEventListener('visibilitychange', onVisibility);
  reduced?.addEventListener?.('change', refresh);
  finePointer?.addEventListener?.('change', refresh);

  window.BahtbridgeMotion = {
    refresh,
    setPaused,
    get paused() { return paused(); },
    get reduced() { return Boolean(reduced?.matches); },
    destroy() {
      destroyed = true;
      observer?.disconnect();
      languageObserver?.disconnect();
      document.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVisibility);
      reduced?.removeEventListener?.('change', refresh);
      finePointer?.removeEventListener?.('change', refresh);
      if (refreshFrame) cancelAnimationFrame(refreshFrame);
      bindPointer(null);
      clearEntrances();
      html.classList.remove('motion-ready', 'motion-paused', 'motion-background');
    }
  };
  refresh();
})();
