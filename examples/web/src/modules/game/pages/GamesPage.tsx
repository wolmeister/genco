import { Table } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useGames } from '../api/game.hooks';

export function GamesPage() {
  const navigate = useNavigate();
  const gamesQuery = useGames();

  return (
    <Table
      dataSource={gamesQuery.data?.edges.map(e => e.node)}
      loading={gamesQuery.isLoading}
      rowKey="id"
      onRow={game => ({
        onClick: () => {
          navigate(`/games/${game.id}`);
        },
      })}
    >
      <Table.Column title="Name" dataIndex="name" key="id" />
      <Table.Column title="Summary" dataIndex="summary" key="id" />
    </Table>
  );
}
