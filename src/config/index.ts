import { z } from 'zod';

import 'dotenv/config';
import { AppConfig } from '@app-types';
import { NODE_ENV } from '@constants';
import { envSchema } from '@schemas';

function validateEnv(): AppConfig {
  try {
    const env = process.env as Record<string, string | undefined>;

    const parsed = envSchema.parse({
      PORT: env.PORT,
      HOST: env.HOST,
      NODE_ENV: env.NODE_ENV,
      LOG_LEVEL: env.LOG_LEVEL,
      QUOTES_API_URL: env.QUOTES_API_URL,
      ALLOWED_ORIGINS: env.ALLOWED_ORIGINS,
      RATE_LIMIT_MAX: env.RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW: env.RATE_LIMIT_WINDOW,
    });

    return {
      port: parsed.PORT,
      host: parsed.HOST,
      nodeEnv: parsed.NODE_ENV,
      logLevel: parsed.LOG_LEVEL,
      quotesApiUrl: parsed.QUOTES_API_URL,
      allowedOrigins: parsed.ALLOWED_ORIGINS,
      rateLimitMax: parsed.RATE_LIMIT_MAX,
      rateLimitWindow: parsed.RATE_LIMIT_WINDOW,
    };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export const config = validateEnv();
export const isDevelopment = config.nodeEnv === NODE_ENV.DEVELOPMENT;
export const isProduction = config.nodeEnv === NODE_ENV.PRODUCTION;
export const isTest = config.nodeEnv === NODE_ENV.TEST;
