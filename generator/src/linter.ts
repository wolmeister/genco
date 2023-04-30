import { ESLint } from 'eslint';

import { logger } from './logger';

export class Linter {
  constructor(private rootPath: string) {}

  async lintFiles(files: string[]): Promise<void> {
    logger.info(`Initializing eslint`);

    const eslint = new ESLint({
      fix: true,
      useEslintrc: true,
      cwd: this.rootPath,
    });

    logger.info('Linting files', files);
    const results = await eslint.lintFiles(files);
    ESLint.outputFixes(results);
    logger.info('Done linting files', files);
  }
}
