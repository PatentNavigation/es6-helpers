let re = require('block-re');

function makeNSTagSelector(namespace) {
  //
  // w is a template-tag function for escaping* and name-spacing ooxml selectors
  // e.g., w`p` => `w\\:p`
  // * cheerio requires that the colon following the namespace be escaped
  //
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
    let namespaced = out.replace(/(^|[[(,\s])(\w+)(?!\\*:)/g, `$1${namespace}:$2`);
    // escape colons separately so that you can easily turn the tag name of a
    // cheerio dom object into a selector. E.g., if you wanted to get the sib of
    // an element if the sib has the same tag as the element, you might do
    // something like so: ({name} = $wr[0]); $sib = $wr.next(w`${name}`)
    return namespaced.replace(re('g')`${namespace}:`, `${namespace}\\:`);
  };
}

module.exports = makeNSTagSelector;
