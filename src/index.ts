import compress from '@fastify/compress';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import { default as mercurius } from 'mercurius';

import { config } from './config';
import { Context, resolvers } from './graphql/resolvers';
import { schema } from './graphql/schema';
import { HealthCheck } from './health/health-check';
import { errorHandler } from './middleware';
import { QuoteRepository } from './repositories/quote.repository';
import { quotesRoutes } from './routes/quotes.routes';
import { ExternalQuotesService } from './services/external-quotes.service';
import { QuoteRankingService } from './services/quote-ranking.service';
import { QuoteService } from './services/quote.service';
import { logger } from './utils/logger';

async function buildServer() {
  const fastify = Fastify({
    logger:
      config.nodeEnv === 'test'
        ? false
        : {
            level: config.logLevel,
            transport:
              config.nodeEnv === 'development'
                ? {
                    target: 'pino-pretty',
                    options: {
                      translateTime: 'HH:MM:ss Z',
                      ignore: 'pid,hostname',
                    },
                  }
                : undefined,
          },
    genReqId: (req) => req.headers['x-request-id']?.toString() || crypto.randomUUID(),
    requestIdHeader: 'x-request-id',
  });

  fastify.setErrorHandler(errorHandler);

  const quoteRepository = new QuoteRepository();
  const externalQuotesService = new ExternalQuotesService();
  const quoteRankingService = new QuoteRankingService();
  const quoteService = new QuoteService(
    quoteRepository,
    externalQuotesService,
    quoteRankingService
  );
  const healthCheck = new HealthCheck(externalQuotesService, quoteRepository);

  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    global: true,
  });

  await fastify.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindow,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    }),
  });

  await fastify.register(compress, {
    global: true,
    threshold: 1024,
  });

  const allowedOrigins = config.allowedOrigins.split(',').map((o) => o.trim());
  await fastify.register(cors, {
    origin: allowedOrigins.includes('*') ? true : allowedOrigins,
    credentials: true,
  });

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Quotes Service API',
        description: 'Production-ready quote service with REST and GraphQL APIs',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://${config.host}:${config.port}`,
          description: 'Development server',
        },
      ],
      tags: [{ name: 'quotes', description: 'Quote management endpoints' }],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  await fastify.register(mercurius as any, {
    schema,
    resolvers,
    graphiql: config.nodeEnv === 'development',
    context: (): Context =>
      ({
        quoteService,
      }) as Context,
  });

  logger.info('Registering REST routes');
  quotesRoutes(fastify, quoteService);
  logger.info('REST routes registered');

  fastify.get('/health', async () => {
    return await healthCheck.check();
  });

  fastify.get('/health/live', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  fastify.get('/health/ready', async () => {
    const result = await healthCheck.check();
    if (result.status === 'unhealthy') {
      const error = new Error('Service unavailable');
      (error as { statusCode?: number }).statusCode = 503;
      throw error;
    }
    return { status: 'ready', timestamp: new Date().toISOString() };
  });

  fastify.get('/', () => ({
    name: 'Quotes Service API',
    version: '1.0.0',
    endpoints: {
      rest: {
        randomQuote: 'GET /api/quotes/random',
        getQuote: 'GET /api/quotes/:id',
        likeQuote: 'POST /api/quotes/:id/like',
        similarQuotes: 'GET /api/quotes/:id/similar',
        topRated: 'GET /api/quotes/top-rated',
        mostViewed: 'GET /api/quotes/most-viewed',
        allQuotes: 'GET /api/quotes',
      },
      documentation: '/docs',
      graphql: config.nodeEnv === 'development' ? '/graphiql' : '/graphql',
      health: '/health',
    },
  }));

  return fastify;
}

async function start() {
  let fastify: Awaited<ReturnType<typeof buildServer>> | undefined;
  try {
    fastify = await buildServer();

    await fastify.listen({
      port: config.port,
      host: config.host,
    });

    logger.info('Server started successfully');
    logger.info(`Server: http://${config.host}:${config.port}`);
    logger.info(`Swagger: http://${config.host}:${config.port}/docs`);
    logger.info(`GraphQL: http://${config.host}:${config.port}/graphql`);
    if (config.nodeEnv === 'development') {
      logger.info(`GraphiQL: http://${config.host}:${config.port}/graphiql`);
    }
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`External API: ${config.quotesApiUrl}`);
    logger.debug('\nAvailable routes:\n' + fastify.printRoutes());

    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      if (!fastify) {
        process.exit(0);
        return;
      }

      fastify
        .close()
        .then(() => {
          logger.info('Server closed successfully');
          process.exit(0);
        })
        .catch((err) => {
          logger.error('Error during shutdown', err);
          process.exit(1);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

if (require.main === module) {
  void start();
}

export { buildServer };
