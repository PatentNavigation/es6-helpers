let test = require('./get-test')();
let makeNSTagSelector = require('../src/make-ns-tag-selector');

test('makeNSTagSelector escapes and name-spaces a selector', function(assert) {
  let w = makeNSTagSelector(`w`);
  assert.equal(
    w`p`,
    `w\\:p`
  );

  assert.equal(
    w`w:p`,
    `w\\:p`
  );

  assert.equal(
    w`w\\:p`,
    `w\\:p`
  );

  assert.equal(
    w`${w`w:p`}`,
    `w\\:p`
  );

  assert.equal(
    w`p > pPr`,
    `w\\:p > w\\:pPr`
  );

  assert.equal(
    w`rStyle[val="deleted"]`,
    `w\\:rStyle[w\\:val="deleted"]`
  );

  assert.equal(
    w`rStyle[val=deleted]`,
    `w\\:rStyle[w\\:val=deleted]`
  );

  assert.equal(
    w`rStyle[val="wakka wakka"]`,
    `w\\:rStyle[w\\:val="wakka wakka"]`
  );

  assert.equal(
    w`rStyle[val="don't worry"]`,
    `w\\:rStyle[w\\:val="don't worry"]`
  );

  assert.equal(
    w`> :not(p > pPr)`,
    `> :not(w\\:p > w\\:pPr)`
  );

  assert.equal(
    w`:not(body,tc)`,
    `:not(w\\:body,w\\:tc)`
  );

  assert.equal(
    w`sdt:first`,
    `w\\:sdt:first`
  );

  assert.equal(
    w`r:has(instrText:contains("MERGEFIELD UsDocNum"))`,
    `w\\:r:has(w\\:instrText:contains("MERGEFIELD UsDocNum"))`
  );

  assert.equal(
    w`r:has(instrText:contains(UsDocNum))`,
    `w\\:r:has(w\\:instrText:contains(UsDocNum))`
  );

  assert.end();
});
