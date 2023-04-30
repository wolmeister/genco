import { Paginated } from '../../common/api/common.types';

// Common
export type Game = {
  id: string;
  name: string;
  summary: string | null;
  updatedAt: string;
  createdAt: string;
};

// Find Games
export type FindGamesFilter = {
  ids?: string[];
  after?: string;
  first?: number;
};

export type PaginatedGame = Paginated<Game>;

// Create Game
export type CreateGameData = {
  name: string;
  summary?: string | null;
};

// Update Game
export type UpdateGameData = {
  name: string;
  summary?: string | null;
};
