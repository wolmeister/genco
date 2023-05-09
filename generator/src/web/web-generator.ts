import { rm } from 'fs/promises';
import path from 'path';
import { Project, SourceFile, SyntaxKind } from 'ts-morph';

import { BaseGenerator } from '../common/base-generator';
import { Linter } from '../linter';
import { logger } from '../logger';
import { ApiClientGenerator } from './api-client-generator';
import { ApiHooksGenerator } from './api-hooks-generator';
import { ApiTypesGenerator } from './api-types-generator';
import { ErrorComponentGenerator } from './error-component-generator';
import { FormComponentGenerator } from './form-component-generator';
import { CreatePageGenerator } from './pages/create-page-generator';
import { SearchPageGenerator } from './pages/search-page-generator';
import { UpdatePageGenerator } from './pages/update-page-generator';
import { ViewPageGenerator } from './pages/view-page-generator';
import { RoutesGenerator } from './routes-generator';
import { SkeletonComponentGenerator } from './skeleton-component-generator';

export class WebGenerator extends BaseGenerator {
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
    const filesToLint: SourceFile[] = [];

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
    filesToLint.push(apiTypesFile);

    // Generate api client
    const apiClientFile = tsProject.createSourceFile(
      path.join(modulesFolderPath, 'api', `${this.kebabCaseModel}.client.ts`)
    );
    const apiClientGenerator = new ApiClientGenerator(this.config);
    await apiClientGenerator.generate(apiClientFile);
    await apiClientFile.save();
    filesToLint.push(apiClientFile);

    // Generate api hooks
    const apiHooksFile = tsProject.createSourceFile(
      path.join(modulesFolderPath, 'api', `${this.kebabCaseModel}.hooks.ts`)
    );
    const apiHooksGenerator = new ApiHooksGenerator(this.config);
    await apiHooksGenerator.generate(apiHooksFile);
    await apiHooksFile.save();
    filesToLint.push(apiHooksFile);

    // Generate form component
    const formComponentFile = tsProject.createSourceFile(
      path.join(modulesFolderPath, 'components', `${this.pascalCaseModel}Form.tsx`)
    );
    const formComponentGenerator = new FormComponentGenerator(this.config);
    await formComponentGenerator.generate(formComponentFile);
    await formComponentFile.save();
    filesToLint.push(formComponentFile);

    // Generate error component
    const errorComponentFile = tsProject.createSourceFile(
      path.join(modulesFolderPath, 'components', `${this.pascalCaseModel}Error.tsx`)
    );
    const errorComponentGenerator = new ErrorComponentGenerator(this.config);
    await errorComponentGenerator.generate(errorComponentFile);
    await errorComponentFile.save();
    filesToLint.push(errorComponentFile);

    // Generate skeleton component
    const skeletonComponentFile = tsProject.createSourceFile(
      path.join(modulesFolderPath, 'components', `${this.pascalCaseModel}Skeleton.tsx`)
    );
    const skeletonComponentGenerator = new SkeletonComponentGenerator(this.config);
    await skeletonComponentGenerator.generate(skeletonComponentFile);
    await skeletonComponentFile.save();
    filesToLint.push(skeletonComponentFile);

    // Generate search page
    if (this.config.operations.findMultiple) {
      const searchPageFile = tsProject.createSourceFile(
        path.join(modulesFolderPath, 'pages', `${this.pluralPascalCaseModel}Page.tsx`)
      );
      const searchPageGenerator = new SearchPageGenerator(this.config);
      await searchPageGenerator.generate(searchPageFile);
      await searchPageFile.save();
      filesToLint.push(searchPageFile);
    }

    // Generate view page
    if (this.config.operations.findById) {
      const viewPageFile = tsProject.createSourceFile(
        path.join(modulesFolderPath, 'pages', `${this.pascalCaseModel}Page.tsx`)
      );
      const viewPageGenerator = new ViewPageGenerator(this.config);
      await viewPageGenerator.generate(viewPageFile);
      await viewPageFile.save();
      filesToLint.push(viewPageFile);
    }

    // Generate create page
    if (this.config.operations.create) {
      const createPageFile = tsProject.createSourceFile(
        path.join(modulesFolderPath, 'pages', `Create${this.pascalCaseModel}Page.tsx`)
      );
      const createPageGenerator = new CreatePageGenerator(this.config);
      await createPageGenerator.generate(createPageFile);
      await createPageFile.save();
      filesToLint.push(createPageFile);
    }

    // Generate update page
    if (this.config.operations.update) {
      const updatePageFile = tsProject.createSourceFile(
        path.join(modulesFolderPath, 'pages', `Update${this.pascalCaseModel}Page.tsx`)
      );
      const updatePageGenerator = new UpdatePageGenerator(this.config);
      await updatePageGenerator.generate(updatePageFile);
      await updatePageFile.save();
      filesToLint.push(updatePageFile);
    }

    // Generate routes
    const routesFile = tsProject.createSourceFile(
      path.join(modulesFolderPath, `${this.kebabCaseModel}.routes.tsx`)
    );
    const routesGenerator = new RoutesGenerator(this.config);
    await routesGenerator.generate(routesFile);
    await routesFile.save();
    filesToLint.push(routesFile);

    // Register routes
    const routerPath = path.join(this.config.web.rootPath, this.config.web.routerFilePath);
    const routerFile = tsProject.getSourceFileOrThrow(routerPath);
    await this.registerRoutes(routerFile, modulesFolderPath);
    await routerFile.save();
    filesToLint.push(routerFile);

    // Lint all files
    await linter.lintFiles(filesToLint.map(f => f.getFilePath()));

    logger.info('Finished generating web code!');
  }

  private registerRoutes(file: SourceFile, modulesFolderPath: string): void {
    const routesName = `${this.camelCaseModel}Routes`;

    // Add import
    const routesRelativePath = `./${path.relative(
      path.dirname(file.getFilePath()),
      path.join(modulesFolderPath, `${this.kebabCaseModel}.routes`)
    )}`;
    let routesImport = file.getImportDeclaration(
      id => id.getModuleSpecifierValue() === routesRelativePath
    );
    if (!routesImport) {
      routesImport = file.addImportDeclaration({
        moduleSpecifier: routesRelativePath,
      });
    }

    const routesNamedImports = routesImport.getNamedImports().map(ni => ni.getName());
    if (!routesNamedImports.includes(routesName)) {
      routesImport.addNamedImport(routesName);
    }

    // Add routes to array
    const routerVariable = file.getVariableStatementOrThrow(this.config.web.routerVariableName);
    const routesArray = routerVariable.getFirstDescendantByKindOrThrow(
      SyntaxKind.ArrayLiteralExpression
    );

    const alreadyAdded = routesArray
      .getElements()
      .map(e => e.asKindOrThrow(SyntaxKind.SpreadElement))
      .find(routesSpreadElement => {
        const addedRouteName = routesSpreadElement
          .getFirstDescendantByKindOrThrow(SyntaxKind.Identifier)
          .getText();
        return addedRouteName === routesName;
      });

    if (!alreadyAdded) {
      routesArray.addElement(`...${routesName}`);
    }
  }
}
