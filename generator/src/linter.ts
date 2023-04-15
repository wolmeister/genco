// import { ESLint } from 'eslint';
// import { readFile } from 'fs/promises';
// import { parse as parseJson } from 'jsonc-parser';
import path from 'path';

import { Config } from './config.schemas';
import { logger } from './logger';

export class Linter {
  constructor(private config: Config) {}

  async lintFiles(files: string[]): Promise<void> {
    const eslintrcPath = path.join(this.config.api.rootPath, '.eslintrc');
    // const eslintrcText = await readFile(eslintrcPath, 'utf-8');
    // const eslintrc = parseJson(eslintrcText);

    logger.info(`Initializing eslint with config ${eslintrcPath}`);

    // const eslint = new ESLint({
    //   fix: true,
    //   useEslintrc: false,
    //   baseConfig: eslintrc,
    // });

    logger.info('Linting files', files);
  }
}
