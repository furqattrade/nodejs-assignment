export const VALIDATION_CONSTANTS = {
  MIN_QUOTE_ID_LENGTH: 1,
  MAX_PORT: 65535,
  MIN_PORT: 1,
} as const;

export const CACHE_CONSTANTS = {
  MAX_CACHE_SIZE: 1000,
  CACHE_TTL: 3600000,
} as const;
