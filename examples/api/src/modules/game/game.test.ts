import { Game } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { app } from '../../app';
import { prismaMock } from '../../testing';

const gameMock: Game = {
  id: 'id',
  name: 'name',
  summary: 'summary',
  createdAt: new Date(1684638833074),
  updatedAt: new Date(1684638833074),
};
const serializedGameMock = {
  ...gameMock,
  createdAt: gameMock.createdAt.toISOString(),
  updatedAt: gameMock.updatedAt.toISOString(),
};

describe('Game API (/games)', () => {
  describe('GET /games', () => {
    describe('200', () => {
      it('should return a page of games', () => {});
    });

    describe('400', () => {
      it('should fail if the request query is invalid', () => {});
    });

    // describe('401', () => {
    //   it('should fail if the user is not authenticated', () => {});
    // });

    // describe('403', () => {
    //   it('should fail if the user does not have permission', () => {});
    // });
  });

  describe('GET /games/:id', () => {
    describe('200', () => {
      it('should return the game', async () => {
        prismaMock.game.findUniqueOrThrow.mockResolvedValue(gameMock);

        const response = await app.inject({
          method: 'GET',
          url: `/games/${gameMock.id}`,
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toStrictEqual(serializedGameMock);
      });
    });

    describe('404', () => {
      it('should fail if the game does not exists', async () => {
        const notFoundError = new Error();
        notFoundError.name = 'NotFoundError';
        prismaMock.game.findUniqueOrThrow.mockRejectedValue(notFoundError);

        const response = await app.inject({
          method: 'GET',
          url: `/games/${gameMock.id}`,
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toStrictEqual({
          code: 'GAME_NOT_FOUND',
          statusCode: 404,
          message: 'Game not found',
          error: 'Not Found',
        });
      });
    });
  });

  describe('POST /games', () => {
    describe('201', () => {
      it('should create and return the game', async () => {
        prismaMock.game.create.mockResolvedValue(gameMock);

        const response = await app.inject({
          method: 'POST',
          url: '/games',
          payload: {
            name: gameMock.name,
            summary: gameMock.summary,
          },
        });

        expect(response.statusCode).toBe(201);
        expect(response.json()).toStrictEqual(serializedGameMock);
      });
    });

    describe('400', () => {
      it('should fail if the request body is invalid', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/games',
          payload: {},
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toStrictEqual({
          error: 'Bad Request',
          statusCode: 400,
          message: "body must have required property 'name'",
        });
      });

      it('should fail if the name is not unique', async () => {
        prismaMock.game.create.mockRejectedValue(
          new PrismaClientKnownRequestError('Error', {
            clientVersion: 'testing',
            code: 'P2002',
            meta: {
              target: 'name',
            },
          })
        );

        const response = await app.inject({
          method: 'POST',
          url: '/games',
          payload: {
            name: gameMock.name,
            summary: gameMock.summary,
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toStrictEqual({
          code: 'GAME_NAME_NOT_UNIQUE',
          statusCode: 400,
          message: 'Game name is not unique',
          error: 'Bad Request',
        });
      });
    });
  });

  describe('PATCH /games/:id', () => {
    describe('200', () => {
      it('should update and return the game', () => {});
    });

    describe('400', () => {
      it('should fail if the request body is invalid', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: `/games/${gameMock.id}`,
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toStrictEqual({
          error: 'Bad Request',
          statusCode: 400,
          message: 'body must be object',
        });
      });

      it('should fail if the name is not unique', async () => {
        prismaMock.game.update.mockRejectedValue(
          new PrismaClientKnownRequestError('Error', {
            clientVersion: 'testing',
            code: 'P2002',
            meta: {
              target: 'name',
            },
          })
        );

        const response = await app.inject({
          method: 'PATCH',
          url: `/games/${gameMock.id}`,
          payload: {
            name: gameMock.name,
            summary: gameMock.summary,
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toStrictEqual({
          code: 'GAME_NAME_NOT_UNIQUE',
          statusCode: 400,
          message: 'Game name is not unique',
          error: 'Bad Request',
        });
      });
    });

    describe('404', () => {
      it('should fail if the game does not exists', async () => {
        prismaMock.game.update.mockRejectedValue(
          new PrismaClientKnownRequestError('Error', {
            clientVersion: 'testing',
            code: 'P2025',
          })
        );

        const response = await app.inject({
          method: 'PATCH',
          url: `/games/${gameMock.id}`,
          payload: {
            name: gameMock.name,
            summary: gameMock.summary,
          },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toStrictEqual({
          code: 'GAME_NOT_FOUND',
          statusCode: 404,
          message: 'Game not found',
          error: 'Not Found',
        });
      });
    });
  });

  describe('DELETE /games/:id', () => {
    describe('200', () => {
      it('should delete and return the game', () => {});
    });

    describe('404', () => {
      it('should fail if the game does not exists', () => {});
    });
  });
});
