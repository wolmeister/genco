import createError, { FastifyError } from '@fastify/error';
import { isPrismaError } from '../../common/prisma-error';

import { logger } from '../../logger';

const UnexpectedGameError = createError(
  'UNEXPECTED_GAME_ERROR',
  'Unexpected game error',
  500
);
const GameNotFoundError = createError('GAME_NOT_FOUND', 'Game not found', 404);
const GameNameNotUniqueError = createError(
  'GAME_NAME_NOT_UNIQUE',
  'Game name is not unique',
  400
);

export function formatFindGameError(error: unknown): FastifyError {
  if (error instanceof Error) {
    if (error.name === 'NotFoundError') {
      return new GameNotFoundError();
    }
  }

  logger.error('Unexpected error while finding game', error);
  return new UnexpectedGameError();
}

export function formatCreateUpdateGameError(error: unknown): FastifyError {
  if (isPrismaError(error)) {
    // No game found in update
    if (error.code === 'P2025') {
      return new GameNotFoundError();
    }
    // Constraint violation
    if (error.code === 'P2002') {
      const meta = error.meta as { target?: string[] };

      if (meta.target?.includes('name')) {
        return new GameNameNotUniqueError();
      }
    }
  }

  logger.error('Unexpected error while creating/updating game', error);
  return new UnexpectedGameError();
}

export function formatDeleteGameError(error: unknown): FastifyError {
  if (isPrismaError(error)) {
    // No addon found in update
    if (error.code === 'P2025') {
      return new GameNotFoundError();
    }
  }
  logger.error('Unexpected error while finding game', error);
  return new UnexpectedGameError();
}
