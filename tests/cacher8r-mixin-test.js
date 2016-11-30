let mix = require('../src/mixwith');

let CacheR8R = require('../src/cacher8r-mixin');

let test = require('./get-test')();

test('CacheR8R caches properties', function(assert) {
  let aaComputed = 0;
  let bbComputed = 0;
  let ccComputed = 0;
  class TestCache extends mix().with(CacheR8R) {
    constructor() {
      super();
      this.xx = 1;
      this.html = 'hi there';
    }
    get aa() {
      return this.cacheOrCompute(['aa'], () => {
        aaComputed += 1;
        return 'aa';
      });
    }
    get bb() {
      return this.cacheOrCompute(['bb', this.xx], () => {
        bbComputed += 1;
        return this.xx;
      });
    }
    get cc() {
      return this.cacheOrCompute([this.strHash(this.html)], () => {
        ccComputed += 1;
        return this.html;
      });
    }
  }

  let tester = new TestCache();

  assert.equal(tester.aa, 'aa', `can get 'aa'`);
  assert.equal(aaComputed, 1, `'aa' is computed once`);
  assert.equal(tester.aa, 'aa', `can get 'aa' again`);
  assert.equal(aaComputed, 1, `'aa' is not recomputed`);

  tester.clearCache();
  assert.equal(tester.aa, 'aa', `can get 'aa' after clearing cache`);
  assert.equal(aaComputed, 2, `'aa' is recomputed after clearing cache`);

  assert.equal(tester.bb, 1, `can get 'bb'`);
  assert.equal(bbComputed, 1, `'bb' is computed once`);
  assert.equal(tester.bb, 1, `can get 'bb' again`);
  assert.equal(bbComputed, 1, `'bb' is not recomputed`);
  tester.xx = 2;
  assert.equal(tester.bb, 2, `can get 'bb' after updating xx`);
  assert.equal(bbComputed, 2, `'bb' is recomputed`);

  assert.equal(tester.cc, 'hi there', `can get 'cc'`);
  assert.equal(ccComputed, 1, `'cc' is computed once`);
  tester.html = 'hi there';
  assert.equal(tester.cc, 'hi there', `can get 'cc' again`);
  assert.equal(ccComputed, 1, `'cc' is not recomputed when hash of html does not change`);
  tester.html = 'monkeys!';
  assert.equal(tester.cc, 'monkeys!', `can get 'cc' after updating html`);
  assert.equal(ccComputed, 2, `'cc is recomputed after hash of html changes`);

  assert.end();
});
