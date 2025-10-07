import { Quote, ExternalQuote, SimilarQuotesOptions } from '@app-types';
import { QuoteRepository } from '@repositories/quote.repository';
import { logger } from '@utils';

import { ExternalQuotesService } from './external-quotes.service';
import { QuoteRankingService } from './quote-ranking.service';

export class QuoteService {
  constructor(
    private repository: QuoteRepository,
    private externalService: ExternalQuotesService,
    private rankingService: QuoteRankingService
  ) {}

  async getRandomQuote(): Promise<Quote> {
    try {
      const quote = await this.fetchAndCacheQuote();
      this.repository.incrementViews(quote.id);
      return quote;
    } catch {
      const cachedQuotes = this.repository.findAll();

      if (cachedQuotes.length > 0) {
        const selectedQuote = this.rankingService.selectWeightedRandomQuote(cachedQuotes);
        if (selectedQuote) {
          this.repository.incrementViews(selectedQuote.id);
          return selectedQuote;
        }
      }

      throw new Error('No quotes available');
    }
  }

  private async fetchAndCacheQuote(): Promise<Quote> {
    const externalQuote = await this.externalService.fetchRandomQuote();
    const quote = this.mapExternalQuote(externalQuote);

    if (!this.repository.exists(quote.id)) {
      this.repository.save(quote);
    }

    return quote;
  }

  getQuoteById(id: string): Quote | undefined {
    return this.repository.findById(id);
  }

  likeQuote(id: string): Quote | undefined {
    return this.repository.incrementLikes(id);
  }

  async getSimilarQuotes(
    quoteId: string,
    options?: Partial<SimilarQuotesOptions>
  ): Promise<Quote[]> {
    const quote = this.repository.findById(quoteId);
    if (!quote) {
      throw new Error(`Quote with id ${quoteId} not found`);
    }

    const similarOptions: SimilarQuotesOptions = {
      tags: quote.tags,
      author: quote.author,
      limit: options?.limit || 5,
      excludeId: quoteId,
    };

    let similarQuotes = this.repository.findSimilar(similarOptions);

    if (similarQuotes.length < (similarOptions.limit || 5)) {
      await this.fetchSimilarQuotesFromExternal(quote);
      similarQuotes = this.repository.findSimilar(similarOptions);
    }

    return similarQuotes;
  }

  private async fetchSimilarQuotesFromExternal(quote: Quote): Promise<void> {
    try {
      if (quote.tags.length > 0) {
        const tag = quote.tags[0];
        const externalQuotes = await this.externalService.fetchQuotesByTag(tag, 5);
        externalQuotes.forEach((eq) => {
          const mappedQuote = this.mapExternalQuote(eq);
          if (!this.repository.exists(mappedQuote.id)) {
            this.repository.save(mappedQuote);
          }
        });
      }
    } catch (error) {
      logger.warn('Failed to fetch similar quotes from external API', { error });
    }
  }

  getTopRatedQuotes(limit = 10): Quote[] {
    const quotes = this.repository.getTopRated(limit);
    return this.rankingService.rankForNewUsers(quotes);
  }

  getMostViewedQuotes(limit = 10): Quote[] {
    return this.repository.getMostViewed(limit);
  }

  getAllQuotes(): Quote[] {
    return this.repository.findAll();
  }

  getStatistics() {
    const quotes = this.repository.findAll();
    const { totalLikes, totalViews } = quotes.reduce(
      (acc, q) => ({
        totalLikes: acc.totalLikes + q.likes,
        totalViews: acc.totalViews + q.views,
      }),
      { totalLikes: 0, totalViews: 0 }
    );

    return {
      totalQuotes: this.repository.getCount(),
      totalLikes,
      totalViews,
      averageLikes: quotes.length > 0 ? totalLikes / quotes.length : 0,
      averageViews: quotes.length > 0 ? totalViews / quotes.length : 0,
    };
  }

  private mapExternalQuote(externalQuote: ExternalQuote): Quote {
    return {
      id: externalQuote._id,
      content: externalQuote.content,
      author: externalQuote.author,
      tags: externalQuote.tags,
      length: externalQuote.length,
      likes: 0,
      views: 0,
      createdAt: new Date(externalQuote.dateAdded),
      lastViewedAt: null,
    };
  }
}
