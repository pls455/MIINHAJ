export const APP_NAME = "مِنهَاج";
export const APP_NAME_EN = "Minhaj";
export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 50;
export const SEARCH_DEBOUNCE_MS = 300;
export const CACHE_TTL_MS = 5 * 60 * 1000;

export const ROLES = Object.freeze({
  REVIEWER: "reviewer",
  CONTENT_ADMIN: "content_admin",
  SUPER_ADMIN: "super_admin",
});

export const ROLE_LEVELS = Object.freeze({
  [ROLES.REVIEWER]: 1,
  [ROLES.CONTENT_ADMIN]: 2,
  [ROLES.SUPER_ADMIN]: 3,
});
