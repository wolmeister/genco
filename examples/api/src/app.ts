import fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { gameRoutes } from './modules/game';

const app = fastify();

app.register(swagger, {
  openapi: {
    info: {
      title: 'Bigorna API',
      version: '0.0.1',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      // { name: 'Auth', description: 'Auth related end-points' },
      { name: 'Game', description: 'Game related end-points' },
    ],
  },
});

app.register(swaggerUi, {
  routePrefix: '/docs',
});

app.register(gameRoutes);

export { app };
