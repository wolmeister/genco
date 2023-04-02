import fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

// import { authRoutes } from './modules/auth';

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
    ],
  },
});

app.register(swaggerUi, {
  routePrefix: '/docs',
});

// app.register(authRoutes);

export { app };
