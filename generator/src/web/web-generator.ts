import { rm } from 'fs/promises';
import path from 'path';
import { Project, SourceFile, SyntaxKind, VariableDeclarationKind } from 'ts-morph';

import { Config } from '../config.schemas';
import { Linter } from '../linter';
import { logger } from '../logger';
import { camelCase, kebabCase, pascalCase } from '../utils/string.utils';
import { ApiClientGenerator } from './api-client-generator';
import { ApiHooksGenerator } from './api-hooks-generator';
import { ApiTypesGenerator } from './api-types-generator';
import { ErrorComponentGenerator } from './error-component-generator';
import { FormComponentGenerator } from './form-component-generator';
import { SkeletonComponentGenerator } from './skeleton-component-generator';

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

    // Generate api types
    const apiTypesFile = tsProject.createSourceFile(
      path.join(modulesFolderPath, 'api', `${this.kebabCaseModel}.types.ts`)
    );
    const apiTypesGenerator = new ApiTypesGenerator(this.config);
    await apiTypesGenerator.generate(apiTypesFile);
    await apiTypesFile.save();

    // Generate api client
    const apiClientFile = tsProject.createSourceFile(
      path.join(modulesFolderPath, 'api', `${this.kebabCaseModel}.client.ts`)
    );
    const apiClientGenerator = new ApiClientGenerator(this.config);
    await apiClientGenerator.generate(apiClientFile);
    await apiClientFile.save();

    // Generate api hooks
    const apiHooksFile = tsProject.createSourceFile(
      path.join(modulesFolderPath, 'api', `${this.kebabCaseModel}.hooks.ts`)
    );
    const apiHooksGenerator = new ApiHooksGenerator(this.config);
    await apiHooksGenerator.generate(apiHooksFile);
    await apiHooksFile.save();

    // Generate form component
    const formComponentFile = tsProject.createSourceFile(
      path.join(modulesFolderPath, 'components', `${this.pascalCaseModel}Form.tsx`)
    );
    const formComponentGenerator = new FormComponentGenerator(this.config);
    await formComponentGenerator.generate(formComponentFile);
    await formComponentFile.save();

    // Generate error component
    const errorComponentFile = tsProject.createSourceFile(
      path.join(modulesFolderPath, 'components', `${this.pascalCaseModel}Error.tsx`)
    );
    const errorComponentGenerator = new ErrorComponentGenerator(this.config);
    await errorComponentGenerator.generate(errorComponentFile);
    await errorComponentFile.save();

    // Generate skeleton component
    const skeletonComponentFile = tsProject.createSourceFile(
      path.join(modulesFolderPath, 'components', `${this.pascalCaseModel}Skeleton.tsx`)
    );
    const skeletonComponentGenerator = new SkeletonComponentGenerator(this.config);
    await skeletonComponentGenerator.generate(skeletonComponentFile);
    await skeletonComponentFile.save();

    // Lint all files
    await linter.lintFiles([
      apiTypesFile.getFilePath(),
      apiClientFile.getFilePath(),
      apiHooksFile.getFilePath(),
      formComponentFile.getFilePath(),
      errorComponentFile.getFilePath(),
      skeletonComponentFile.getFilePath(),
    ]);

    logger.info('Finished generating web code!');
  }
}
