import { useMutation, useQuery, useQueryClient } from 'react-query';

import { createGame, deleteGame, findGame, findGames, updateGame } from './game.client';
import { FindGamesFilter, Game, PaginatedGame } from './game.types';

export function useGames(filter?: FindGamesFilter) {
  return useQuery<PaginatedGame>(['games', filter], () => findGames(filter));
}

export function useGame(id: string) {
  return useQuery<Game>(['games', id], () => findGame(id));
}

export function useCreateGameMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
}

export function useUpdateGameMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGame,
    onSuccess: game => {
      queryClient.invalidateQueries({ queryKey: ['games', game.id] });
    },
  });
}

export function useDeleteGameMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGame,
    onSuccess: game => {
      queryClient.invalidateQueries({ queryKey: ['games', game.id] });
    },
  });
}
