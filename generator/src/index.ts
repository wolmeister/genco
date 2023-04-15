import { existsSync } from 'fs';
import path from 'path';
import { program } from 'commander';

import { configSchema } from './config.schemas';
import { readFile } from 'fs/promises';
import { ApiGenerator } from './api/api-generator';

async function run() {
  // Parse the app params
  program
    .name('GenCo - Node/React code generator!')
    .requiredOption('-c, --configPath <string>', 'config file')
    .parse();

  const { configPath } = program.opts() as { configPath: string };

  // Validate and load the app params
  const realConfigPath = path.isAbsolute(configPath)
    ? configPath
    : path.join(process.cwd(), configPath);

  if (existsSync(realConfigPath) === false) {
    console.error(`Config file ${realConfigPath} does not exists`);
    return;
  }

  const rawConfigBuffer = await readFile(realConfigPath, 'utf-8');
  const rawConfig = JSON.parse(rawConfigBuffer.toString());
  const parsedConfig = configSchema.safeParse(rawConfig);
  if (parsedConfig.success === false) {
    // TODO - Format error
    console.error('Invalid config', parsedConfig.error);
    return;
  }

  // Start the generator
  const apiGenerator = new ApiGenerator(parsedConfig.data);
  await apiGenerator.generate();

  console.log('Done');
}

run();
