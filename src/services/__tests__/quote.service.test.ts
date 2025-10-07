import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { ExternalQuote, Quote } from '@app-types';
import { QuoteRepository } from '@repositories/quote.repository';

import { ExternalQuotesService } from '../external-quotes.service';
import { QuoteRankingService } from '../quote-ranking.service';
import { QuoteService } from '../quote.service';

describe('QuoteService', () => {
  let quoteService: QuoteService;
  let mockRepository: {
    findAll: Mock;
    findById: Mock;
    findSimilar: Mock;
    save: Mock;
    update: Mock;
    delete: Mock;
    exists: Mock;
    incrementViews: Mock;
    incrementLikes: Mock;
    getTopRated: Mock;
    getMostViewed: Mock;
    getCount: Mock;
  };
  let mockExternalService: {
    fetchRandomQuote: Mock;
    fetchQuotesByTag: Mock;
    fetchQuotesByAuthor: Mock;
    searchQuotes: Mock;
  };
  let mockRankingService: {
    rankQuotes: Mock;
    rankForNewUsers: Mock;
    selectWeightedRandomQuote: Mock;
    calculateEngagementScore: Mock;
  };

  beforeEach(() => {
    mockRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findSimilar: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      incrementViews: vi.fn(),
      incrementLikes: vi.fn(),
      getTopRated: vi.fn(),
      getMostViewed: vi.fn(),
      getCount: vi.fn(),
    };

    mockExternalService = {
      fetchRandomQuote: vi.fn(),
      fetchQuotesByTag: vi.fn(),
      fetchQuotesByAuthor: vi.fn(),
      searchQuotes: vi.fn(),
    };

    mockRankingService = {
      rankQuotes: vi.fn(),
      rankForNewUsers: vi.fn(),
      selectWeightedRandomQuote: vi.fn(),
      calculateEngagementScore: vi.fn(),
    };

    quoteService = new QuoteService(
      mockRepository as unknown as QuoteRepository,
      mockExternalService as unknown as ExternalQuotesService,
      mockRankingService as unknown as QuoteRankingService
    );
  });

  describe('getRandomQuote', () => {
    it('should fetch and save a new random quote', async () => {
      const externalQuote: ExternalQuote = {
        _id: 'ext-1',
        content: 'Test quote',
        author: 'Test Author',
        tags: ['wisdom'],
        authorSlug: 'test-author',
        length: 10,
        dateAdded: '2024-01-01',
        dateModified: '2024-01-01',
      };

      mockExternalService.fetchRandomQuote.mockResolvedValue(externalQuote);
      mockRepository.exists.mockReturnValue(false);
      mockRepository.save.mockImplementation((quote: Quote) => quote);

      const result = await quoteService.getRandomQuote();

      expect(result.id).toBe('ext-1');
      expect(result.content).toBe('Test quote');
      expect(result.author).toBe('Test Author');
      expect(mockExternalService.fetchRandomQuote).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should return cached quote when external API fails', async () => {
      const cachedQuote: Quote = {
        id: 'cached-1',
        content: 'Cached quote',
        author: 'Cached Author',
        tags: ['test'],
        length: 12,
        likes: 5,
        views: 10,
        createdAt: new Date(),
        lastViewedAt: null,
      };

      mockExternalService.fetchRandomQuote.mockRejectedValue(new Error('API Error'));
      mockRepository.findAll.mockReturnValue([cachedQuote]);
      mockRankingService.selectWeightedRandomQuote.mockReturnValue(cachedQuote);
      mockRepository.incrementViews.mockReturnValue(cachedQuote);

      const result = await quoteService.getRandomQuote();

      expect(result.id).toBe('cached-1');
      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(mockRankingService.selectWeightedRandomQuote).toHaveBeenCalled();
    });

    it('should throw error when external API fails and no cached quotes', async () => {
      mockExternalService.fetchRandomQuote.mockRejectedValue(new Error('API Error'));
      mockRepository.findAll.mockReturnValue([]);

      await expect(quoteService.getRandomQuote()).rejects.toThrow('No quotes available');
    });
  });

  describe('getQuoteById', () => {
    it('should return quote and increment views', () => {
      const quote = {
        id: '1',
        content: 'Test',
        author: 'Author',
        tags: ['test'],
        views: 10,
        likes: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockReturnValue(quote);

      const result = quoteService.getQuoteById('1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should return undefined for non-existent quote', () => {
      mockRepository.findById.mockReturnValue(undefined);

      const result = quoteService.getQuoteById('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('likeQuote', () => {
    it('should increment likes for existing quote', () => {
      const quote = {
        id: '1',
        content: 'Test',
        author: 'Author',
        tags: ['test'],
        views: 10,
        likes: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.incrementLikes.mockReturnValue({ ...quote, likes: 6 });

      const result = quoteService.likeQuote('1');

      expect(result).toBeDefined();
      expect(result?.likes).toBe(6);
      expect(mockRepository.incrementLikes).toHaveBeenCalledWith('1');
    });

    it('should return undefined for non-existent quote', () => {
      mockRepository.incrementLikes.mockReturnValue(undefined);

      const result = quoteService.likeQuote('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('getSimilarQuotes', () => {
    it('should return similar quotes based on tags', async () => {
      const sourceQuote = {
        id: '1',
        content: 'Test',
        author: 'Author',
        tags: ['wisdom', 'life'],
        views: 10,
        likes: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const similarQuote: Quote = {
        id: 'similar-1',
        content: 'Similar quote',
        author: 'Author',
        tags: ['wisdom'],
        views: 10,
        likes: 5,
        createdAt: new Date(),
        lastViewedAt: null,
        length: 13,
      };

      mockRepository.findById.mockReturnValue(sourceQuote);
      mockRepository.findSimilar.mockReturnValue([similarQuote]);

      const result = await quoteService.getSimilarQuotes('1', { limit: 5 });

      expect(result.length).toBeGreaterThan(0);
      expect(mockRepository.findSimilar).toHaveBeenCalled();
    });

    it('should throw error for non-existent quote', async () => {
      mockRepository.findById.mockReturnValue(undefined);

      await expect(quoteService.getSimilarQuotes('non-existent', { limit: 5 })).rejects.toThrow(
        'Quote with id non-existent not found'
      );
    });
  });

  describe('getTopRatedQuotes', () => {
    it('should return ranked quotes', () => {
      const quotes = [
        {
          id: '1',
          content: 'Quote 1',
          author: 'Author 1',
          tags: ['wisdom'],
          views: 100,
          likes: 50,
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(),
        },
        {
          id: '2',
          content: 'Quote 2',
          author: 'Author 2',
          tags: ['life'],
          views: 200,
          likes: 30,
          createdAt: new Date(Date.now() - 172800000),
          updatedAt: new Date(),
        },
      ];

      mockRepository.getTopRated.mockReturnValue(quotes);
      mockRankingService.rankForNewUsers.mockReturnValue(quotes);

      const result = quoteService.getTopRatedQuotes(10);

      expect(result).toHaveLength(2);
      expect(mockRepository.getTopRated).toHaveBeenCalledWith(10);
    });

    it('should limit results to requested amount', () => {
      const quotes = Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`,
        content: `Quote ${i}`,
        author: `Author ${i}`,
        tags: ['test'],
        views: 10,
        likes: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockRepository.getTopRated.mockReturnValue(quotes);
      mockRankingService.rankForNewUsers.mockReturnValue(quotes);

      const result = quoteService.getTopRatedQuotes(5);

      expect(result).toHaveLength(5);
    });
  });

  describe('getMostViewedQuotes', () => {
    it('should return most viewed quotes', () => {
      const quotes = [
        {
          id: '1',
          content: 'Quote 1',
          author: 'Author 1',
          tags: ['wisdom'],
          views: 1000,
          likes: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          content: 'Quote 2',
          author: 'Author 2',
          tags: ['life'],
          views: 500,
          likes: 30,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.getMostViewed.mockReturnValue(quotes);

      const result = quoteService.getMostViewedQuotes(10);

      expect(result).toEqual(quotes);
      expect(mockRepository.getMostViewed).toHaveBeenCalledWith(10);
    });
  });

  describe('getStatistics', () => {
    it('should return repository statistics', () => {
      const quotes = [
        {
          id: '1',
          content: 'Quote 1',
          author: 'Author 1',
          tags: ['wisdom', 'life'],
          views: 100,
          likes: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          content: 'Quote 2',
          author: 'Author 2',
          tags: ['wisdom'],
          views: 200,
          likes: 30,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.findAll.mockReturnValue(quotes);
      mockRepository.getCount.mockReturnValue(2);

      const stats = quoteService.getStatistics();

      expect(stats.totalQuotes).toBe(2);
      expect(stats.totalViews).toBe(300);
      expect(stats.totalLikes).toBe(80);
      expect(stats.averageViews).toBe(150);
      expect(stats.averageLikes).toBe(40);
    });

    it('should handle empty repository', () => {
      mockRepository.findAll.mockReturnValue([]);
      mockRepository.getCount.mockReturnValue(0);

      const stats = quoteService.getStatistics();

      expect(stats.totalQuotes).toBe(0);
      expect(stats.totalViews).toBe(0);
      expect(stats.totalLikes).toBe(0);
      expect(stats.averageViews).toBe(0);
      expect(stats.averageLikes).toBe(0);
    });
  });

  describe('getAllQuotes', () => {
    it('should return all quotes from repository', () => {
      const quotes = [
        {
          id: '1',
          content: 'Quote 1',
          author: 'Author 1',
          tags: ['test'],
          views: 10,
          likes: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.findAll.mockReturnValue(quotes);

      const result = quoteService.getAllQuotes();

      expect(result).toEqual(quotes);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });
});
