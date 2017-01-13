const VALUE = Symbol('value');

class SimpleCache {
  constructor() {
    // key0: { key1: { __value__: value} }
    this.cache = new Map([]);
  }

  get(getKeys) {
    let { cache } = this;
    for (let key of getKeys) {
      if (cache.has(key)) {
        cache = cache.get(key);
      } else {
        return undefined;
      }
    }
    return cache;
  }

  set(keys, value) {
    let { cache } = this;
    for (let key of keys) {
      if (!cache.has(key)) {
        cache.set(key, new Map([]));
      }
      cache = cache.get(key);
    }
    cache.set(VALUE, value);
    return value;
  }

  valueOf(cache) {
    return cache.get(VALUE);
  }
}

// make a mixin that we can inherit from to get a SimpleCache and a cacheOrCompute method
let CacheR8R = (superclass) => class extends superclass {
  constructor(...args) {
    super(...args);
    this.clearCache();
  }

  cacheOrCompute(keys, computeFn) {
    let cache = this.caches.get(keys);
    if (cache !== undefined) {
      return this.caches.valueOf(cache);
    }
    let value = computeFn();
    this.caches.set(keys, value);
    return value;
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
