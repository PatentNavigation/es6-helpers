const DEFAULTS = {
  logger: console.log, // eslint-disable-line no-console
  errorHandler: (err) => {
    throw err;
  }
};

const CONFIG = {};

class Config {
  get logger() {
    return this.prop(`logger`);
  }
  set logger(callback) {
    return this.prop(`logger`, callback);
  }

  get errorHandler() {
    return this.prop(`errorHandler`);
  }
  set errorHandler(callback) {
    return this.prop(`errorHandler`, callback);
  }

  prop(key, val) {
    if (arguments.length > 1) {
      return CONFIG[key] = val;
    }
    return CONFIG[key];
  }

  reset() {
    Object.keys(CONFIG).forEach((key) => delete CONFIG[key]);
    this.setDefaults();
  }

  setDefaults() {
    setDefaults();
  }
}

module.exports = new Config();
// initialize and set defaults
module.exports.reset();

function setDefaults() {
  Object.assign(CONFIG, DEFAULTS);
}
