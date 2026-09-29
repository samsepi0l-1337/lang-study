import assert from 'node:assert/strict';

function createContainer() {
  const factories = new Map();
  const instances = new Map();
  const stack = new Set();

  function register(token, factory, deps = []) {
    if (typeof factory !== 'function') {
      throw new Error('팩토리는 함수여야 합니다.');
    }
    if (factories.has(token)) {
      throw new Error(`이미 등록된 토큰입니다: ${token}`);
    }
    factories.set(token, { factory, deps: [...deps] });
  }

  function resolve(token) {
    if (instances.has(token)) {
      return instances.get(token);
    }
    if (stack.has(token)) {
      throw new Error(`순환 의존입니다: ${token}`);
    }
    const entry = factories.get(token);
    if (!entry) {
      throw new Error(`등록되지 않은 토큰입니다: ${token}`);
    }
    stack.add(token);
    try {
      const args = entry.deps.map((dep) => resolve(dep));
      const created = entry.factory(...args);
      instances.set(token, created);
      return created;
    } finally {
      stack.delete(token);
    }
  }

  return { register, resolve };
}

const NAMES = [
  'Python',
  'JavaScript',
  'Go',
  'Rust',
  'TypeScript',
  'Kotlin',
  'Elixir',
  'Zig',
  'Dart',
  'Haskell',
];

class LanguageCatalog {
  constructor() {
    this.rows = NAMES.map((name, index) => ({ id: index + 1, name }));
  }

  all() {
    return this.rows.map((row) => ({ ...row }));
  }
}

class LanguageRoutes {
  constructor(catalog) {
    this.catalog = catalog;
  }

  list() {
    return this.catalog.all();
  }
}

function createRouter(routes) {
  const table = new Map([['GET /languages', () => routes.list()]]);
  return function handle(method, path) {
    const run = table.get(`${method} ${path}`);
    if (!run) {
      return { status: 404, body: { message: '없는 경로입니다.' } };
    }
    return { status: 200, body: run() };
  };
}

const container = createContainer();
container.register('catalog', () => new LanguageCatalog());
container.register('routes', (catalog) => new LanguageRoutes(catalog), ['catalog']);

const catalog = container.resolve('catalog');
const routes = container.resolve('routes');
assert.equal(routes.catalog, catalog);
assert.equal(container.resolve('routes'), routes);

const handle = createRouter(routes);
const ok = handle('GET', '/languages');
assert.equal(ok.status, 200);
assert.deepEqual(
  ok.body.map((row) => row.name),
  NAMES,
);

const missing = handle('POST', '/languages');
assert.equal(missing.status, 404);
assert.equal(missing.body.message, '없는 경로입니다.');

assert.throws(() => createContainer().resolve('languages'), /등록되지 않은 토큰/);

const cycle = createContainer();
cycle.register('left', (right) => ({ right }), ['right']);
cycle.register('right', (left) => ({ left }), ['left']);
assert.throws(() => cycle.resolve('left'), /순환 의존/);

console.log('mini-di.test.mjs: 통과');
