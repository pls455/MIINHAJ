const STORAGE_KEY = "minhaj-theme";

export function getPreferredTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme = getPreferredTheme()) {
  const normalized = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = normalized;
  localStorage.setItem(STORAGE_KEY, normalized);
  document.dispatchEvent(new CustomEvent("minhaj:theme-change", { detail: normalized }));
  return normalized;
}

export function toggleTheme() {
  return applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
}

applyTheme();
