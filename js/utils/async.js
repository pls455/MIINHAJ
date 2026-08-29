export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function normalizeSearch(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function clampPageSize(value, fallback = 24, max = 50) {
  const size = Number(value);
  if (!Number.isFinite(size) || size < 1) return fallback;
  return Math.min(Math.floor(size), max);
}
