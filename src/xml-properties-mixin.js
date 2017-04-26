const cheerio = require('cheerio');

const $ = cheerio.load(`<?xml version="1.0" ?>`, { xmlMode: true });

//
// mixin to persist data in an xml properties element, similar to how properties
// are stored in pPr/rPr elements in ooxml.
//
// Requires that ./xml-namespace-mixin also be mixed in
//
// numbers and strings are stored as the 'val' attribute of an element, e.g.
// properties.foo = 5 ==> <foo val="5"/>
//
// key: value objects
// properties.foo = { bar: 5, baz: 'bat' } ==> <foo bar="5", baz="bat"/>
//
// array elements
// properties.pushToArray('foo', {bar: 5})
// properties.pushToArray('foo', {bar: 6})
// ==> <foo bar="5"/><foo bar="6"/>
//

let XmlPropertiesMixin = (superclass) => class extends superclass {
  //
  // make a new instance, given a root element and a propertiesTag
  //
  constructor(root, { propertiesTag } = {}) {
    if (!propertiesTag) {
      throw new Error(`need propertiesTag for XmlProperties`);
    }
    super(...arguments);
    // accept either an XmlProperties object (with a .$root property) or a dom element
    this.$root = root.$root || $(root);
    if (!this.$root.length) {
      throw new Error(`need root for XmlProperties`);
    }
    this.propertiesTag = propertiesTag;
  }
  //
  // get the $Pr element where our properties are stored
  //
  get $Pr() {
    return this.$root.find(`> ${this.toSelector(this.propertiesTag)}`);
  }
  //
  // return the html of the $Pr element
  //
  html() {
    return $.html(this.$Pr);
  }
  //
  // return our $Pr element, creating it as a child of our root element if necessary
  //
  ensurePr() {
    let $prop = this.$Pr;
    if (!$prop.length) {
      $prop = $(`<${this.ensureNamespace(this.propertiesTag)}/>`);
      this.$root.prepend($prop);
    }
    return $prop;
  }
  //
  // remove our $Pr element
  //
  removePr() {
    return this.$Pr.remove();
  }
  //
  // find the $element corresponding to a given tag in our $Pr element
  //
  findProperty(tag) {
    let $prop = this.$Pr.find(`> ${this.toSelector(tag)}`);
    if ($prop.length) {
      return $prop;
    }
  }
  //
  // return an $element for the given tag, creating it as a child of our $Pr
  // element if necessary
  //
  ensureProperty(tag) {
    let $prop = this.findProperty(tag);
    if (!$prop) {
      $prop = $(`<${this.ensureNamespace(tag)}/>`);
      this.ensurePr().append($prop);
    }
    return $prop;
  }
  //
  // remove the $element for the given tag
  //
  removeProperty(tag) {
    let $prop = this.findProperty(tag);
    if ($prop) {
      $prop.remove();
    }
  }
  //
  // store the keys/values in the given attrs hash as attributes on a dom element
  //
  setAttrs(el, attrs = {}) {
    Object.keys(attrs).forEach((key) => {
      $(el).attr(key, attrs[key]);
    });
  }
  //
  // get an array of pojo values for a given tag
  //
  getArray(tag) {
    let $vals = this.findProperty(tag);
    if (!$vals) {
      return [];
    }
    return $vals.toArray().map((item) => $(item).attr());
  }
  //
  // set an array of pojo values for a given tag
  //
  setArray(tag, attrList = [], $Pr = this.ensurePr()) {
    // remove existing elements
    this.removeProperty(tag);
    // set the new elements
    attrList.forEach((attrs) => this.pushToArray(tag, attrs, $Pr));
  }
  //
  // add one array-item having the given attributes for the given tag
  //
  pushToArray(tag, attrs = {}, $Pr = this.ensurePr()) {
    let $tag = $(`<${this.ensureNamespace(tag)}/>`);
    $Pr.append($tag);
    this.setAttrs($tag, attrs);
    return $tag;
  }
  //
  // get a scalar value for the given tag
  //
  getScalar(tag) {
    let $el = this.findProperty(tag);
    if ($el) {
      return $el.attr('val');
    }
  }
  //
  // set a scalar value for the given tag as the 'val' atribute of its element
  //
  setScalar(tag, val) {
    let $el = this.ensureProperty(tag);
    this.setAttrs($el, { val });
    return val;
  }
  //
  // set a scalar value for the given tag as the 'val' atribute of its element,
  // or remove the element if the value is falsy
  //
  setOrRemoveScalar(tag, val) {
    if (!val) {
      let $prop = this.findProperty(tag);
      if ($prop) {
        $prop.remove();
      }
      return val;
    }
    return this.setScalar(tag, val);
  }
  //
  // get a boolean value indicating whether an element for the given tag eists
  //
  getBool(tag) {
    let $el = this.findProperty(tag);
    return $el && $el.length;
  }
  //
  // create or remove an element for the given tag, depending on the yesNo value
  //
  setBool(tag, yesNo) {
    let $el = this.ensureProperty(tag);
    if (yesNo) {
      this.setAttrs($el, true);
    } else {
      $el.remove();
    }
    return yesNo;
  }
  //
  // get a pojo corresponding to the attributes of the element corresponding to the given tag
  //
  getHash(tag) {
    let $el = this.findProperty(tag);
    if (!$el) {
      return {};
    }
    return $el.attr();
  }
  //
  // set the attributes of the element corresponding to the given tag
  //
  setHash(tag, pojo) {
    let $el = this.ensureProperty(tag);
    this.setAttrs($el, pojo);
    return pojo;
  }

};

module.exports = XmlPropertiesMixin;
