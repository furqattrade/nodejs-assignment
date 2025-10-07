import { Quote } from '@app-types';

import { QuoteRepository } from '../quote.repository';

describe('QuoteRepository', () => {
  let repository: QuoteRepository;

  beforeEach(() => {
    repository = new QuoteRepository();
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

  describe('save', () => {
    it('should save a quote', () => {
      const quote = createMockQuote();
      const saved = repository.save(quote);

      expect(saved).toEqual(quote);
      expect(repository.exists(quote.id)).toBe(true);
    });
  });

  describe('findById', () => {
    it('should find quote by id', () => {
      const quote = createMockQuote();
      repository.save(quote);

      const found = repository.findById(quote.id);
      expect(found).toEqual(quote);
    });

    it('should return undefined for non-existent id', () => {
      const found = repository.findById('non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return all quotes', () => {
      const quote1 = createMockQuote({ id: '1' });
      const quote2 = createMockQuote({ id: '2' });

      repository.save(quote1);
      repository.save(quote2);

      const all = repository.findAll();
      expect(all.length).toBe(2);
    });

    it('should filter by tags', () => {
      const quote1 = createMockQuote({ id: '1', tags: ['inspiration'] });
      const quote2 = createMockQuote({ id: '2', tags: ['wisdom'] });

      repository.save(quote1);
      repository.save(quote2);

      const filtered = repository.findAll({ tags: ['inspiration'] });
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter by author', () => {
      const quote1 = createMockQuote({ id: '1', author: 'Einstein' });
      const quote2 = createMockQuote({ id: '2', author: 'Shakespeare' });

      repository.save(quote1);
      repository.save(quote2);

      const filtered = repository.findAll({ author: 'ein' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter by length range', () => {
      const quote1 = createMockQuote({ id: '1', length: 50 });
      const quote2 = createMockQuote({ id: '2', length: 150 });

      repository.save(quote1);
      repository.save(quote2);

      const filtered = repository.findAll({ minLength: 100 });
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('2');
    });
  });

  describe('findSimilar', () => {
    it('should find quotes with matching tags', () => {
      const quote1 = createMockQuote({
        id: '1',
        tags: ['inspiration', 'wisdom'],
      });
      const quote2 = createMockQuote({ id: '2', tags: ['inspiration'] });
      const quote3 = createMockQuote({ id: '3', tags: ['humor'] });

      repository.save(quote1);
      repository.save(quote2);
      repository.save(quote3);

      const similar = repository.findSimilar({
        tags: ['inspiration'],
        limit: 5,
      });

      expect(similar.length).toBe(2);
      expect(similar.map((q) => q.id)).toContain('1');
      expect(similar.map((q) => q.id)).toContain('2');
    });

    it('should exclude specified quote', () => {
      const quote1 = createMockQuote({ id: '1', tags: ['test'] });
      const quote2 = createMockQuote({ id: '2', tags: ['test'] });

      repository.save(quote1);
      repository.save(quote2);

      const similar = repository.findSimilar({
        tags: ['test'],
        excludeId: '1',
        limit: 5,
      });

      expect(similar.length).toBe(1);
      expect(similar[0].id).toBe('2');
    });

    it('should limit results', () => {
      for (let i = 0; i < 10; i++) {
        repository.save(createMockQuote({ id: `${i}`, tags: ['test'] }));
      }

      const similar = repository.findSimilar({
        tags: ['test'],
        limit: 3,
      });

      expect(similar.length).toBe(3);
    });
  });

  describe('incrementLikes', () => {
    it('should increment likes', () => {
      const quote = createMockQuote({ likes: 5 });
      repository.save(quote);

      const updated = repository.incrementLikes(quote.id);
      expect(updated?.likes).toBe(6);
    });

    it('should return undefined for non-existent quote', () => {
      const result = repository.incrementLikes('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('incrementViews', () => {
    it('should increment views and update lastViewedAt', () => {
      const quote = createMockQuote({ views: 10 });
      repository.save(quote);

      const updated = repository.incrementViews(quote.id);
      expect(updated?.views).toBe(11);
      expect(updated?.lastViewedAt).toBeInstanceOf(Date);
    });
  });

  describe('getTopRated', () => {
    it('should return top rated quotes', () => {
      repository.save(createMockQuote({ id: '1', likes: 10 }));
      repository.save(createMockQuote({ id: '2', likes: 50 }));
      repository.save(createMockQuote({ id: '3', likes: 30 }));

      const top = repository.getTopRated(2);
      expect(top.length).toBe(2);
      expect(top[0].id).toBe('2');
      expect(top[1].id).toBe('3');
    });
  });

  describe('getMostViewed', () => {
    it('should return most viewed quotes', () => {
      repository.save(createMockQuote({ id: '1', views: 100 }));
      repository.save(createMockQuote({ id: '2', views: 500 }));
      repository.save(createMockQuote({ id: '3', views: 300 }));

      const top = repository.getMostViewed(2);
      expect(top.length).toBe(2);
      expect(top[0].id).toBe('2');
      expect(top[1].id).toBe('3');
    });
  });

  describe('getCount', () => {
    it('should return count of quotes', () => {
      expect(repository.getCount()).toBe(0);

      repository.save(createMockQuote({ id: '1' }));
      repository.save(createMockQuote({ id: '2' }));

      expect(repository.getCount()).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all quotes', () => {
      repository.save(createMockQuote({ id: '1' }));
      repository.save(createMockQuote({ id: '2' }));

      expect(repository.getCount()).toBe(2);

      repository.clear();
      expect(repository.getCount()).toBe(0);
    });
  });
});
