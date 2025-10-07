import { z } from 'zod';

import { NODE_ENV, LOG_LEVEL, VALIDATION_CONSTANTS } from '@constants';

export const envSchema = z.object({
  PORT: z
    .string({
      required_error: 'PORT is required',
    })
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'PORT must be a valid positive number',
    })
    .transform(Number)
    .pipe(z.number().int().positive().max(VALIDATION_CONSTANTS.MAX_PORT)),
  HOST: z.string({
    required_error: 'HOST is required',
  }),
  NODE_ENV: z.enum([NODE_ENV.DEVELOPMENT, NODE_ENV.PRODUCTION, NODE_ENV.TEST] as const, {
    errorMap: (issue) => {
      if (issue.code === 'invalid_type') {
        return { message: 'NODE_ENV is required' };
      }
      if (issue.code === 'invalid_enum_value') {
        return {
          message: 'NODE_ENV must be one of: development, production, test',
        };
      }
      return { message: 'NODE_ENV is invalid' };
    },
  }),
  LOG_LEVEL: z.enum([LOG_LEVEL.DEBUG, LOG_LEVEL.INFO, LOG_LEVEL.WARN, LOG_LEVEL.ERROR] as const, {
    errorMap: (issue) => {
      if (issue.code === 'invalid_type') {
        return { message: 'LOG_LEVEL is required' };
      }
      if (issue.code === 'invalid_enum_value') {
        return {
          message: 'LOG_LEVEL must be one of: debug, info, warn, error',
        };
      }
      return { message: 'LOG_LEVEL is invalid' };
    },
  }),
  QUOTES_API_URL: z
    .string({
      required_error: 'QUOTES_API_URL is required',
    })
    .url({ message: 'QUOTES_API_URL must be a valid URL' }),
  ALLOWED_ORIGINS: z.string().default('*'),
  RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().int().positive()).default('100'),
  RATE_LIMIT_WINDOW: z.string().default('15 minutes'),
});

export const quoteIdParamsSchema = z.object({
  id: z.string().min(1, 'Quote ID is required'),
});

export const likeQuoteParamsSchema = z.object({
  id: z.string().min(1, 'Quote ID is required'),
});

export const similarQuotesParamsSchema = z.object({
  id: z.string().min(1, 'Quote ID is required'),
});

export const similarQuotesQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 5))
    .pipe(z.number().int().min(1).max(50)),
});

export const topQuotesQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 10))
    .pipe(z.number().int().min(1).max(100)),
});

export const mostViewedQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 10))
    .pipe(z.number().int().min(1).max(100)),
});

export type EnvSchema = z.infer<typeof envSchema>;
export type QuoteIdParams = z.infer<typeof quoteIdParamsSchema>;
export type LikeQuoteParams = z.infer<typeof likeQuoteParamsSchema>;
export type SimilarQuotesParams = z.infer<typeof similarQuotesParamsSchema>;
export type SimilarQuotesQuery = z.infer<typeof similarQuotesQuerySchema>;
export type TopQuotesQuery = z.infer<typeof topQuotesQuerySchema>;
export type MostViewedQuery = z.infer<typeof mostViewedQuerySchema>;
