const cheerio = require('cheerio');

const mix = require('../src/mixwith');

const XmlPropertiesMixin = require('../src/xml-properties-mixin');
const XmlNamespaceMixin = require('../src/xml-namespace-mixin');

const test = require('./get-test')();

// define a TestProps class with an on/off property, a simple string property, and an array property
class TestProps extends mix().with(XmlPropertiesMixin, XmlNamespaceMixin) {
  constructor($el, propertiesTag = `testPr`, namespace) {
    super($el, { propertiesTag, namespace });
  }
  get onOff() {
    return this.getBool(`on-off`);
  }
  set onOff(onOff) {
    // intro is on/off
    return this.setBool(`on-off`, onOff);
  }

  get simpleString() {
    return this.getScalar(`simple-string`);
  }
  set simpleString(val) {
    return this.setOrRemoveScalar(`simple-string`, val);
  }

  get emptyString() {
    return this.getScalar(`empty-string`);
  }
  set emptyString(val) {
    return this.setScalar(`empty-string`, val);
  }

  get pojo() {
    return this.getHash(`pojo`);
  }
  set pojo(obj) {
    return this.setHash(`pojo`, obj);
  }

  get thingies() {
    return this.getArray(`thingie`);
  }
  pushThingies(...thingies) {
    thingies.forEach((thingie, ii) => this.pushToArray(`thingie`, { id: ii, text: thingie }));
    return this;
  }
  clearThingies() {
    this.removeProperty(`thingie`);
    return this;
  }
}

test('XmlPropertiesMixin persists data in a Pr element', function(assert) {
  const $ = cheerio.load(`<?xml version="1.0" ?><test-data />`, { xmlMode: true });

  let $xml = $(`test-data`);
  // make an element that we'll attach properties to
  let $p = $(`<p>`);
  $xml.append($p);

  let props0 = new TestProps($p);

  assert.equal($.html($p), `<p/>`, `merely instantiating a properties instance does not modify $xml`);

  props0.onOff = true;
  assert.ok(props0.onOff, `onOff property is get/settable`);
  assert.equal($.html($p), `<p><testPr><on-off/></testPr></p>`, `onOff property is persisted in $xml`);
  assert.ok(props0.propertiesCache.has(`on-off`), `onOff property is cached`);

  props0.onOff = false;
  assert.notOk(props0.onOff, `onOff property is get/settable`);
  assert.equal($.html($p), `<p><testPr/></p>`, `onOff property is persisted in $xml`);

  props0.simpleString = 'hi';
  assert.equal(props0.simpleString, `hi`, `simpleString property is get/settable`);
  assert.equal($.html($p), `<p><testPr><simple-string val="hi"/></testPr></p>`, `simpleString property is persisted in $xml`);
  assert.ok(props0.propertiesCache.has(`simple-string`), `simpleString property is cached`);

  props0.simpleString = 'hello';
  assert.equal(props0.simpleString, `hello`, `simpleString property is get/settable`);
  assert.equal($.html($p), `<p><testPr><simple-string val="hello"/></testPr></p>`, `simpleString property is persisted in $xml`);

  props0.simpleString = '';
  assert.notOk(props0.simpleString, `simpleString property is get/settable`);
  assert.equal($.html($p), `<p><testPr/></p>`, `simpleString property is persisted in $xml`);

  let props1 = new TestProps($p);
  props1.simpleString = 'xx';
  assert.equal(props0.simpleString, `xx`, `properties are not tied to a particular instance of TestProps`);
  props0.simpleString = null;

  props0.pojo = { foo: 1, bar: 2 };
  assert.deepEqual(props0.pojo, { foo: '1', bar: '2' }, `pojo property is get/settable`);
  assert.equal($.html($p), `<p><testPr><pojo foo="1" bar="2"/></testPr></p>`, `pojo property is persisted in $xml`);
  props0.removeProperty('pojo');

  props1.pushThingies('monkey', 'wildebeest', 'lemur');
  assert.deepEqual(props0.thingies, [
    { id: '0', text: 'monkey' },
    { id: '1', text: 'wildebeest' },
    { id: '2', text: 'lemur' } ]
  );
  assert.equal(
    $.html($p),
    `<p><testPr><thingie id="0" text="monkey"/><thingie id="1" text="wildebeest"/><thingie id="2" text="lemur"/></testPr></p>`,
    `thingies array property is persisted in $xml`
  );
  assert.ok(props0.propertiesCache.has(`thingie`), `thingies property is cached`);

  props0.clearThingies();
  assert.notOk(props0.propertiesCache.has(`thingie`), `thingies property is not cached after being cleared`);

  // add a properties object using a different tag for the properties element
  let props2 = new TestProps($p, `otherTestPr`);
  props0.simpleString = 'foo';
  props2.simpleString = 'bar';
  assert.equal(
    $.html($p),
    `<p><otherTestPr><simple-string val="bar"/></otherTestPr><testPr><simple-string val="foo"/></testPr></p>`,
    `multiple properties elements can co-exist on the same $root`
  );
  assert.end();
});

test('XmlPropertiesMixin persists data in a Pr element with a namespace', function(assert) {
  const $ = cheerio.load(`<?xml version="1.0" ?><test-data />`, { xmlMode: true });

  let $xml = $(`test-data`);
  // make an element that we'll attach properties to
  let $p = $(`<w:p>`);
  $xml.append($p);

  // use namespace 'foo' for our properties element
  let props = new TestProps($p, `testPr`, `foo`);

  assert.equal($.html($p), `<w:p/>`, `merely instantiating a properties instance does not modify $xml`);

  props.onOff = true;
  assert.ok(props.onOff, `onOff property is get/settable`);
  assert.equal($.html($p), `<w:p><foo:testPr><foo:on-off/></foo:testPr></w:p>`, `onOff property is persisted in $xml`);

  props.onOff = false;
  assert.notOk(props.onOff, `onOff property is get/settable`);
  assert.equal($.html($p), `<w:p><foo:testPr/></w:p>`, `onOff property is persisted in $xml`);

  props.simpleString = 'hi';
  assert.equal(props.simpleString, `hi`, `simpleString property is get/settable`);
  assert.equal($.html($p), `<w:p><foo:testPr><foo:simple-string val="hi"/></foo:testPr></w:p>`, `simpleString property is persisted in $xml`);

  props.simpleString = 'hello';
  assert.equal(props.simpleString, `hello`, `simpleString property is get/settable`);
  assert.equal($.html($p), `<w:p><foo:testPr><foo:simple-string val="hello"/></foo:testPr></w:p>`, `simpleString property is persisted in $xml`);

  props.simpleString = null;

  props.pushThingies('monkey', 'wildebeest', 'lemur');
  assert.deepEqual(props.thingies, [
    { id: '0', text: 'monkey' },
    { id: '1', text: 'wildebeest' },
    { id: '2', text: 'lemur' } ]
  );
  assert.equal(
    $.html($p),
    `<w:p><foo:testPr><foo:thingie id="0" text="monkey"/><foo:thingie id="1" text="wildebeest"/><foo:thingie id="2" text="lemur"/></foo:testPr></w:p>`,
    `thingies array property is persisted in $xml`
  );

  assert.end();
});

test(`XmlPropertiesMixin instances can copy themselves as a new type`, (assert) => {
  const $ = cheerio.load(`<?xml version="1.0" ?><test-data />`, { xmlMode: true });

  let $xml = $(`test-data`);
  // make an element that we'll attach properties to
  let $p = $(`<w:p>`);
  $xml.append($p);

  class Props1 {}

  let props0 = new TestProps($p, `testPr`);
  let props1 = props0.copyAs(Props1);

  assert.ok(props0 instanceof TestProps);
  assert.ok(props1 instanceof Props1);
  assert.end();
});
