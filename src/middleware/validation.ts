import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodSchema } from 'zod';

export function validateParams(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      request.params = await schema.parseAsync(request.params);
    } catch (error) {
      await reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid parameters',
        details: error,
      });
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      request.query = await schema.parseAsync(request.query);
    } catch (error) {
      await reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid query parameters',
        details: error,
      });
    }
  };
}

export function validateBody(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      request.body = await schema.parseAsync(request.body);
    } catch (error) {
      await reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid request body',
        details: error,
      });
    }
  };
}
