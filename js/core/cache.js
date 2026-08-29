const memoryCache = new Map();

export function getCached(key) {
  const entry = memoryCache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached(key, value, ttlMs) {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function deleteCached(key) {
  memoryCache.delete(key);
}

export function clearCache() {
  memoryCache.clear();
}

export function createCacheKey(prefix, params = {}) {
  return `${prefix}:${JSON.stringify(params, Object.keys(params).sort())}`;
}
