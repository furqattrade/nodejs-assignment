export const RANKING_CONSTANTS = {
  RECENCY_BASELINE: 0.5,
  RECENCY_DECAY_HOURS: 24,
  MIN_SCORE: 0.1,
  DEFAULT_WEIGHTS: {
    recency: 0.2,
    likes: 0.5,
    engagement: 0.3,
  },
} as const;

export const SIMILARITY_CONSTANTS = {
  TAG_SIMILARITY_WEIGHT: 10,
  AUTHOR_MATCH_WEIGHT: 5,
} as const;
