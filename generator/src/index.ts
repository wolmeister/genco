import { program } from 'commander';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { parse as parseJson } from 'jsonc-parser';
import path from 'path';

import { ApiGenerator } from './api/api-generator';
import { configSchema } from './config.schemas';
import { logger } from './logger';

async function run() {
  // Parse the app params
  program
    .name('GenCo - Node/React code generator!')
    .requiredOption('-c, --configPath <string>', 'config file')
    .parse();

  const { configPath } = program.opts() as { configPath: string };
  logger.info(`Running generator with config ${configPath}`);

  // Validate and load the app params
  const realConfigPath = path.isAbsolute(configPath)
    ? configPath
    : path.join(process.cwd(), configPath);

  if (existsSync(realConfigPath) === false) {
    logger.error(`Config file ${realConfigPath} does not exists`);
    return;
  }

  const rawConfigText = await readFile(realConfigPath, 'utf-8');
  const rawConfig = parseJson(rawConfigText);
  const parsedConfig = configSchema.safeParse(rawConfig);
  if (parsedConfig.success === false) {
    // TODO - Format error
    logger.error('Invalid config', parsedConfig.error);
    return;
  }

  // Start the generator
  const apiGenerator = new ApiGenerator(parsedConfig.data);
  await apiGenerator.generate();

  logger.info('Done!');
}

run();
