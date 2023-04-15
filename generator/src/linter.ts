import { ESLint } from 'eslint';

import { Config } from './config.schemas';
import { logger } from './logger';

export class Linter {
  constructor(private config: Config) {}

  async lintFiles(files: string[]): Promise<void> {
    logger.info(`Initializing eslint`);

    const eslint = new ESLint({
      fix: true,
      useEslintrc: true,
      cwd: this.config.api.rootPath,
    });

    logger.info('Linting files', files);
    const results = await eslint.lintFiles(files);
    ESLint.outputFixes(results);
    logger.info('Done linting files', files);
  }
}
