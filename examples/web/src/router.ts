import { createBrowserRouter } from 'react-router-dom';

import { gameRoutes } from './modules/game/game.routes';

export const router = createBrowserRouter([...gameRoutes]);
