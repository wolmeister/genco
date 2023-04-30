import { Button, message, Modal } from 'antd';
import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { isApiError } from '../../common/api/api.errors';
import { useDeleteGameMutation, useGame } from '../api/game.hooks';
import { GameError } from '../components/GameError';
import { GameForm } from '../components/GameForm';
import { GameSkeleton } from '../components/GameSkeleton';

export function GamePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const gameQuery = useGame(id ?? '');
  const deleteGameMutation = useDeleteGameMutation();

  const handleEdit = useCallback(() => {
    navigate(`/games/${id}/edit`);
  }, [id, navigate]);

  const handleDelete = useCallback(() => {
    Modal.confirm({
      title: 'Do you want to delete this game?',
      content: 'This action is destructive and cannot be reverted.',
      onOk: async () => {
        if (!id) {
          throw new Error('Game id not provided');
        }

        try {
          await deleteGameMutation.mutateAsync(id);
          navigate('/games');
          message.success('Game deleted successfully!');
        } catch (error) {
          if (isApiError(error) && error.json.code === 'GAME_NOT_FOUND') {
            message.error('Game already deleted');
          } else {
            message.error('An unknown error occurred');
          }
        }
      },
    });
  }, [deleteGameMutation, id, navigate]);

  if (gameQuery.isLoading || gameQuery.isIdle) {
    return <GameSkeleton />;
  }

  if (gameQuery.isError) {
    return <GameError error={gameQuery.error} />;
  }

  return (
    <div>
      <GameForm initialValue={gameQuery.data} disabled />
      <Button type="primary" onClick={handleEdit}>
        Edit
      </Button>
      <Button type="dashed" danger onClick={handleDelete}>
        Delete
      </Button>
    </div>
  );
}
