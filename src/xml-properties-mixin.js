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
    super(...arguments);
    if (!propertiesTag) {
      // a missing propertiesTag is an unrecoverable error
      throw new Error(`need propertiesTag for XmlProperties`);
    }
    if (!isPropertiesTag(propertiesTag)) {
      throw new Error(`propertiesTag must end in "Pr"`);
    }
    this.propertiesTag = propertiesTag;
    this.$root = $(root);
    if (!this.$root.length) {
      // a missing $root is an unrecoverable error
      throw new Error(`need root for XmlProperties`);
    }
  }
  //
  // get the $Pr element where our properties are stored
  //
  get $Pr() {
    // this getter can be a performance bottleneck when our $root has lots of
    // children, so we'll do some manual traversing and cache the results to
    // speed up the process. We're assuming 1) that our $root may have other
    // properties elements; 2) that property-elements are always prepended to
    // $root; and 3) that a properties element's name ends in 'Pr'
    if (this._Pr) {
      return this._Pr;
    }
    let $Pr = findOneChild(
      // search children of our $root
      this.$root,
      // for an element with our propertiesTag
      this.ensureNamespace(this.propertiesTag),
      // stop searching when we hit an element that is not a properties element
      ({ name }) => !isPropertiesTag(name)
    );
    if ($Pr.length) {
      // once our $Pr has been created, it shouldn't change, so we'll cache it
      this._Pr = $Pr;
    }
    return $Pr;
  }
  //
  // return the (outer) html of the $Pr element
  //
  html() {
    return $.html(this.$Pr);
  }
  //
  // return our $Pr element, prepending it as a child of our root element if necessary
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
  // find the $element(s) corresponding to a given tag in our $Pr element
  //
  findProperty(tag) {
    let $prop = findChildren(this.$Pr, this.ensureNamespace(tag));
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

  copyAs(NewPropsClass) {
    return new NewPropsClass(this.$root);
  }
};

function isPropertiesTag(tag) {
  return tag.endsWith(`Pr`);
}

function findOneChild($el, targetName, shouldEarlyOut = no) {
  return findChildren($el, targetName, (child, results) => results.length || shouldEarlyOut(child, results));
}

function findChildren($el, targetName, shouldEarlyOut = no) {
  let results = [];
  if ($el.length) {
    let { children } = $el[0];
    for (let child of children) {
      let { name } = child;
      if (name === targetName) {
        results.push(child);
      }
      // stop searching?
      if (shouldEarlyOut(child, results)) {
        break;
      }
    }
  }
  return $(results);
}

function no() {
  return false;
}

module.exports = XmlPropertiesMixin;
