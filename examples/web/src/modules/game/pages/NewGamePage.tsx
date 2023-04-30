import { FormInstance, message } from 'antd';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { isApiError } from '../../common/api/api.errors';
import { useCreateGameMutation } from '../api/game.hooks';
import { GameForm, GameFormValues } from '../components/GameForm';

export function NewGamePage() {
  const navigate = useNavigate();
  const createGameMutation = useCreateGameMutation();

  const handleSubmit = useCallback(
    async (data: GameFormValues, form: FormInstance<GameFormValues>) => {
      try {
        const game = await createGameMutation.mutateAsync(data);
        message.success('Game created successfully!');
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
    [createGameMutation, navigate]
  );

  return <GameForm onSubmit={handleSubmit} />;
}
