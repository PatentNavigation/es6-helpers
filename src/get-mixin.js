
// mixin to provide a 'get' method with similar semantics to an ember object
let GetMixin = (superclass) => class extends superclass {
  get(key) {
    let result = this;
    let notDefined;
    for (let keySegment of key.split('.')) {
      try {
        result = result[keySegment];
      } catch (err) {
        return notDefined;
      }
    }
    return result;
  }
};

module.exports = GetMixin;
