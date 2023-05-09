import { Static, Type } from '@sinclair/typebox';
import { FastifyPluginAsync } from 'fastify';

import { signJwt } from './jwt';

const JwtRequestSchema = Type.Object({
  scope: Type.Array(Type.String()),
  subject: Type.String(),
});

type JwtRequest = Static<typeof JwtRequestSchema>;

const JwtResponseSchema = Type.Object({
  token: Type.String(),
});

type JwtResponse = Static<typeof JwtResponseSchema>;

/**
 * These routes should only be only used for testing..
 */
export const authRoutes: FastifyPluginAsync = async server => {
  server.post<{ Body: JwtRequest; Reply: JwtResponse }>(
    '/auth',
    {
      schema: {
        tags: ['Auth'],
        body: JwtRequestSchema,
        response: {
          200: JwtResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const token = signJwt({
        scope: request.body.scope,
        sub: request.body.subject,
      });
      return reply.status(200).send({ token });
    }
  );
};
