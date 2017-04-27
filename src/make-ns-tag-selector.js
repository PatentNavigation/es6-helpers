let re = require('block-re');

function makeNSTagSelector(namespace = '') {
  //
  // w is a template-tag function for escaping* and name-spacing ooxml selectors
  // e.g., w`p` => `w\\:p`
  // * cheerio requires that the colon following the namespace be escaped
  //
  const needsNamespace = re('g')`
  (
    // a thing that needs a namespace can begin the string
    ^
    |
    // or a thing that needs a namespace can be preceded by any of several chars

    // a namespace-needing thing can be preceded by an open bracket e.g.,
    // [foo="1"] => [w:foo="1"]

    // a namespace-needing thing can follow an open paren, e.g.,
    // :has(foo) => :has(w:foo)

    // a namespace-needing thing can follow a comma, e.g.,
    // foo,bar => w:foo,w:bar

    // a namespace-needing thing can follow whitespace, e.g.,
    // foo bar => w:foo w:bar

    [ [ ( , \s ]
  ) // close capture group of the stuff before the namespace-needing thing

  // thing does not need a namespace if it is the namespace
  (?! ${namespace} \\* :)

  // capture the namespace-needing thing
  (\w+)
  `;

  return function(strings, ...keys) {
    let out = '';
    for (let index = 0; index < strings.length; index++) {
      if (index < keys.length) {
        out += strings[index] + keys[index];
      } else {
        out += strings[index];
      }
    }
    if (!namespace) {
      return out;
    }
    let namespaced = out.replace(needsNamespace, `$1${namespace}:$2`);
    // escape colons separately so that you can easily turn the tag name of a
    // cheerio dom object into a selector. E.g., if you wanted to get the sib of
    // an element if the sib has the same tag as the element, you might do
    // something like so: ({name} = $wr[0]); $sib = $wr.next(w`${name}`)
    return namespaced.replace(re('g')`\b${namespace}:`, `${namespace}\\:`);
  };
}

module.exports = makeNSTagSelector;
