import { Static, Type } from '@sinclair/typebox';

import { DateType } from '../../common/typebox-types';

// Common
export const GameResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  summary: Type.Union([Type.Null(), Type.String()]),
  updatedAt: DateType(),
  createdAt: DateType(),
});

export type GameResponse = Static<typeof GameResponseSchema>;

// Find Games
export const FindGamesQuerySchema = Type.Object({
  ids: Type.Optional(Type.Array(Type.String())),
  after: Type.Optional(Type.String()),
  first: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
});

export type FindGamesQuery = Static<typeof FindGamesQuerySchema>;

export const FindGamesResponseSchema = Type.Object({
  edges: Type.Array(
    Type.Object({
      cursor: Type.String(),
      node: GameResponseSchema,
    })
  ),
  totalCount: Type.Integer(),
  pageInfo: Type.Object({
    hasNextPage: Type.Boolean(),
    hasPreviousPage: Type.Boolean(),
    startCursor: Type.Optional(Type.String()),
    endCursor: Type.Optional(Type.String()),
  }),
});

export type FindGamesResponse = Static<typeof FindGamesResponseSchema>;

// Find Game By Id
export const FindGameParamsSchema = Type.Object({
  id: Type.String(),
});

export type FindGameParams = Static<typeof FindGameParamsSchema>;

// Create Game
export const CreateGameSchema = Type.Object({
  name: Type.String(),
  summary: Type.Optional(Type.String()),
});

export type CreateGame = Static<typeof CreateGameSchema>;

// Update Game
export const UpdateGameSchema = Type.Object({
  name: Type.String(),
  summary: Type.Optional(Type.String()),
});

export type UpdateGame = Static<typeof UpdateGameSchema>;

export const UpdateGameParamsSchema = Type.Object({
  id: Type.String(),
});

export type UpdateGameParams = Static<typeof UpdateGameParamsSchema>;

// Delete Game
export const DeleteGameParamsSchema = Type.Object({
  id: Type.String(),
});

export type DeleteGameParams = Static<typeof DeleteGameParamsSchema>;
