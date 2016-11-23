let mix = require('../src/mixwith');

let test = require('./get-test')();

test('mixwith mixes with', function(assert) {
  function mixinA(superclass) {
    class _MixinA extends superclass {
      get aa() {
        return 'aa';
      }
      get bb() {
        return 'should be overridden';
      }
    }
    return _MixinA;
  }
  function mixinB(superclass) {
    class _MixinB extends superclass {
      get bb() {
        return 'bb';
      }
    }
    return _MixinB;
  }
  function mixinC(superclass) {
    class _MixinC extends superclass {
      get aa() {
        return 'overridden!';
      }
      get cc() {
        return 'cc';
      }
    }
    return _MixinC;
  }

  class TestAB extends mix().with(mixinA, mixinB) {
    get whoami() {
      return 'TestAB';
    }
  }

  let notDefined;
  let testerAB = new TestAB();
  assert.ok(testerAB instanceof testerAB.constructor);
  assert.equal(
    testerAB.aa,
    'aa'
  );
  assert.equal(
    testerAB.bb,
    'bb'
  );
  assert.equal(
    testerAB.whoami,
    'TestAB'
  );
  assert.equal(
    testerAB.cc,
    notDefined
  );

  class TestABC extends mix(TestAB).with(mixinC) {
    get whoami() {
      return 'TestABC';
    }
  }

  let testerABC = new TestABC();
  assert.ok(testerABC instanceof testerAB.constructor);
  assert.ok(testerABC instanceof testerABC.constructor);
  assert.equal(
    testerABC.aa,
    'overridden!'
  );
  assert.equal(
    testerABC.bb,
    'bb'
  );
  assert.equal(
    testerABC.whoami,
    'TestABC'
  );
  assert.equal(
    testerABC.cc,
    'cc'
  );

  assert.end();
});
