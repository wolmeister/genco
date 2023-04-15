import path from 'path';
import { Config } from '../config.schemas';
import { rm } from 'fs/promises';
import { Project, SourceFile } from 'ts-morph';
import { RoutesGenerator } from './routes-generator';
import { kebabCase } from '../utils/string.utils';
import { SchemasGenerator } from './schemas-generator';
import { ServiceGenerator } from './service-generator';
import { ErrorsGenerator } from './errors-generator';

export class ApiGenerator {
  private readonly kebabCaseModel: string;
  constructor(private config: Config) {
    this.kebabCaseModel = kebabCase(this.config.model);
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
  }

  private async generateIndex(file: SourceFile): Promise<void> {
    file.addExportDeclarations([{ moduleSpecifier: `./${this.kebabCaseModel}.routes` }]);
    file.addExportDeclarations([{ moduleSpecifier: `./${this.kebabCaseModel}.schemas` }]);
    file.addExportDeclarations([{ moduleSpecifier: `./${this.kebabCaseModel}.service` }]);
  }
}
