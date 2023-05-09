import { SourceFile, VariableDeclarationKind } from 'ts-morph';

import { TypescriptGenerator } from '../common/typescript-generator';
import { quote } from '../utils/string.utils';
import { writeObject } from '../utils/writer.utils';

export class RoutesGenerator extends TypescriptGenerator {
  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addRoutes(file);
  }

  private addRoutes(file: SourceFile): void {
    file.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `${this.camelCaseModel}Routes`,
          type: 'RouteObject[]',
          initializer: writer => {
            writer.write('[');

            if (this.config.operations.findMultiple) {
              writeObject(writer, {
                path: quote(`/${this.pluralKebabCaseModel}`),
                element: `<${this.pluralPascalCaseModel}Page />`,
              });
              writer.write(',');
            }
            if (this.config.operations.findById) {
              writeObject(writer, {
                path: quote(`/${this.pluralKebabCaseModel}/:id`),
                element: `<${this.pascalCaseModel}Page />`,
              });
              writer.write(',');
            }
            if (this.config.operations.create) {
              writeObject(writer, {
                path: quote(`/create-${this.kebabCaseModel}`),
                element: `<Create${this.pascalCaseModel}Page />`,
              });
              writer.write(',');
            }
            if (this.config.operations.update) {
              writeObject(writer, {
                path: quote(`/${this.pluralKebabCaseModel}/:id/update`),
                element: `<Update${this.pascalCaseModel}Page />`,
              });
              writer.write(',');
            }

            writer.write(']');
          },
        },
      ],
    });
  }

  private addImports(file: SourceFile): void {
    // React
    file.addImportDeclaration({
      moduleSpecifier: 'react',
      defaultImport: 'React',
    });

    // React router
    file.addImportDeclaration({
      moduleSpecifier: 'react-router-dom',
      namedImports: ['RouteObject'],
    });

    // Pages
    if (this.config.operations.findMultiple) {
      file.addImportDeclaration({
        moduleSpecifier: `./pages/${this.pluralPascalCaseModel}Page`,
        namedImports: [`${this.pluralPascalCaseModel}Page`],
      });
    }
    if (this.config.operations.findById) {
      file.addImportDeclaration({
        moduleSpecifier: `./pages/${this.pascalCaseModel}Page`,
        namedImports: [`${this.pascalCaseModel}Page`],
      });
    }
    if (this.config.operations.create) {
      file.addImportDeclaration({
        moduleSpecifier: `./pages/Create${this.pascalCaseModel}Page`,
        namedImports: [`Create${this.pascalCaseModel}Page`],
      });
    }
    if (this.config.operations.update) {
      file.addImportDeclaration({
        moduleSpecifier: `./pages/Update${this.pascalCaseModel}Page`,
        namedImports: [`Update${this.pascalCaseModel}Page`],
      });
    }
  }
}
