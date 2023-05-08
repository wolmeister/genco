import { SourceFile } from 'ts-morph';

import { TypescriptGenerator } from '../common/typescript-generator';

export class SkeletonComponentGenerator extends TypescriptGenerator {
  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addSkeletonComponent(file);
  }

  private addSkeletonComponent(file: SourceFile): void {
    file.addFunction({
      name: `${this.pascalCaseModel}Skeleton`,
      isExported: true,
      statements: 'return <Skeleton />',
    });
  }

  private addImports(file: SourceFile): void {
    // React
    file.addImportDeclaration({
      moduleSpecifier: 'react',
      defaultImport: 'React',
    });

    // Component
    file.addImportDeclaration({
      moduleSpecifier: this.getRelativeImportPath(
        this.config.web.rootPath,
        this.config.web.skeletonComponentFilePath,
        file
      ),
      namedImports: ['Skeleton'],
    });
  }
}
