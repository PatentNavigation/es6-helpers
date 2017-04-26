/* eslint-disable no-console */

function reportUnless(predicate, message, options = {}) {
  let {
    isUnitTest = global && global.TESTING,
    log = console.error
  } = options;

  if (predicate) {
    // we did not report, so return false
    return false;
  }
  if (isUnitTest) {
    throw new Error(message);
  }
  log(message);
  // we did report, so return true
  return true;
}

module.exports = reportUnless;
