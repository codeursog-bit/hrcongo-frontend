const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
async function main() {
  const handlers = {}, deleted = []; let cachedReads = 0, networkReads = 0;
  const cache = { match: async () => { cachedReads++; return undefined; }, put: async () => {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/sw.js'), 'utf8'), {
    URL, console,
    self: { addEventListener: (event, callback) => { handlers[event] = callback; }, location: { origin: 'http://test.local' }, clients: { claim: async () => {} }, skipWaiting: () => {} },
    caches: { open: async () => cache, keys: async () => ['konza-rh-cache-v1', 'konza-rh-cache-v2', 'another-app'], delete: async key => { deleted.push(key); } },
    fetch: async () => { networkReads++; return { ok: true, clone: () => ({}) }; },
  });
  for (const url of ['/webpack.js', '/app/(dashboard)/dashboard/page.js', '/app/layout.js', '/app-pages-internals.js']) {
    let intercepted = false;
    handlers.fetch({ request: { method: 'GET', url: 'http://test.local/_next/static/chunks' + url }, respondWith: () => { intercepted = true; } });
    assert.equal(intercepted, false, 'unversioned dev asset must use the browser network: ' + url);
  }
  let response;
  handlers.fetch({ request: { method: 'GET', url: 'http://test.local/_next/static/chunks/app/page-0123456789abcdef.js' }, respondWith: promise => { response = promise; } });
  await response; assert.equal(cachedReads, 1); assert.equal(networkReads, 1);
  let activation; handlers.activate({ waitUntil: promise => { activation = promise; } }); await activation;
  assert.deepEqual(deleted, ['konza-rh-cache-v1']);
  console.log('Cache SW vérifié : chunks dev exclus, chunks de production hashés conservés, ancien cache Konza supprimé sans toucher aux autres caches.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
