import { Quote, QuoteFilters, SimilarQuotesOptions } from '@app-types';
import { SIMILARITY_CONSTANTS } from '@constants';

export class QuoteRepository {
  private readonly quotes: Map<string, Quote> = new Map();

  public save(quote: Quote): Quote {
    this.quotes.set(quote.id, quote);
    return quote;
  }

  public findById(id: string): Quote | undefined {
    return this.quotes.get(id);
  }

  public findAll(filters?: QuoteFilters): Quote[] {
    const allQuotes = Array.from(this.quotes.values());

    if (!filters) {
      return allQuotes;
    }

    return allQuotes.filter((quote) => this.matchesFilters(quote, filters));
  }

  public findSimilar(options: SimilarQuotesOptions): Quote[] {
    const quotes = Array.from(this.quotes.values()).filter(
      (q) => !options.excludeId || q.id !== options.excludeId
    );

    const scoredQuotes = quotes
      .map((quote) => ({
        quote,
        score: this.calculateSimilarityScore(quote, options),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const limit = options.limit ?? 5;
    return scoredQuotes.slice(0, limit).map((item) => item.quote);
  }

  public incrementLikes(id: string): Quote | undefined {
    const quote = this.quotes.get(id);
    if (!quote) {
      return undefined;
    }

    quote.likes += 1;
    return quote;
  }

  public incrementViews(id: string): Quote | undefined {
    const quote = this.quotes.get(id);
    if (!quote) {
      return undefined;
    }

    quote.views += 1;
    quote.lastViewedAt = new Date();
    return quote;
  }

  public getTopRated(limit = 10): Quote[] {
    return this.getSortedQuotes((a, b) => b.likes - a.likes, limit);
  }

  public getMostViewed(limit = 10): Quote[] {
    return this.getSortedQuotes((a, b) => b.views - a.views, limit);
  }

  public getCount(): number {
    return this.quotes.size;
  }

  public exists(id: string): boolean {
    return this.quotes.has(id);
  }

  public clear(): void {
    this.quotes.clear();
  }

  private matchesFilters(quote: Quote, filters: QuoteFilters): boolean {
    if (filters.tags?.length && !filters.tags.some((tag) => quote.tags.includes(tag))) {
      return false;
    }

    if (filters.author && !quote.author.toLowerCase().includes(filters.author.toLowerCase())) {
      return false;
    }

    if (filters.minLength !== undefined && quote.length < filters.minLength) {
      return false;
    }

    if (filters.maxLength !== undefined && quote.length > filters.maxLength) {
      return false;
    }

    return true;
  }

  private calculateSimilarityScore(quote: Quote, options: SimilarQuotesOptions): number {
    let score = 0;

    if (options.tags?.length) {
      const commonTags = quote.tags.filter((tag) => options.tags!.includes(tag));
      score += commonTags.length * SIMILARITY_CONSTANTS.TAG_SIMILARITY_WEIGHT;
    }

    if (options.author && quote.author === options.author) {
      score += SIMILARITY_CONSTANTS.AUTHOR_MATCH_WEIGHT;
    }

    return score;
  }

  private getSortedQuotes(compareFn: (a: Quote, b: Quote) => number, limit: number): Quote[] {
    return Array.from(this.quotes.values()).sort(compareFn).slice(0, limit);
  }
}
