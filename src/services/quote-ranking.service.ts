import { Quote, QuoteMetrics, RankingWeights } from '@app-types';
import { RANKING_CONSTANTS } from '@constants';
import { logger } from '@utils';

export class QuoteRankingService {
  private readonly weights: RankingWeights = RANKING_CONSTANTS.DEFAULT_WEIGHTS;

  public calculateScore(quote: Quote): number {
    const metrics = this.calculateMetrics(quote);

    const score =
      metrics.recency * this.weights.recency +
      metrics.popularity * this.weights.likes +
      metrics.engagement * this.weights.engagement;

    logger.debug('Quote score calculated', {
      quoteId: quote.id,
      score: score.toFixed(3),
      metrics,
    });

    return score;
  }

  private calculateMetrics(quote: Quote): QuoteMetrics {
    const recency = this.calculateRecencyScore(quote);
    const popularity = this.calculatePopularityScore(quote);
    const engagement = this.calculateEngagementScore(quote);

    return {
      score: 0,
      recency,
      popularity,
      engagement,
    };
  }

  private calculateRecencyScore(quote: Quote): number {
    if (!quote.lastViewedAt) {
      return RANKING_CONSTANTS.RECENCY_BASELINE;
    }

    const now = Date.now();
    const lastViewed = quote.lastViewedAt.getTime();
    const hoursSinceView = (now - lastViewed) / (1000 * 60 * 60);

    return Math.exp(-hoursSinceView / RANKING_CONSTANTS.RECENCY_DECAY_HOURS);
  }

  private calculatePopularityScore(quote: Quote): number {
    if (quote.likes === 0) {
      return 0;
    }

    return Math.log10(quote.likes + 1) / 2;
  }

  private calculateEngagementScore(quote: Quote): number {
    if (quote.views === 0) {
      return 0;
    }

    const ratio = quote.likes / quote.views;

    return Math.min(ratio, 1.0);
  }

  public rankForNewUsers(quotes: Quote[]): Quote[] {
    logger.debug('Ranking quotes for new users', { count: quotes.length });

    const scoredQuotes = quotes.map((quote) => ({
      quote,
      score: this.calculateScore(quote),
    }));

    scoredQuotes.sort((a, b) => b.score - a.score);

    logger.info('Quotes ranked for new users', {
      count: quotes.length,
      topScore: scoredQuotes[0]?.score.toFixed(3),
      bottomScore: scoredQuotes[scoredQuotes.length - 1]?.score.toFixed(3),
    });

    return scoredQuotes.map((item) => item.quote);
  }

  public selectWeightedRandomQuote(quotes: Quote[]): Quote | null {
    if (quotes.length === 0) {
      logger.warn('No quotes available for weighted random selection');
      return null;
    }

    const scoredQuotes = quotes.map((quote) => ({
      quote,
      score: Math.max(this.calculateScore(quote), RANKING_CONSTANTS.MIN_SCORE),
    }));

    const totalScore = scoredQuotes.reduce((sum, item) => sum + item.score, 0);

    let random = Math.random() * totalScore;

    for (const item of scoredQuotes) {
      random -= item.score;
      if (random <= 0) {
        logger.debug('Quote selected via weighted random', {
          quoteId: item.quote.id,
          score: item.score.toFixed(3),
        });
        return item.quote;
      }
    }

    const fallback = scoredQuotes[scoredQuotes.length - 1].quote;
    logger.debug('Fallback quote selected', { quoteId: fallback.id });
    return fallback;
  }

  public getTopQuotes(quotes: Quote[], limit = 10): Quote[] {
    logger.debug('Getting top quotes', { totalQuotes: quotes.length, limit });

    const topQuotes = this.rankForNewUsers(quotes).slice(0, limit);

    logger.info('Top quotes retrieved', { count: topQuotes.length, limit });

    return topQuotes;
  }
}
