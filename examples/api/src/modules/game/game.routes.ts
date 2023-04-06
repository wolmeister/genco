import { FastifyPluginAsync } from 'fastify';

import {
  CreateGame,
  CreateGameSchema,
  DeleteGameParams,
  DeleteGameParamsSchema,
  FindGameParams,
  FindGameParamsSchema,
  FindGamesQuery,
  FindGamesQuerySchema,
  FindGamesResponse,
  FindGamesResponseSchema,
  GameResponse,
  GameResponseSchema,
  UpdateGame,
  UpdateGameParams,
  UpdateGameParamsSchema,
  UpdateGameSchema,
} from './game.schemas';
import { GameService } from './game.service';

export const gameRoutes: FastifyPluginAsync = async server => {
  server.get<{ Querystring: FindGamesQuery; Reply: FindGamesResponse }>(
    '/games',
    {
      schema: {
        tags: ['Games'],
        querystring: FindGamesQuerySchema,
        response: {
          200: FindGamesResponseSchema,
          // @TODO: Add errors to validations
        },
      },
    },
    async (request, reply) => {
      const games = await GameService.findGames(request.query);
      return reply.status(200).send(games);
    }
  );

  server.get<{ Reply: GameResponse; Params: FindGameParams }>(
    '/games/:id',
    {
      schema: {
        tags: ['Games'],
        params: FindGameParamsSchema,
        response: {
          200: GameResponseSchema,
          // @TODO: Add errors to 404 and validation
        },
      },
    },
    async (request, reply) => {
      const game = await GameService.findGameById(request.params.id);
      return reply.status(200).send(game);
    }
  );

  server.post<{ Body: CreateGame; Reply: GameResponse }>(
    '/games',
    {
      schema: {
        tags: ['Games'],
        body: CreateGameSchema,
        response: {
          201: GameResponseSchema,
          // @TODO: Add errors to validations
        },
      },
    },
    async (request, reply) => {
      const game = await GameService.createGame(request.body);
      return reply.status(201).send(game);
    }
  );

  server.patch<{
    Body: UpdateGame;
    Reply: GameResponse;
    Params: UpdateGameParams;
  }>(
    '/games/:id',
    {
      schema: {
        tags: ['Games'],
        body: UpdateGameSchema,
        params: UpdateGameParamsSchema,
        response: {
          200: GameResponseSchema,
          // @TODO: Add errors to validations
        },
      },
    },
    async (request, reply) => {
      const game = await GameService.updateGame(
        request.params.id,
        request.body
      );
      return reply.status(200).send(game);
    }
  );

  server.delete<{ Reply: GameResponse; Params: DeleteGameParams }>(
    '/games/:id',
    {
      schema: {
        tags: ['Games'],
        params: DeleteGameParamsSchema,
        response: {
          200: GameResponseSchema,
          // @TODO: Add errors to validations
        },
      },
    },
    async (request, reply) => {
      const game = await GameService.deleteGame(request.params.id);
      return reply.status(200).send(game);
    }
  );
};
