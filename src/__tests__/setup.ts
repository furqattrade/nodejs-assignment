import { beforeAll } from 'vitest';

beforeAll(() => {
  // Set required environment variables for tests
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3000';
  process.env.HOST = '0.0.0.0';
  process.env.LOG_LEVEL = 'error';
  process.env.QUOTES_API_URL = 'https://api.quotable.io/quotes';
  process.env.ALLOWED_ORIGINS = '*';
  process.env.RATE_LIMIT_MAX = '100';
  process.env.RATE_LIMIT_WINDOW = '60000';
});
