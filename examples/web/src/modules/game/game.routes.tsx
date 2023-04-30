import React from 'react';
import { RouteObject } from 'react-router-dom';

import { EditGamePage } from './pages/EditGamePage';
import { GamePage } from './pages/GamePage';
import { GamesPage } from './pages/GamesPage';
import { NewGamePage } from './pages/NewGamePage';

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
    path: '/games/:id/edit',
    element: <EditGamePage />,
  },
];
