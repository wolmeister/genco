import path from 'path';
import { Config } from '../config.schemas';
import { rm } from 'fs/promises';
import { Project, SourceFile, VariableDeclarationKind } from 'ts-morph';
import { RoutesGenerator } from './routes-generator';
import { camelCase, kebabCase, pascalCase } from '../utils/string.utils';
import { SchemasGenerator } from './schemas-generator';
import { ServiceGenerator } from './service-generator';
import { ErrorsGenerator } from './errors-generator';
import { SyntaxKind } from 'ts-morph';
import { PrismaGenerator } from './prisma-generator';

export class ApiGenerator {
  private readonly kebabCaseModel: string;
  private readonly pascalCaseModel: string;
  private readonly camelCaseModel: string;

  constructor(private config: Config) {
    this.kebabCaseModel = kebabCase(this.config.model);
    this.pascalCaseModel = pascalCase(this.config.model);
    this.camelCaseModel = camelCase(this.config.model);
  }

  async generate(): Promise<void> {
    const modulesFolderPath = path.join(
      this.config.api.rootPath,
      this.config.api.modulesFolderPath,
      this.kebabCaseModel
    );

    // Delete existing module
    if (this.config.overwrite) {
      await rm(modulesFolderPath, { force: true, recursive: true });
    }

    const tsProject = new Project({
      tsConfigFilePath: path.join(this.config.api.rootPath, this.config.api.tsconfigFilePath),
    });

    // Generate routes
    const routesFile = tsProject.createSourceFile(
      path.join(modulesFolderPath, `./${this.kebabCaseModel}.routes.ts`)
    );
    const routesGenerator = new RoutesGenerator(this.config);
    await routesGenerator.generate(routesFile);
    await routesFile.save();

    // Generate schemas
    const schemasFile = tsProject.createSourceFile(
      path.join(modulesFolderPath, `./${this.kebabCaseModel}.schemas.ts`)
    );
    const schemasGenerator = new SchemasGenerator(this.config);
    await schemasGenerator.generate(schemasFile);
    await schemasFile.save();

    // Generate service
    const serviceFile = tsProject.createSourceFile(
      path.join(modulesFolderPath, `./${this.kebabCaseModel}.service.ts`)
    );
    const serviceGenerator = new ServiceGenerator(this.config);
    await serviceGenerator.generate(serviceFile);
    await serviceFile.save();

    // Generate errors
    const errorsFile = tsProject.createSourceFile(
      path.join(modulesFolderPath, `./${this.kebabCaseModel}.errors.ts`)
    );
    const errorsGenerator = new ErrorsGenerator(this.config);
    await errorsGenerator.generate(errorsFile);
    await errorsFile.save();

    // Generate index
    const indexFile = tsProject.createSourceFile(path.join(modulesFolderPath, 'index.ts'));
    await this.generateIndex(indexFile);
    await indexFile.save();

    // Register the modoule
    const appPath = path.join(this.config.api.rootPath, this.config.api.appFilePath);
    const appFile = tsProject.getSourceFileOrThrow(appPath);
    await this.registerModule(appFile, modulesFolderPath);
    await appFile.save();

    // Generate the prisma model
    const prismaGenerator = new PrismaGenerator(this.config);
    await prismaGenerator.generate();
  }

  private async registerModule(file: SourceFile, modulesFolderPath: string): Promise<void> {
    // Add routes and service imports
    const moduleRelativePath =
      './' + path.relative(path.dirname(file.getFilePath()), modulesFolderPath);
    const getRoutesFunctionName = `get${this.pascalCaseModel}Routes`;
    const serviceNamedImport = `Prisma${this.pascalCaseModel}Service`;

    let moduleImport = file.getImportDeclaration(
      id => id.getModuleSpecifierValue() === moduleRelativePath
    );
    if (!moduleImport) {
      moduleImport = file.addImportDeclaration({
        moduleSpecifier: moduleRelativePath,
      });
    }

    const moduleNamedImports = moduleImport.getNamedImports().map(ni => ni.getName());
    if (!moduleNamedImports.includes(getRoutesFunctionName)) {
      moduleImport.addNamedImport(getRoutesFunctionName);
    }
    if (!moduleNamedImports.includes(serviceNamedImport)) {
      moduleImport.addNamedImport(serviceNamedImport);
    }

    // Add the service initialization
    const serviceVariable = file.getVariableStatement(this.camelCaseModel + 'Service');
    if (!serviceVariable) {
      const appVariable = file.getVariableStatementOrThrow(this.config.api.appVariableName);
      file.insertVariableStatement(appVariable.getChildIndex(), {
        declarationKind: VariableDeclarationKind.Const,
        declarations: [
          {
            name: this.camelCaseModel + 'Service',
            initializer: `new Prisma${this.pascalCaseModel}Service()`,
          },
        ],
      });
    }

    // Register route
    const { appVariableName } = this.config.api;
    const callExpressions = file.getDescendantsOfKind(SyntaxKind.CallExpression);
    let indexToRegister = -1;
    for (const callExpression of callExpressions.reverse()) {
      const expressionIdentifiers = callExpression
        .getExpression()
        .getDescendantsOfKind(SyntaxKind.Identifier);

      // We are looking for app.register, so we need to have 2 identifiers
      if (expressionIdentifiers.length < 2) {
        continue;
      }

      const isApp = expressionIdentifiers[0].getText() === appVariableName;
      if (!isApp) {
        continue;
      }

      const isRegister = expressionIdentifiers[1].getText() === 'register';
      if (!isRegister) {
        continue;
      }

      // Save the first match, so we know where to insert
      if (indexToRegister === -1) {
        indexToRegister = callExpression.getParentOrThrow().getChildIndex() + 1;
      }

      // Keep looking at all call expressions to check if this route is already registered
      // If so, we cam return from this method because we are done.
      const nestedCallExpression = callExpression.getDescendantsOfKind(SyntaxKind.CallExpression);
      if (nestedCallExpression.length === 1) {
        const nestedExpressIdentifiers = nestedCallExpression[0].getDescendantsOfKind(
          SyntaxKind.Identifier
        );

        if (expressionIdentifiers.length !== 2) {
          continue;
        }

        if (nestedExpressIdentifiers[0].getText() === getRoutesFunctionName) {
          // Found it!
          return;
        }
      }
    }

    if (indexToRegister === -1) {
      throw new Error(`Failed to register route, ${appVariableName}.register not found`);
    }

    file.insertStatements(
      indexToRegister,
      `${appVariableName}.register(${getRoutesFunctionName}(${this.camelCaseModel}Service));`
    );
  }

  private async generateIndex(file: SourceFile): Promise<void> {
    file.addExportDeclarations([{ moduleSpecifier: `./${this.kebabCaseModel}.routes` }]);
    file.addExportDeclarations([{ moduleSpecifier: `./${this.kebabCaseModel}.schemas` }]);
    file.addExportDeclarations([{ moduleSpecifier: `./${this.kebabCaseModel}.service` }]);
  }
}
