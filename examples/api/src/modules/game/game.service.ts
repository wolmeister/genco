import { Connection, Edge, findManyCursorConnection } from '@devoxa/prisma-relay-cursor-connection';
import { Game } from '@prisma/client';

import { prisma } from '../../prisma';
import {
  formatCreateUpdateGameError,
  formatDeleteGameError,
  formatFindGameError,
} from './game.errors';
import { CreateGame, FindGamesQuery, UpdateGame } from './game.schemas';

interface GameService {
  findGames(query: FindGamesQuery): Promise<Connection<Game, Edge<Game>>>;
  findGameById(id: Game['id']): Promise<Game>;
  createGame(data: CreateGame): Promise<Game>;
  updateGame(id: Game['id'], data: UpdateGame): Promise<Game>;
  deleteGame(id: Game['id']): Promise<Game>;
}

class GameServiceImpl implements GameService {
  private readonly MINIO_BUCKET = 'games';

  findGames(query: FindGamesQuery): Promise<Connection<Game, Edge<Game>>> {
    return findManyCursorConnection(
      args => prisma.game.findMany({ ...args, where: { id: { in: query.ids } } }),
      () => prisma.game.count({ where: { id: { in: query.ids } } }),
      query
    );
  }

  async findGameById(id: Game['id']): Promise<Game> {
    try {
      const game = await prisma.game.findUniqueOrThrow({
        where: { id },
      });
      return game;
    } catch (error) {
      throw formatFindGameError(error);
    }
  }

  async createGame(data: CreateGame): Promise<Game> {
    try {
      const game = await prisma.game.create({ data });
      return game;
    } catch (error) {
      throw formatCreateUpdateGameError(error);
    }
  }

  async updateGame(id: Game['id'], data: UpdateGame): Promise<Game> {
    try {
      const game = await prisma.game.update({
        where: {
          id,
        },
        data,
      });

      return game;
    } catch (error) {
      throw formatCreateUpdateGameError(error);
    }
  }

  async deleteGame(id: Game['id']): Promise<Game> {
    try {
      const game = await prisma.game.delete({
        where: {
          id,
        },
      });
      return game;
    } catch (error) {
      throw formatDeleteGameError(error);
    }
  }
}

export const GameService = new GameServiceImpl();
