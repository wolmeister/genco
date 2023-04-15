import winston from 'winston';

const colorizer = winston.format.colorize();

export const logger = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.simple(),
        winston.format.printf(msg => {
          const level = colorizer.colorize(msg.level, msg.level.toUpperCase());
          return `[${level}] (${msg.timestamp}): ${msg.message}`;
        })
      ),
    }),
  ],
});
