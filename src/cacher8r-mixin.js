class SimpleCache {
  constructor() {
    this.cache = [
      // { keys: [key0, ... keyN], value: <value>},
    ];
  }

  get(getKeys) {
    return this.cache.find(({ keys }) => compare(keys, getKeys));
  }

  set(keys, value) {
    let cache = this.get(keys);
    if (cache) {
      cache.value = value;
    } else {
      this.cache.push({ keys, value });
    }
    return value;
  }
}

function compare(keys0, keys1) {
  return keys0.every((one, ii) => {
    let other = keys1[ii];
    return one === other;
  });
}

// make a mixin that we can inherit from to get a SimpleCache and a cacheOrCompute method
let CacheR8R = (superclass) => class extends superclass {
  constructor(...args) {
    super(...args);
    this.clearCache();
  }

  cacheOrCompute(keys, computeFn) {
    let cache = this.caches.get(keys);
    if (cache) {
      return cache.value;
    }
    return this.caches.set(keys, computeFn());
  }

  strHash(str) {
    /*
     * This is the xor version of Daniel J. Bernstein's `times 33' (non-crypto) hash function
     * hash(i) = hash(i - 1) * 33 ^ str[i]
     */
    let hash = 5381;
    let i = str.length;
    while (i) {
      i -= 1;
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
  }

  clearCache() {
    this.caches = new SimpleCache();
  }

};

module.exports = CacheR8R;
