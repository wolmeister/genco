import { apiClient } from '../../common/api/api.client';
import { withQuery } from '../../common/api/api.utils';
import { CreateGameData, FindGamesFilter, Game, PaginatedGame, UpdateGameData } from './game.types';

export function findGames(filter?: FindGamesFilter): Promise<PaginatedGame> {
  return apiClient.url(withQuery('/games', filter)).get().json<PaginatedGame>();
}

export function findGame(id: string): Promise<Game> {
  return apiClient.url(`/games/${id}`).get().json<Game>();
}

export function createGame(data: CreateGameData): Promise<Game> {
  return apiClient.url('/games').post(data).json<Game>();
}

export function updateGame([id, data]: [string, UpdateGameData]): Promise<Game> {
  return apiClient.url(`/games/${id}`).patch(data).json<Game>();
}

export function deleteGame(id: string): Promise<Game> {
  return apiClient.url(`/games/${id}`).delete().json<Game>();
}
