let path = require('path');

let realTest = require('tape-catch');

module.exports = getTest;

function getTest() {
  if (global) {
    global.TESTING = true;
  }
  let testFile = path.basename(module.parent.filename, '.js');
  function test(description, callback) {
    // add the name of the test-file to the description
    return realTest(`${testFile}: ${description}`, (assert) => {
      try {
        callback(assert);
      } finally {
        require('../src/config').reset();
      }
    });
  }
  // don't let require cache this file (otherwise testFile will never change)
  delete require.cache[path.resolve(__filename)];
  return test;
}
