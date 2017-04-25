const cheerio = require('cheerio');

const $ = cheerio.load(`<?xml version="1.0" ?><test-data />`, { xmlMode: true });

const mix = require('../src/mixwith');

const XmlPropertiesMixin = require('../src/xml-properties-mixin');

const test = require('./get-test')();

// define a TestProps class with an on/off property, a simple string property, and an array property
class TestProps extends mix().with(XmlPropertiesMixin) {
  constructor($el, tag = `testPr`, namespace) {
    super($el, tag, namespace);
  }
  get onOff() {
    return this.getPropertyValue(`on-off`);
  }
  set onOff(onOff) {
    // intro is on/off
    let $prop = this.ensureProperty(`on-off`);
    if (!onOff) {
      $prop.remove();
    }
  }

  get simpleString() {
    return this.getPropertyValue(`simple-string`);
  }
  set simpleString(val) {
    let $simpleString = this.ensureProperty(`simple-string`);
    if (val === null) {
      $simpleString.remove();
      return;
    }
    this.setAttrs($simpleString, { val });
  }

  get thingies() {
    return this.getArrayPropertyValue(`thingie`);
  }
  pushThingies(...thingies) {
    thingies.forEach((thingie, ii) => this.push(`thingie`, { id: ii, text: thingie }));
    return this;
  }
  clearThingies() {
    this.removeProperty(`thingie`);
    return this;
  }
}

test('XmlPropertiesMixin persists data in a Pr element', function(assert) {

  let $xml = $(`test-data`);
  // make an element that we'll attach properties to
  let $p = $(`<p>`);
  $xml.append($p);

  let props0 = new TestProps($p);

  assert.equal($.html($p), `<p/>`, `merely instantiating a properties instance does not modify $xml`);

  props0.onOff = true;
  assert.ok(props0.onOff, `onOff property is get/settable`);
  assert.equal($.html($p), `<p><testPr><on-off/></testPr></p>`, `onOff property is persisted in $xml`);

  props0.onOff = false
  assert.notOk(props0.onOff, `onOff property is get/settable`);
  assert.equal($.html($p), `<p><testPr/></p>`, `onOff property is persisted in $xml`);

  props0.simpleString = 'hi'
  assert.equal(props0.simpleString, `hi`, `simpleString property is get/settable`);
  assert.equal($.html($p), `<p><testPr><simple-string val="hi"/></testPr></p>`, `simpleString property is persisted in $xml`);

  props0.simpleString = 'hello'
  assert.equal(props0.simpleString, `hello`, `simpleString property is get/settable`);
  assert.equal($.html($p), `<p><testPr><simple-string val="hello"/></testPr></p>`, `simpleString property is persisted in $xml`);

  props0.simpleString = ''
  assert.equal(props0.simpleString, ``, `simpleString property is get/settable`);
  assert.equal($.html($p), `<p><testPr><simple-string val=""/></testPr></p>`, `simpleString property is persisted in $xml`);

  let props1 = new TestProps($p);
  props1.simpleString = 'xx'
  assert.equal(props0.simpleString, `xx`, `properties are not tied to a particular instance of TestProps`);
  props0.simpleString = null;

  props1.pushThingies('monkey', 'wildebeest', 'lemur')
  assert.deepEqual(props0.thingies, [
    { id: '0', text: 'monkey' },
    { id: '1', text: 'wildebeest' },
    { id: '2', text: 'lemur' }]
  );
  assert.equal(
    $.html($p),
    `<p><testPr><thingie id="0" text="monkey"/><thingie id="1" text="wildebeest"/><thingie id="2" text="lemur"/></testPr></p>`,
    `thingies array property is persisted in $xml`
  );

  props0.clearThingies();

  // add a properties object using a different tag for the properties element
  let props2 = new TestProps($p, `otherTestPr`);
  props2.simpleString = 'bar';
  props0.simpleString = 'foo'
  assert.equal(
    $.html($p),
    `<p><otherTestPr><simple-string val="bar"/></otherTestPr><testPr><simple-string val="foo"/></testPr></p>`,
    `multiple properties elements can co-exist on the same $root`
  );

  assert.end();
});


test('XmlPropertiesMixin persists data in a Pr element with a namespace', function(assert) {

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

  props.onOff = false
  assert.notOk(props.onOff, `onOff property is get/settable`);
  assert.equal($.html($p), `<w:p><foo:testPr/></w:p>`, `onOff property is persisted in $xml`);

  props.simpleString = 'hi'
  assert.equal(props.simpleString, `hi`, `simpleString property is get/settable`);
  assert.equal($.html($p), `<w:p><foo:testPr><foo:simple-string val="hi"/></foo:testPr></w:p>`, `simpleString property is persisted in $xml`);

  props.simpleString = 'hello'
  assert.equal(props.simpleString, `hello`, `simpleString property is get/settable`);
  assert.equal($.html($p), `<w:p><foo:testPr><foo:simple-string val="hello"/></foo:testPr></w:p>`, `simpleString property is persisted in $xml`);

  props.simpleString = null

  props.pushThingies('monkey', 'wildebeest', 'lemur')
  assert.deepEqual(props.thingies, [
    { id: '0', text: 'monkey' },
    { id: '1', text: 'wildebeest' },
    { id: '2', text: 'lemur' }]
  );
  assert.equal(
    $.html($p),
    `<w:p><foo:testPr><foo:thingie id="0" text="monkey"/><foo:thingie id="1" text="wildebeest"/><foo:thingie id="2" text="lemur"/></foo:testPr></w:p>`,
    `thingies array property is persisted in $xml`
  );

  assert.end();
});
