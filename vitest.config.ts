import path from 'path';

import { defineConfig } from 'vitest/config';

// Set environment variables before any module imports
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.HOST = '0.0.0.0';
process.env.LOG_LEVEL = 'error';
process.env.QUOTES_API_URL = 'https://api.quotable.io/quotes';
process.env.ALLOWED_ORIGINS = '*';
process.env.RATE_LIMIT_MAX = '100';
process.env.RATE_LIMIT_WINDOW = '60000';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/types/**'],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@config': path.resolve(__dirname, './src/config/index'),
      '@constants': path.resolve(__dirname, './src/constants/index'),
      '@app-types': path.resolve(__dirname, './src/types/index'),
      '@schemas': path.resolve(__dirname, './src/schemas/index'),
      '@services': path.resolve(__dirname, './src/services'),
      '@repositories': path.resolve(__dirname, './src/repositories'),
      '@routes': path.resolve(__dirname, './src/routes'),
      '@graphql': path.resolve(__dirname, './src/graphql'),
      '@utils': path.resolve(__dirname, './src/utils/index'),
    },
  },
});
