let test = require('./get-test')();
let { CacheR8R, mix, GetMixin } = require('../src/index');

test('index exports something', function(assert) {
  assert.equal(typeof CacheR8R, 'function', `CacheR8R exists`);
  assert.equal(typeof mix, 'function', `mix exists`);
  assert.equal(typeof GetMixin, 'function', `GetMixin exists`);
  assert.end();
});
