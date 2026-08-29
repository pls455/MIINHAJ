const state = new Map();
const listeners = new Map();

export function getState(key) {
  return state.get(key);
}

export function setState(key, value) {
  state.set(key, value);
  const callbacks = listeners.get(key) || [];
  callbacks.forEach((callback) => callback(value));
  return value;
}

export function updateState(key, updater) {
  return setState(key, updater(getState(key)));
}

export function subscribe(key, callback) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(callback);
  return () => listeners.get(key)?.delete(callback);
}

export function clearState() {
  state.clear();
  listeners.clear();
}
