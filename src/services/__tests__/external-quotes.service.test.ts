import nock from 'nock';
import { beforeEach, describe, expect, it } from 'vitest';

import { config } from '@config';

import { ExternalQuotesService } from '../external-quotes.service';

describe('ExternalQuotesService', () => {
  let service: ExternalQuotesService;
  const baseUrl = config.quotesApiUrl;

  beforeEach(() => {
    service = new ExternalQuotesService();
    nock.cleanAll();
  });

  describe('fetchRandomQuote', () => {
    it('should fetch a random quote successfully', async () => {
      const mockQuote = {
        _id: '1',
        content: 'Test quote',
        author: 'Test Author',
        tags: ['wisdom'],
        authorSlug: 'test-author',
        length: 10,
        dateAdded: '2024-01-01',
        dateModified: '2024-01-01',
      };

      nock(baseUrl).get('/random').reply(200, mockQuote);

      const result = await service.fetchRandomQuote();

      expect(result).toEqual(mockQuote);
    });

    it('should handle HTTP errors', async () => {
      nock(baseUrl).get('/random').reply(404);

      await expect(service.fetchRandomQuote()).rejects.toThrow('HTTP 404');
    });

    it('should handle network errors', async () => {
      nock(baseUrl).get('/random').replyWithError({ code: 'ENOTFOUND' });

      await expect(service.fetchRandomQuote()).rejects.toThrow('Network error');
    });

    it('should handle 500 errors with retry', async () => {
      nock(baseUrl).get('/random').reply(500).persist();

      await expect(service.fetchRandomQuote()).rejects.toThrow();
    });
  });

  describe('fetchQuotesByTag', () => {
    it('should fetch quotes by tag successfully', async () => {
      const mockQuotes = {
        results: [
          {
            _id: '1',
            content: 'Quote 1',
            author: 'Author 1',
            tags: ['wisdom'],
            authorSlug: 'author-1',
            length: 7,
            dateAdded: '2024-01-01',
            dateModified: '2024-01-01',
          },
          {
            _id: '2',
            content: 'Quote 2',
            author: 'Author 2',
            tags: ['wisdom'],
            authorSlug: 'author-2',
            length: 7,
            dateAdded: '2024-01-01',
            dateModified: '2024-01-01',
          },
        ],
      };

      nock(baseUrl).get('/quotes').query({ tags: 'wisdom', limit: 10 }).reply(200, mockQuotes);

      const result = await service.fetchQuotesByTag('wisdom', 10);

      expect(result).toEqual(mockQuotes.results);
      expect(result).toHaveLength(2);
    });

    it('should handle empty results', async () => {
      nock(baseUrl).get('/quotes').query({ tags: 'nonexistent', limit: 10 }).reply(200, {
        results: [],
      });

      const result = await service.fetchQuotesByTag('nonexistent', 10);

      expect(result).toEqual([]);
    });
  });

  describe('fetchQuotesByAuthor', () => {
    it('should fetch quotes by author successfully', async () => {
      const mockQuotes = {
        results: [
          {
            _id: '1',
            content: 'Quote by Einstein',
            author: 'Albert Einstein',
            tags: ['science'],
            authorSlug: 'albert-einstein',
            length: 18,
            dateAdded: '2024-01-01',
            dateModified: '2024-01-01',
          },
        ],
      };

      nock(baseUrl)
        .get('/quotes')
        .query({ author: 'Albert Einstein', limit: 10 })
        .reply(200, mockQuotes);

      const result = await service.fetchQuotesByAuthor('Albert Einstein', 10);

      expect(result).toEqual(mockQuotes.results);
      expect(result).toHaveLength(1);
    });

    it('should handle 404 errors', async () => {
      nock(baseUrl).get('/quotes').query({ author: 'Unknown', limit: 10 }).reply(404);

      await expect(service.fetchQuotesByAuthor('Unknown', 10)).rejects.toThrow('HTTP 404');
    });
  });

  describe('searchQuotes', () => {
    it('should search quotes successfully', async () => {
      const mockQuotes = {
        results: [
          {
            _id: '1',
            content: 'Life is beautiful',
            author: 'Author',
            tags: ['life'],
            authorSlug: 'author',
            length: 17,
            dateAdded: '2024-01-01',
            dateModified: '2024-01-01',
          },
        ],
      };

      nock(baseUrl)
        .get('/search/quotes')
        .query({ query: 'life', limit: 10 })
        .reply(200, mockQuotes);

      const result = await service.searchQuotes('life', 10);

      expect(result).toEqual(mockQuotes.results);
      expect(result).toHaveLength(1);
    });

    it('should handle empty search results', async () => {
      nock(baseUrl).get('/search/quotes').query({ query: 'xyz123', limit: 10 }).reply(200, {
        results: [],
      });

      const result = await service.searchQuotes('xyz123', 10);

      expect(result).toEqual([]);
    });
  });

  describe('circuit breaker', () => {
    it.skip('should open circuit after multiple failures', async () => {
      nock(baseUrl).get('/random').times(10).reply(500);

      for (let i = 0; i < 10; i++) {
        await service.fetchRandomQuote();
      }

      await expect(service.fetchRandomQuote()).rejects.toThrow();
    });
  });
});
