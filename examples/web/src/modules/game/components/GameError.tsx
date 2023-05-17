import { Button, Result } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { isApiError } from '../../common/api/api.errors';

export type GameErrorProps = {
  error: unknown;
};

export function GameError({ error }: GameErrorProps) {
  const navigate = useNavigate();

  if (isApiError(error) && error.json.code === 'GAME_NOT_FOUND') {
    return (
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Button type="primary" onClick={() => navigate('/games')}>
            Back Home
          </Button>
        }
      />
    );
  }
  return (
    <Result
      status="500"
      title="500"
      subTitle="Sorry, a unknown error happened."
      extra={
        <Button type="primary" onClick={() => navigate('/games')}>
          Back Home
        </Button>
      }
    />
  );
}
