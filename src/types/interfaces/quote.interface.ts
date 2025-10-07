export interface Quote {
  readonly id: string;
  readonly content: string;
  readonly author: string;
  readonly tags: readonly string[];
  readonly length: number;
  likes: number;
  views: number;
  readonly createdAt: Date;
  lastViewedAt: Date | null;
}

export interface QuoteMetrics {
  readonly score: number;
  readonly recency: number;
  readonly popularity: number;
  readonly engagement: number;
}

export interface ExternalQuote {
  readonly _id: string;
  readonly content: string;
  readonly author: string;
  readonly tags: readonly string[];
  readonly authorSlug: string;
  readonly length: number;
  readonly dateAdded: string;
  readonly dateModified: string;
}

export interface SimilarQuotesOptions {
  readonly tags?: readonly string[];
  readonly author?: string;
  readonly limit?: number;
  readonly excludeId?: string;
}

export interface QuoteFilters {
  readonly tags?: readonly string[];
  readonly author?: string;
  readonly minLength?: number;
  readonly maxLength?: number;
}
