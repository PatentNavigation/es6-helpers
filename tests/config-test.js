let test = require('./get-test')();

test('config configs', function(assert) {
  let config0 = require('../src/config');
  let config1 = require('../src/config');

  config0.logger = `foo`;
  assert.equal(
    config0.logger,
    `foo`
  );
  assert.equal(
    config1.logger,
    `foo`
  );

  config1.errorHandler = `bar`;
  assert.equal(
    config0.errorHandler,
    `bar`
  );
  assert.equal(
    config1.errorHandler,
    `bar`
  );

  config0.setDefaults();
  let { log: defaultLogger } = console;
  assert.equal(
    config0.logger,
    defaultLogger
  );
  assert.equal(
    config1.logger,
    defaultLogger
  );

  config0.prop(`baz`, `bat`);
  assert.equal(
    config0.prop(`baz`),
    `bat`
  );
  assert.equal(
    config1.prop(`baz`),
    `bat`
  );

  assert.end();
});
