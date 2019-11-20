let test = require('./tape')(module);
let reportUnless = require('../src/report-unless');
let config = require('../src/config');

test(`reportUnless works`, (assert) => {
  assert.throws(
    () => reportUnless(false, `foo`, { isUnitTest: true }),
    `foo`,
    `should throw when predicate false && unit test`
  );
  assert.doesNotThrow(
    () => reportUnless(true, `bar`, { isUnitTest: true }),
    `should not throw when predicate is true`
  );

  assert.doesNotThrow(
    () => reportUnless(true, `bat`, { isUnitTest: false }),
    `should not throw when predicate is true && not unit test`
  );

  let logged;
  config.logger = (msg) => logged = msg;
  assert.doesNotThrow(
    () => reportUnless(false, `baz`, { isUnitTest: false }),
    `should not throw when not unit test`
  );
  assert.equal(logged, `baz`, `message was logged`);

  assert.ok(
    reportUnless(false, `boof`, { isUnitTest: false }),
    `reportUnless returns true when it does report`
  );
  assert.notOk(
    reportUnless(true, `boof`, { isUnitTest: false }),
    `reportUnless returns false when it does not report`
  );
  assert.end();
});
