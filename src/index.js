if (!global._babelPolyfill) {
  require("babel-polyfill");
}

exports.CacheR8R = require('./cacher8r-mixin');

exports.mix = require('./mixwith');

exports.GetMixin = require('./get-mixin');

exports.makeNSTagSelector = require('./make-ns-tag-selector');

exports.XmlPropertiesMixin = require('./xml-properties-mixin');
exports.XmlNamespaceMixin = require('./xml-namespace-mixin');
