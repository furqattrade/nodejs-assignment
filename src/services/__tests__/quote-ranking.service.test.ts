import { Quote } from '@app-types';

import { QuoteRankingService } from '../quote-ranking.service';

describe('QuoteRankingService', () => {
  let service: QuoteRankingService;

  beforeEach(() => {
    service = new QuoteRankingService();
  });

  const createMockQuote = (overrides: Partial<Quote> = {}): Quote => ({
    id: '1',
    content: 'Test quote',
    author: 'Test Author',
    tags: ['test'],
    length: 10,
    likes: 0,
    views: 0,
    createdAt: new Date(),
    lastViewedAt: null,
    ...overrides,
  });

  describe('calculateScore', () => {
    it('should calculate score for a quote with no activity', () => {
      const quote = createMockQuote();
      const score = service.calculateScore(quote);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should give higher score to quotes with more likes', () => {
      const quote1 = createMockQuote({ likes: 10, views: 100 });
      const quote2 = createMockQuote({ likes: 100, views: 100 });

      const score1 = service.calculateScore(quote1);
      const score2 = service.calculateScore(quote2);

      expect(score2).toBeGreaterThan(score1);
    });

    it('should consider engagement rate', () => {
      const highEngagement = createMockQuote({ likes: 50, views: 100 });
      const lowEngagement = createMockQuote({ likes: 10, views: 100 });

      const score1 = service.calculateScore(highEngagement);
      const score2 = service.calculateScore(lowEngagement);

      expect(score1).toBeGreaterThan(score2);
    });
  });

  describe('rankForNewUsers', () => {
    it('should rank quotes by score descending', () => {
      const quotes: Quote[] = [
        createMockQuote({ id: '1', likes: 10, views: 100 }),
        createMockQuote({ id: '2', likes: 100, views: 200 }),
        createMockQuote({ id: '3', likes: 50, views: 150 }),
      ];

      const ranked = service.rankForNewUsers(quotes);

      expect(ranked.length).toBe(3);
      expect(ranked[0].id).toBe('2');
    });

    it('should handle empty array', () => {
      const ranked = service.rankForNewUsers([]);
      expect(ranked).toEqual([]);
    });
  });

  describe('selectWeightedRandomQuote', () => {
    it('should return null for empty array', () => {
      const result = service.selectWeightedRandomQuote([]);
      expect(result).toBeNull();
    });

    it('should return a quote from the array', () => {
      const quotes: Quote[] = [
        createMockQuote({ id: '1', likes: 10, views: 100 }),
        createMockQuote({ id: '2', likes: 20, views: 100 }),
      ];

      const result = service.selectWeightedRandomQuote(quotes);

      expect(result).not.toBeNull();
      expect(quotes).toContainEqual(result!);
    });

    it('should favor higher-scored quotes over many selections', () => {
      const quotes: Quote[] = [
        createMockQuote({ id: 'low', likes: 1, views: 100 }),
        createMockQuote({ id: 'high', likes: 100, views: 200 }),
      ];

      const selections = new Map<string, number>();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const selected = service.selectWeightedRandomQuote(quotes);
        if (selected) {
          selections.set(selected.id, (selections.get(selected.id) || 0) + 1);
        }
      }

      expect(selections.get('high')! > selections.get('low')!).toBe(true);
    });
  });

  describe('getTopQuotes', () => {
    it('should return top N quotes', () => {
      const quotes: Quote[] = [
        createMockQuote({ id: '1', likes: 10, views: 100 }),
        createMockQuote({ id: '2', likes: 100, views: 200 }),
        createMockQuote({ id: '3', likes: 50, views: 150 }),
        createMockQuote({ id: '4', likes: 5, views: 50 }),
      ];

      const top = service.getTopQuotes(quotes, 2);

      expect(top.length).toBe(2);
      expect(top[0].id).toBe('2');
    });
  });
});
