import { apiClient } from '../../common/api/api.client';
import { CreateGameData, FindGamesFilter, Game, PaginatedGame, UpdateGameData } from './game.types';

export function findGames(filter?: FindGamesFilter): Promise<PaginatedGame> {
  return apiClient
    .query(filter ?? {})
    .url('/games')
    .get()
    .json<PaginatedGame>();
}

export function findGame(id: string): Promise<Game | null> {
  return apiClient
    .url(`/games/${id}`)
    .get()
    .notFound(() => null)
    .json<Game>();
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
