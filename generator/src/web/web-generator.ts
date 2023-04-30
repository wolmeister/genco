import { rm } from 'fs/promises';
import path from 'path';
import { Project, SourceFile, SyntaxKind, VariableDeclarationKind } from 'ts-morph';

import { Config } from '../config.schemas';
import { Linter } from '../linter';
import { logger } from '../logger';
import { camelCase, kebabCase, pascalCase } from '../utils/string.utils';

export class WebGenerator {
  private readonly kebabCaseModel: string;
  private readonly pascalCaseModel: string;
  private readonly camelCaseModel: string;

  constructor(private config: Config) {
    this.kebabCaseModel = kebabCase(this.config.model);
    this.pascalCaseModel = pascalCase(this.config.model);
    this.camelCaseModel = camelCase(this.config.model);
  }

  async generate(): Promise<void> {
    logger.info('Generating web code...');

    const modulesFolderPath = path.join(
      this.config.web.rootPath,
      this.config.web.modulesFolderPath,
      this.kebabCaseModel
    );

    // Delete existing module
    if (this.config.overwrite) {
      await rm(modulesFolderPath, { force: true, recursive: true });
    }

    // Initialize eslint
    const linter = new Linter(this.config.web.rootPath);

    // Initialize ts project
    const tsProject = new Project({
      tsConfigFilePath: path.join(this.config.web.rootPath, this.config.web.tsconfigFilePath),
    });

    // Lint all files
    await linter.lintFiles([]);

    logger.info('Finished generating web code!');
  }
}
