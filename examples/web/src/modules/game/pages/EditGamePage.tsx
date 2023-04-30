import { FormInstance, message } from 'antd';
import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { isApiError } from '../../common/api/api.errors';
import { useGame, useUpdateGameMutation } from '../api/game.hooks';
import { GameError } from '../components/GameError';
import { GameForm, GameFormValues } from '../components/GameForm';
import { GameSkeleton } from '../components/GameSkeleton';

export function EditGamePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const gameQuery = useGame(id ?? '');
  const updateGameMutation = useUpdateGameMutation();

  const handleSubmit = useCallback(
    async (data: GameFormValues, form: FormInstance<GameFormValues>) => {
      if (!id) {
        throw new Error('Game id not provided');
      }

      try {
        const game = await updateGameMutation.mutateAsync([id, data]);
        message.success('Game edited successfully!');
        navigate(`/games/${game.id}`);
      } catch (error) {
        if (isApiError(error) && error.json.code === 'GAME_NAME_NOT_UNIQUE') {
          form.setFields([
            {
              name: 'name',
              errors: ['A game with this name already exists'],
            },
          ]);
        } else {
          message.error('An unknown error occurred');
        }
      }
    },
    [id, updateGameMutation, navigate]
  );

  if (gameQuery.isLoading || gameQuery.isIdle) {
    return <GameSkeleton />;
  }

  if (gameQuery.isError) {
    return <GameError error={gameQuery.error} />;
  }

  return <GameForm initialValue={gameQuery.data} onSubmit={handleSubmit} />;
}
