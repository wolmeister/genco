import { SourceFile, VariableDeclarationKind } from 'ts-morph';

import { getPermissionRole } from '../common/roles';
import { TypescriptGenerator } from '../common/typescript-generator';
import { Operation } from '../config.schemas';
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
                element: this.getRouteElement(
                  `<${this.pluralPascalCaseModel}Page />`,
                  'findMultiple'
                ),
              });
              writer.write(',');
            }
            if (this.config.operations.findById) {
              writeObject(writer, {
                path: quote(`/${this.pluralKebabCaseModel}/:id`),
                element: this.getRouteElement(`<${this.pascalCaseModel}Page />`, 'findById'),
              });
              writer.write(',');
            }
            if (this.config.operations.create) {
              writeObject(writer, {
                path: quote(`/create-${this.kebabCaseModel}`),
                element: this.getRouteElement(`<Create${this.pascalCaseModel}Page />`, 'create'),
              });
              writer.write(',');
            }
            if (this.config.operations.update) {
              writeObject(writer, {
                path: quote(`/${this.pluralKebabCaseModel}/:id/update`),
                element: this.getRouteElement(`<Update${this.pascalCaseModel}Page />`, 'update'),
              });
              writer.write(',');
            }

            writer.write(']');
          },
        },
      ],
    });
  }

  private getRouteElement(pageComponent: string, operation: Operation): string {
    const permission = this.config.permissions[operation];

    if (permission.type === 'authenticated') {
      return `(<ProtectedRoute>${pageComponent}</ProtectedRoute>)`;
    }

    if (permission.type === 'role') {
      const role = getPermissionRole(this.config, permission, operation);
      return `(<ProtectedRoute permissionRole="${role}">${pageComponent}</ProtectedRoute>)`;
    }

    return pageComponent;
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

    // ProtectedRoute
    const needsProtectedRoute = Object.values(this.config.permissions).some(
      p => p.type === 'authenticated' || p.type === 'role'
    );
    if (needsProtectedRoute) {
      file.addImportDeclaration({
        moduleSpecifier: this.getRelativeImportPath(
          this.config.web.rootPath,
          this.config.web.protectedRouteFilePath,
          file
        ),
        namedImports: ['ProtectedRoute'],
      });
    }

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
