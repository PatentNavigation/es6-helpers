module.exports = mix;

class Mixer {
  constructor(superclass) {
    this.superclass = superclass;
  }
  with(...mixins) {
    return mixins.reduce(
      (superclass, mixin) => mixin(superclass),
      this.superclass
    );
  }
}

function mix(superclass = class{}) {
  return new Mixer(superclass);
}
