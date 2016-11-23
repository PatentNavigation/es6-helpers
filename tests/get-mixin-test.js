let mix = require('../src/mixwith');

let GetMixin = require('../src/get-mixin');

let test = require('./get-test')();

test('GetMixin adds a get function that gets kind of like ember', function(assert) {
  class TestGet extends mix().with(GetMixin) {
    get aa() {
      return 'aa';
    }
    get bb() {
      return { cc: 'cc' };
    }
  }
  let tester = new TestGet();
  assert.equal(
    tester.get('aa'),
    tester.aa
  );

  assert.deepEqual(
    tester.get('aa.bb'),
    tester.aa.bb
  );

  assert.equal(
    tester.get('bb.cc'),
    tester.bb.cc
  );

  let notDefined;
  assert.equal(
    tester.get('bb.dd'),
    notDefined
  );

  assert.end();
});
