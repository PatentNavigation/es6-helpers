const re = require('block-re');

const makeNSTagSelector = require('./make-ns-tag-selector');

//
// mixin to handle a namespace property
//

let XmlNamespaceMixin = (superclass) => class extends superclass {
  constructor(root, { namespace } = {}) {
    super(...arguments);
    this.namespace = namespace;
    this.makeNSSelector = makeNSTagSelector(namespace);
  }
  ensureNamespace(tag) {
    let { namespace } = this;
    if (!namespace) {
      return tag;
    }
    return tag.replace(re()`^(?!${namespace}:)`, `${namespace}:`);
  }
  toSelector(tag) {
    return this.makeNSSelector`${tag}`;
  }
};

module.exports = XmlNamespaceMixin;
