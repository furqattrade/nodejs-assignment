export interface QuoteResponse {
  readonly id: string;
  readonly content: string;
  readonly author: string;
  readonly tags: readonly string[];
  readonly length: number;
  readonly likes: number;
  readonly views: number;
}

export interface LikeQuoteRequest {
  readonly quoteId: string;
}

export interface LikeQuoteResponse {
  readonly id: string;
  readonly likes: number;
  readonly success: boolean;
}

export interface SimilarQuotesResponse {
  readonly quotes: readonly QuoteResponse[];
  readonly total: number;
}

export interface ErrorResponse {
  readonly error: string;
  readonly message: string;
  readonly statusCode: number;
}
