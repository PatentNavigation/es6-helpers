/* eslint-disable no-console */

let isNode = require('detect-node');

let config = require('./config');

function reportUnless(predicate, message, options = {}) {
  let {
    // we can't be in a unit test unless we're running in node
    isUnitTest = isNode ? global.TESTING : false,
    extra = ''
  } = options;

  if (predicate) {
    // we did not report, so return false
    return false;
  }
  if (isUnitTest) {
    throw new Error(message);
  }
  config.logger(message, extra);
  // we did report, so return true
  return true;
}

module.exports = reportUnless;
