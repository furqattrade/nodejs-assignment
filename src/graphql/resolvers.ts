import { MercuriusContext } from 'mercurius';

import { Quote } from '@app-types';

import { QuoteService } from '../services/quote.service';

export interface Context extends MercuriusContext {
  quoteService: QuoteService;
}

export const resolvers = {
  Query: {
    randomQuote: async (_parent: unknown, _args: unknown, context: Context) => {
      const quote = await context.quoteService.getRandomQuote();
      return mapQuoteToGraphQL(quote);
    },

    quote: (_parent: unknown, args: { id: string }, context: Context) => {
      const quote = context.quoteService.getQuoteById(args.id);
      return quote ? mapQuoteToGraphQL(quote) : null;
    },

    similarQuotes: async (
      _parent: unknown,
      args: { id: string; limit?: number },
      context: Context
    ) => {
      const quotes = await context.quoteService.getSimilarQuotes(args.id, {
        limit: args.limit || 5,
      });

      return {
        quotes: quotes.map(mapQuoteToGraphQL),
        total: quotes.length,
      };
    },

    topRatedQuotes: (_parent: unknown, args: { limit?: number }, context: Context) => {
      const quotes = context.quoteService.getTopRatedQuotes(args.limit || 10);

      return {
        quotes: quotes.map(mapQuoteToGraphQL),
        total: quotes.length,
      };
    },

    mostViewedQuotes: (_parent: unknown, args: { limit?: number }, context: Context) => {
      const quotes = context.quoteService.getMostViewedQuotes(args.limit || 10);

      return {
        quotes: quotes.map(mapQuoteToGraphQL),
        total: quotes.length,
      };
    },

    allQuotes: (_parent: unknown, _args: unknown, context: Context) => {
      const quotes = context.quoteService.getAllQuotes();

      return {
        quotes: quotes.map(mapQuoteToGraphQL),
        total: quotes.length,
      };
    },
  },

  Mutation: {
    likeQuote: (_parent: unknown, args: { id: string }, context: Context) => {
      const quote = context.quoteService.likeQuote(args.id);

      if (!quote) {
        throw new Error(`Quote with id ${args.id} not found`);
      }

      return {
        id: quote.id,
        likes: quote.likes,
        success: true,
      };
    },
  },
};

function mapQuoteToGraphQL(quote: Quote) {
  return {
    id: quote.id,
    content: quote.content,
    author: quote.author,
    tags: quote.tags,
    length: quote.length,
    likes: quote.likes,
    views: quote.views,
  };
}
