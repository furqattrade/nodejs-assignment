import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

import { isDevelopment } from '@config';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export async function errorHandler(
  error: FastifyError | CustomError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const requestId = request.headers['x-request-id'] as string;

  request.log.error({
    requestId,
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
    },
    request: {
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query,
    },
  });

  const statusCode = error.statusCode || 500;

  const message = !isDevelopment && statusCode === 500 ? 'Internal Server Error' : error.message;

  await reply.code(statusCode).send({
    statusCode,
    error: error.name || 'Error',
    message,
    requestId,
    ...(isDevelopment && { stack: error.stack }),
  });
}
