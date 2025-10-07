import { FastifyInstance } from 'fastify';
import nock from 'nock';

import { QuoteResponse, LikeQuoteResponse, SimilarQuotesResponse } from '@app-types';

import { buildServer } from '../index';

interface GraphQLResponse<T> {
  data: T;
}

interface RandomQuoteData {
  randomQuote: QuoteResponse;
}

interface LikeQuoteData {
  likeQuote: LikeQuoteResponse;
}

describe('Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Clean any previous mocks
    nock.cleanAll();
    nock.enableNetConnect('127.0.0.1');

    // Mock external API - baseURL is https://api.quotable.io/quotes, so paths are appended to that
    nock('https://api.quotable.io')
      .get('/quotes/random') // Full path: baseURL + /random
      .times(100) // Allow multiple calls
      .reply(200, [
        {
          _id: 'test-quote-1',
          content: 'Test quote content',
          author: 'Test Author',
          tags: ['test'],
          authorSlug: 'test-author',
          length: 18,
          dateAdded: '2024-01-01',
          dateModified: '2024-01-01',
        },
      ]);

    nock('https://api.quotable.io')
      .get('/quotes/quotes') // Full path: baseURL + /quotes
      .query(true)
      .times(100) // Allow multiple calls
      .reply(200, {
        results: [
          {
            _id: 'test-quote-2',
            content: 'Similar quote',
            author: 'Test Author',
            tags: ['test'],
            authorSlug: 'test-author',
            length: 13,
            dateAdded: '2024-01-01',
            dateModified: '2024-01-01',
          },
        ],
      });

    app = await buildServer();
  });

  afterAll(async () => {
    await app.close();
    nock.cleanAll();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as {
        status: string;
        timestamp: string;
        uptime: number;
        environment: string;
        version: string;
        checks: unknown;
      };
      expect(body.status).toMatch(/healthy|degraded|unhealthy/);
      expect(body.timestamp).toBeDefined();
      expect(body.uptime).toBeGreaterThan(0);
      expect(body.environment).toBeDefined();
      expect(body.checks).toBeDefined();
    });
  });

  describe('REST API', () => {
    describe('GET /api/quotes/random', () => {
      it('should return a random quote', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/quotes/random',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body) as QuoteResponse;
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('content');
        expect(body).toHaveProperty('author');
        expect(body).toHaveProperty('tags');
      });
    });

    describe('POST /api/quotes/:id/like', () => {
      it('should like a quote', async () => {
        const getResponse = await app.inject({
          method: 'GET',
          url: '/api/quotes/random',
        });

        const quote = JSON.parse(getResponse.body) as QuoteResponse;

        const likeResponse = await app.inject({
          method: 'POST',
          url: `/api/quotes/${quote.id}/like`,
        });

        expect(likeResponse.statusCode).toBe(200);
        const body = JSON.parse(likeResponse.body) as LikeQuoteResponse;
        expect(body.success).toBe(true);
        expect(body.likes).toBeGreaterThan(0);
      });

      it('should return 404 for non-existent quote', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/quotes/non-existent-id/like',
        });

        expect(response.statusCode).toBe(404);
      });
    });

    describe('GET /api/quotes/:id/similar', () => {
      it('should return similar quotes', async () => {
        const getResponse = await app.inject({
          method: 'GET',
          url: '/api/quotes/random',
        });

        const quote = JSON.parse(getResponse.body) as QuoteResponse;

        const similarResponse = await app.inject({
          method: 'GET',
          url: `/api/quotes/${quote.id}/similar?limit=3`,
        });

        expect(similarResponse.statusCode).toBe(200);
        const body = JSON.parse(similarResponse.body) as SimilarQuotesResponse;
        expect(body).toHaveProperty('quotes');
        expect(body).toHaveProperty('total');
        expect(Array.isArray(body.quotes)).toBe(true);
      });
    });
  });

  describe('GraphQL API', () => {
    it('should execute randomQuote query', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            query {
              randomQuote {
                id
                content
                author
                tags
                likes
                views
              }
            }
          `,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as GraphQLResponse<RandomQuoteData>;
      expect(body.data.randomQuote).toBeDefined();
      expect(body.data.randomQuote).toHaveProperty('id');
      expect(body.data.randomQuote).toHaveProperty('content');
    });

    it('should execute likeQuote mutation', async () => {
      const getResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            query {
              randomQuote {
                id
              }
            }
          `,
        },
      });

      const quoteId = (JSON.parse(getResponse.body) as GraphQLResponse<RandomQuoteData>).data
        .randomQuote.id;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            mutation {
              likeQuote(id: "${quoteId}") {
                id
                likes
                success
              }
            }
          `,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as GraphQLResponse<LikeQuoteData>;
      expect(body.data.likeQuote.success).toBe(true);
      expect(body.data.likeQuote.likes).toBeGreaterThan(0);
    });
  });
});
