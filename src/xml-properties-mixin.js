const re = require('block-re');
const cheerio = require('cheerio');

const makeNSTagSelector = require('./make-ns-tag-selector');

const $ = cheerio.load(`<?xml version="1.0" ?>`, { xmlMode: true });

//
// mixin to persist data in an xml properties element, similar to how properties
// are stored in pPr/rPr elements in ooxml.
//
// numbers and strings are stored as the 'val' attribute of an element, e.g.
// properties.foo = 5 ==> <foo val="5"/>
//
// key: value objects
// properties.foo = { bar: 5, baz: 'bat' } ==> <foo bar="5", baz="bat"/>
//
// array elements
// properties.push('foo', {bar: 5})
// properties.push('foo', {bar: 6})
// ==> <foo bar="5"/><foo bar="6"/>
//

let XmlPropertiesMixin = (superclass) => class extends superclass {
  constructor(root, propertiesTag, namespace) {
    if (!propertiesTag) {
      throw new Error(`need propertiesTag for XmlProperties`);
    }
    super();
      // accept either an XmlProperties object (with a .$root property) or a dom element
    this.$root = root.$root || $(root);
    if (!this.$root.length) {
      throw new Error(`need root for XmlProperties`);
    }
    this.propertiesTag = propertiesTag;
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
  html() {
    return $.html(this.$Pr);
  }
  get $Pr() {
    return this.$root.find(`> ${this.toSelector(this.propertiesTag)}`);
  }
  ensurePr() {
    let $prop = this.$Pr;
    if (!$prop.length) {
      $prop = $(`<${this.ensureNamespace(this.propertiesTag)}/>`);
      this.$root.prepend($prop);
    }
    return $prop;
  }
  findProperty(tag) {
    let $prop = this.$Pr.find(`> ${this.toSelector(tag)}`);
    if ($prop.length) {
      return $prop;
    }
  }
  ensureProperty(tag) {
    let $prop = this.findProperty(tag);
    if (!$prop) {
      $prop = $(`<${this.ensureNamespace(tag)}/>`);
      this.ensurePr().append($prop);
    }
    return $prop;
  }
  removeProperty(tag) {
    let $prop = this.findProperty(tag);
    if ($prop) {
      $prop.remove();
    }
  }
  getPropertyValue(tag) {
    let $prop = this.findProperty(tag);
    if ($prop) {
      return this.getVal($prop);
    }
  }
  getArrayPropertyValue(tag) {
    let vals = this.getPropertyValue(tag);
      // ensure we return an array
    if (!vals) {
      return [];
    }
    if (Array.isArray(vals)) {
      return vals;
    }
    return [ vals ];

  }
  setArrayProperty(tag, attrList, $Pr = this.ensurePr()) {
      // remove existing elements
    this.removeProperty(tag);
    if (!(attrList && attrList.length)) {
      return;
    }
    attrList.forEach((attrs) => this.push(tag, attrs, $Pr));

  }
  push(tag, attrs, $Pr = this.ensurePr()) {
    if (!attrs) {
      return;
    }
    let $tag = $(`<${this.ensureNamespace(tag)}/>`);
    $Pr.append($tag);
    this.setAttrs($tag, attrs);
    return $tag;
  }
  setAttrs(el, attrs) {
    Object.keys(attrs).forEach((key) => {
      $(el).attr(key, attrs[key]);
    });
  }
  getVal(el) {
    if (!el) {
      return;
    }
    let $el = el.cheerio ? el : $(el);
    if ($el.length > 1) {
      return $el.toArray().map((item) => this.getVal(item));
    }
    let attrs = $el.attr();
    let keys = Object.keys(attrs);
    let attrCount = keys.length;
    if (attrCount === 0) {
      // if no attrs, the property is a boolean. as the element exists, return true
      return true;
    }
    let [ key ] = keys;
    // if the element has only one attribute, named 'val', then return the value
    // of that attribute
    if (attrCount === 1 && key === 'val') {
      return attrs[key];
    }
    // otherwise, return a POJO with all of the attribute key: value pairs
    return attrs;
  }

};

module.exports = XmlPropertiesMixin;
