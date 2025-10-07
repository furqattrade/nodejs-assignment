import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { QuoteResponse, LikeQuoteResponse, SimilarQuotesResponse, Quote } from '@app-types';
import { logger, parseIntQuery } from '@utils';

import { QuoteService } from '../services/quote.service';

export function quotesRoutes(fastify: FastifyInstance, quoteService: QuoteService): void {
  logger.info('Registering quotes routes');

  const mapQuoteToResponse = (quote: Quote): QuoteResponse => ({
    id: quote.id,
    content: quote.content,
    author: quote.author,
    tags: quote.tags,
    length: quote.length,
    likes: quote.likes,
    views: quote.views,
  });

  fastify.get(
    '/api/quotes/random',
    {
      schema: {
        description: 'Get a random quote with smart ranking',
        tags: ['quotes'],
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
              author: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              length: { type: 'number' },
              likes: { type: 'number' },
              views: { type: 'number' },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      logger.debug('GET /api/quotes/random called');
      try {
        const quote = await quoteService.getRandomQuote();
        logger.debug('Quote fetched', { id: quote.id });
        return reply.code(200).send(mapQuoteToResponse(quote));
      } catch (error) {
        logger.error('Error in GET /api/quotes/random', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch random quote';

        if (errorMessage.includes('timeout') || errorMessage.includes('Network error')) {
          return reply.code(503).send({
            error: 'Service Unavailable',
            message: errorMessage,
            statusCode: 503,
          });
        }

        return reply.code(500).send({
          error: 'Internal Server Error',
          message: errorMessage,
          statusCode: 500,
        });
      }
    }
  );

  fastify.get<{ Params: { id: string } }>(
    '/api/quotes/:id',
    {
      schema: {
        description: 'Get a quote by ID',
        tags: ['quotes'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Quote ID' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
              author: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              length: { type: 'number' },
              likes: { type: 'number' },
              views: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const quote = quoteService.getQuoteById(request.params.id);

        if (!quote) {
          return reply.code(404).send({
            error: 'Not Found',
            message: `Quote with id ${request.params.id} not found`,
            statusCode: 404,
          });
        }

        return reply.code(200).send(mapQuoteToResponse(quote));
      } catch (error) {
        logger.error('Error in GET /api/quotes/:id', error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch quote',
          statusCode: 500,
        });
      }
    }
  );

  fastify.post<{ Params: { id: string } }>(
    '/api/quotes/:id/like',
    {
      schema: {
        description: 'Like a quote',
        tags: ['quotes'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Quote ID' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              likes: { type: 'number' },
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const quote = quoteService.likeQuote(request.params.id);

        if (!quote) {
          return reply.code(404).send({
            error: 'Not Found',
            message: `Quote with id ${request.params.id} not found`,
            statusCode: 404,
          });
        }

        const response: LikeQuoteResponse = {
          id: quote.id,
          likes: quote.likes,
          success: true,
        };

        return reply.code(200).send(response);
      } catch (error) {
        logger.error('Error in POST /api/quotes/:id/like', error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to like quote',
          statusCode: 500,
        });
      }
    }
  );

  fastify.get<{
    Params: { id: string };
    Querystring: { limit?: string };
  }>(
    '/api/quotes/:id/similar',
    {
      schema: {
        description: 'Get similar quotes based on tags and author',
        tags: ['quotes'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Quote ID' },
          },
          required: ['id'],
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', minimum: 1, maximum: 50, default: 5 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              quotes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    content: { type: 'string' },
                    author: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                    length: { type: 'number' },
                    likes: { type: 'number' },
                    views: { type: 'number' },
                  },
                },
              },
              total: { type: 'number' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Querystring: { limit?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const limit = parseIntQuery(request.query.limit, 5);
        const quotes = await quoteService.getSimilarQuotes(request.params.id, { limit });

        const response: SimilarQuotesResponse = {
          quotes: quotes.map(mapQuoteToResponse),
          total: quotes.length,
        };

        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.code(404).send({
            error: 'Not Found',
            message: error.message,
            statusCode: 404,
          });
        }

        logger.error('Error in GET /api/quotes/:id/similar', error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch similar quotes',
          statusCode: 500,
        });
      }
    }
  );

  fastify.get<{ Querystring: { limit?: string } }>(
    '/api/quotes/top-rated',
    {
      schema: {
        description: 'Get top-rated quotes',
        tags: ['quotes'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', minimum: 1, maximum: 100, default: 10 },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { limit?: string } }>, reply: FastifyReply) => {
      try {
        const limit = parseIntQuery(request.query.limit, 10);
        const quotes = quoteService.getTopRatedQuotes(limit);

        return reply.code(200).send({
          quotes: quotes.map(mapQuoteToResponse),
          total: quotes.length,
        });
      } catch (error) {
        logger.error('Error in GET /api/quotes/top-rated', error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch top-rated quotes',
          statusCode: 500,
        });
      }
    }
  );

  fastify.get<{ Querystring: { limit?: string } }>(
    '/api/quotes/most-viewed',
    {
      schema: {
        description: 'Get most viewed quotes',
        tags: ['quotes'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', minimum: 1, maximum: 100, default: 10 },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { limit?: string } }>, reply: FastifyReply) => {
      try {
        const limit = parseIntQuery(request.query.limit, 10);
        const quotes = quoteService.getMostViewedQuotes(limit);

        return reply.code(200).send({
          quotes: quotes.map(mapQuoteToResponse),
          total: quotes.length,
        });
      } catch (error) {
        logger.error('Error in GET /api/quotes/most-viewed', error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch most viewed quotes',
          statusCode: 500,
        });
      }
    }
  );

  fastify.get(
    '/api/quotes',
    {
      schema: {
        description: 'Get all quotes',
        tags: ['quotes'],
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const quotes = quoteService.getAllQuotes();
        return reply.code(200).send({
          quotes: quotes.map(mapQuoteToResponse),
          total: quotes.length,
        });
      } catch (error) {
        logger.error('Error in GET /api/quotes', error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch quotes',
          statusCode: 500,
        });
      }
    }
  );
}
