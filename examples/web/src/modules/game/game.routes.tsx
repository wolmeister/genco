import React from 'react';
import { RouteObject } from 'react-router-dom';

import { GamePage } from './pages/GamePage';
import { GamesPage } from './pages/GamesPage';
import { NewGamePage } from './pages/NewGamePage';
import { UpdateGamePage } from './pages/UpdateGamePage';

export const gameRoutes: RouteObject[] = [
  {
    path: '/games',
    element: <GamesPage />,
  },
  {
    path: '/new-game',
    element: <NewGamePage />,
  },
  {
    path: '/games/:id',
    element: <GamePage />,
  },
  {
    path: '/games/:id/update',
    element: <UpdateGamePage />,
  },
];
