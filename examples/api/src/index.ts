import { app } from './app';
import { logger } from './logger';

app.listen({ port: 8080 }, (err, address) => {
  if (err) {
    logger.error('Unexpected error while initializing the server', err);
    process.exit(1);
  }
  logger.info(`Server listening at ${address}`);
});
