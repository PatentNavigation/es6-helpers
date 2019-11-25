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
const TEXT_NODE = 3;
module.exports = (superclass) => class extends superclass {
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
    this.$root = this.$(root);
    if (!this.$root.length) {
      // a missing $root is an unrecoverable error
      throw new Error(`need root for XmlProperties`);
    }
    // make a map to cache properties elements so that we don't spend so much
    // time traversing when the dom is very large
    this.propertiesCache = new Map();
  }

  //
  // wrap a node in our cheerio-like wrapper
  //
  $(node) { /* required */ }
  //
  // return the (outer) html of the $Pr element
  //
  html() { /* required */ }
  //
  // return the nodeName of the node
  //
  getNodeName(node) { /* required */ }

  isTextNode(node) {
    return node.nodeType === TEXT_NODE;
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
    let $Pr = this.findPrElement();
    if ($Pr && $Pr.length) {
      // once our $Pr has been created, it shouldn't change, so we'll replace
      // this getter with a simple property
      Object.defineProperty(this, `$Pr`, { value: $Pr });
    }
    return $Pr;
  }
  //
  // return our $Pr element, prepending it as a child of our root element if necessary
  //
  ensurePr() {
    let $prop = this.$Pr;
    if (!($prop && $prop.length)) {
      $prop = this.$(`<${this.ensureNamespace(this.propertiesTag)}/>`);
      this.$root.prepend($prop);
    }
    return $prop;
  }
  //
  // find the $element(s) corresponding to a given tag in our $Pr element
  //
  findProperty(tag, { noCache } = {}) {
    let { propertiesCache } = this;
    if (!noCache && propertiesCache.has(tag)) {
      return propertiesCache.get(tag);
    }
    let $prop = this.findChildren(this.ensureNamespace(tag));
    if (!($prop && $prop.length)) {
      return;
    }
    if (!noCache) {
      // for non-array properties, there should be one $element per tag. Once
      // the $element is created, it should persist until the property for that
      // tag is removed
      propertiesCache.set(tag, $prop);
    }
    return $prop;
  }
  //
  // return an $element for the given tag, creating it as a child of our $Pr
  // element if necessary
  //
  ensureProperty(tag) {
    let $prop = this.findProperty(tag);
    if (!$prop) {
      $prop = this.$(`<${this.ensureNamespace(tag)}/>`);
      this.ensurePr().append($prop);
      this.propertiesCache.set(tag, $prop);
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
      this.propertiesCache.delete(tag);
    }
  }
  //
  // store the keys/values in the given attrs hash as attributes on a dom element
  //
  setAttrs(el, attrs = {}) {
    Object.keys(attrs).forEach((key) => {
      this.$(el).attr(key, attrs[key]);
    });
  }
  //
  // get an array of pojo values for a given tag
  //
  getArray(tag) {
    // don't cache array elements because they may come and go
    let $vals = this.findProperty(tag, { noCache: true });
    if (!$vals) {
      return [];
    }
    return $vals.toArray().map((el) => this.$(el).attr());
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
    let $tag = this.$(`<${this.ensureNamespace(tag)}/>`);
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
        this.removeProperty(tag);
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
      this.removeProperty(tag);
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

  findPrElement() {
    // search for an element with our propertiesTag
    let target = this.ensureNamespace(this.propertiesTag);

    for (const child of this.$root.children().toArray()) {
      if (this.getNodeName(child) === target) {
        return this.$(child);
      }
      // stop searching when we hit a non-text element that is not a properties
      // element
      if (this.isTextNode(child) || !isPropertiesTag(this.getNodeName(child))) {
        return;
      }
    }
  }

  findChildren(targetName) {
    let $Pr = this.$Pr;
    if ($Pr && $Pr.length) {
      return this.$(
        $Pr.children().toArray().filter(
          (el) => this.getNodeName(el) === targetName
        )
      );
    }
  }

};


function isPropertiesTag(tag) {
  return tag.endsWith(`Pr`);
}
