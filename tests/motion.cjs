const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.resolve(__dirname, '../dist/motion.js'), 'utf8');

// Model only the view identity, preference controls and lifecycle that motion
// owns. Browser layout and the animation's visual quality are checked separately.
function environment({ storage = new Map(), systemReduced = false } = {}) {
  const listeners = new Map(), observers = [], frames = new Map();
  let frameId = 0, current, app;
  function notify(target) {
    observers.filter(observer => observer.target === target).forEach(observer => observer.callback([]));
  }
  class Element {
    constructor(classes = '') {
      this.classes = new Set(classes.split(' ').filter(Boolean));
      this.children = []; this.attributes = {}; this.properties = {}; this.selectors = {};
      this._text = ''; this.isConnected = true;
      this.classList = {
        add: (...names) => names.forEach(name => this.classes.add(name)),
        remove: (...names) => names.forEach(name => this.classes.delete(name)),
        contains: name => this.classes.has(name),
        toggle: (name, value) => value ? this.classes.add(name) : this.classes.delete(name)
      };
      this.style = {
        setProperty: (name, value) => { this.properties[name] = value; },
        removeProperty: name => { delete this.properties[name]; }
      };
    }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    getAttribute(name) { return this.attributes[name] ?? null; }
    querySelector(selector) { return this.selectors[selector] || null; }
    querySelectorAll() { return []; }
    get textContent() { return this._text; }
    set textContent(value) { this._text = value; if (app) notify(app); }
    addEventListener() {}
    removeEventListener() {}
  }
  function workspace(page = 'overview', role = 'sme') {
    const shell = new Element('shell'), activeRole = new Element(), activePage = new Element();
    const content = new Element(), stats = new Element('stats');
    activeRole.setAttribute('data-action', `role:${role}`);
    activePage.setAttribute('data-action', `nav:${page}`);
    stats.children = [new Element('stat'), new Element('stat')];
    content.children = [new Element('page-heading'), stats, new Element('panel'), new Element('footer')];
    shell.selectors = { '.role-switch .selected': activeRole, '.nav button.active': activePage, '#content': content };
    const label = new Element(), button = new Element('motion-toggle');
    button.selectors['[data-motion-label]'] = label;
    return { shell, button, label, elements: [shell, ...content.children, ...stats.children] };
  }
  current = workspace();
  app = new Element();
  app.querySelector = selector => selector === '.shell' ? current.shell : null;
  app.querySelectorAll = selector => selector === '[data-motion-toggle]'
    ? [current.button] : current.elements.filter(element => element.classes.has(selector.slice(1)));
  const html = new Element(); html.lang = 'en';
  function media(matches) {
    const callbacks = new Set();
    return {
      matches,
      addEventListener: (type, callback) => callbacks.add(callback),
      removeEventListener: (type, callback) => callbacks.delete(callback),
      change(value) { this.matches = value; callbacks.forEach(callback => callback()); }
    };
  }
  const reduced = media(systemReduced), pointer = media(false);
  const document = {
    documentElement: html, hidden: false, getElementById: () => app,
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(callback);
    },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); }
  };
  const context = {
    document,
    window: { matchMedia: query => query.includes('reduced') ? reduced : pointer },
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    MutationObserver: class {
      constructor(callback) { this.callback = callback; observers.push(this); }
      observe(target) { this.target = target; }
      disconnect() { this.target = null; }
    },
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); }
  };
  function flush() {
    for (let cycle = 0; frames.size; cycle++) {
      assert(cycle < 10, 'motion updates must settle without observing their own label forever');
      const batch = [...frames.values()]; frames.clear(); batch.forEach(callback => callback());
    }
  }
  vm.runInNewContext(source, context, { filename: 'motion.js' });
  flush();
  return {
    motion: context.window.BahtbridgeMotion, html, reduced, document, storage, observers, frames,
    get view() { return current; },
    rerender(page, role) { current = workspace(page, role); notify(app); flush(); },
    mutateResults() { notify(app); flush(); },
    language(value) { html.lang = value; notify(html); flush(); },
    clickToggle() {
      const target = { closest: selector => selector === '[data-motion-toggle]' ? current.button : null };
      listeners.get('click')?.forEach(callback => callback({ target })); flush();
    },
    flush
  };
}

const entered = view => view.elements.filter(element => element.classes.has('motion-enter'));

test('filters and chart periods stay calm; page and role navigation receive entrances', () => {
  const env = environment();
  assert.equal(entered(env.view).length, 4);
  const heading = env.view.elements.find(element => element.classes.has('page-heading'));
  const delay = heading.properties['--motion-delay'];
  env.mutateResults();
  assert.equal(heading.properties['--motion-delay'], delay);
  env.rerender('overview'); // Chart period changes replace the shell on the same page.
  assert.equal(entered(env.view).length, 0);
  assert(!env.view.shell.classes.has('motion-view-enter'));
  env.rerender('marketplace');
  assert.equal(entered(env.view).length, 4);
  env.rerender('marketplace'); // Category filters may also replace the shell.
  assert.equal(entered(env.view).length, 0);
  env.rerender('marketplace', 'lender');
  assert.equal(entered(env.view).length, 4);
});

test('the motion control pauses immediately and remembers the choice across rerenders and reloads', () => {
  const env = environment();
  env.clickToggle();
  assert(env.motion.paused);
  assert(env.html.classes.has('motion-paused'));
  assert.equal(entered(env.view).length, 0);
  env.rerender('transactions');
  assert.equal(entered(env.view).length, 0);
  assert.equal(env.view.button.getAttribute('aria-pressed'), 'true');
  assert.equal(env.view.label.textContent, 'Resume motion');
  const reload = environment({ storage: env.storage });
  assert(reload.motion.paused);
  assert.equal(entered(reload.view).length, 0);
  env.clickToggle();
  assert(!env.motion.paused);
  assert.equal(env.view.label.textContent, 'Pause motion');
  assert.equal(entered(env.view).length, 0, 'resuming should not replay the current page');
});

test('system reduced motion takes effect live and cannot be overridden by the toggle', () => {
  const env = environment();
  env.reduced.change(true); env.flush();
  assert(env.motion.reduced && env.motion.paused);
  assert(env.view.button.disabled);
  assert.equal(env.view.label.textContent, 'Reduced motion');
  env.clickToggle();
  assert(env.motion.paused);
  env.rerender('marketplace');
  assert.equal(entered(env.view).length, 0);
  env.reduced.change(false); env.flush();
  assert(!env.motion.paused);
  assert(!env.view.button.disabled);
  assert.equal(entered(env.view).length, 0);
  const initial = environment({ systemReduced: true });
  assert.equal(entered(initial.view).length, 0);
});

test('English and Thai motion controls follow language changes without replaying the view', () => {
  const env = environment();
  env.language('th');
  assert.equal(env.view.label.textContent, 'หยุดภาพเคลื่อนไหว');
  env.clickToggle();
  assert.equal(env.view.label.textContent, 'เล่นภาพเคลื่อนไหว');
  env.language('en');
  assert.equal(env.view.label.textContent, 'Resume motion');
  assert.equal(env.view.button.getAttribute('aria-label'), 'Resume motion');
  assert.equal(entered(env.view).length, 0);
});

test('cleanup disconnects observation, removes motion classes and releases the toggle', () => {
  const env = environment();
  env.motion.destroy();
  assert(env.observers.every(observer => observer.target === null));
  assert.equal(env.frames.size, 0);
  assert(!env.html.classes.has('motion-ready'));
  assert.equal(entered(env.view).length, 0);
  env.clickToggle();
  assert(!env.motion.paused);
  env.reduced.change(true);
  assert(!env.html.classes.has('motion-paused'));
});
