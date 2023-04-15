import { SourceFile } from 'ts-morph';
import { Config } from '../config.schemas';
import { pascalCase, kebabCase, camelCase } from '../utils/string.utils';
import path from 'path';

export class ServiceGenerator {
  private readonly pascalCaseModel: string;
  private readonly kebabCaseModel: string;
  private readonly camelCaseModel: string;
  private readonly pluralPascalCaseModel: string;

  constructor(private config: Config) {
    this.pascalCaseModel = pascalCase(this.config.model);
    this.kebabCaseModel = kebabCase(this.config.model);
    this.camelCaseModel = camelCase(this.config.model);
    this.pluralPascalCaseModel = pascalCase(this.pascalCaseModel, true);
  }

  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addService(file);
  }

  private addService(file: SourceFile): void {
    const serviceInterface = file.addInterface({
      name: this.pascalCaseModel + 'Service',
      isExported: true,
    });

    const serviceClass = file.addClass({
      name: 'Prisma' + serviceInterface.getName(),
      implements: [serviceInterface.getName()],
      isExported: true,
    });

    const { operations } = this.config;

    if (operations.findMultiple) {
      serviceInterface.addMethod({
        name: 'find' + this.pluralPascalCaseModel,
        parameters: [
          {
            name: 'query',
            type: `Find${this.pluralPascalCaseModel}Query`,
          },
        ],
        returnType: `Promise<Connection<${this.pascalCaseModel}, Edge<${this.pascalCaseModel}>>>`,
      });

      serviceClass.addMethod({
        name: 'find' + this.pluralPascalCaseModel,
        parameters: [
          {
            name: 'query',
            type: `Find${this.pluralPascalCaseModel}Query`,
          },
        ],
        returnType: `Promise<Connection<${this.pascalCaseModel}, Edge<${this.pascalCaseModel}>>>`,
        statements: writer => {
          writer
            .write('return findManyCursorConnection(args => ')
            .write('prisma.')
            .write(this.camelCaseModel)
            .write('.findMany({ ...args, where: { id: { in: query.ids } } }),')
            .write('() => prisma.')
            .write(this.camelCaseModel)
            .write('.count({ where: { id: { in: query.ids } } }),')
            .write('query')
            .write(');');
        },
      });
    }

    if (operations.findById) {
      serviceInterface.addMethod({
        name: 'find' + this.pascalCaseModel + 'ById',
        parameters: [
          {
            name: 'id',
            type: `${this.pascalCaseModel}['id']`,
          },
        ],
        returnType: `Promise<${this.pascalCaseModel}>`,
      });

      serviceClass.addMethod({
        name: 'find' + this.pascalCaseModel + 'ById',
        parameters: [
          {
            name: 'id',
            type: `${this.pascalCaseModel}['id']`,
          },
        ],
        returnType: `Promise<${this.pascalCaseModel}>`,
        isAsync: true,
        statements: writer => {
          writer
            .write('try')
            .block(() => {
              writer
                .write('const ')
                .write(this.camelCaseModel)
                .write(' = await prisma.')
                .write(this.camelCaseModel)
                .write('.findUniqueOrThrow(')
                .block(() => {
                  writer.write('where: { id }');
                })
                .write(');')
                .newLine();

              writer.write('return ').write(this.camelCaseModel).write(';');
            })
            .write('catch (error)')
            .block(() => {
              writer.write('throw formatFind').write(this.pascalCaseModel).write('Error(error);');
            });
        },
      });
    }

    if (operations.create) {
      serviceInterface.addMethod({
        name: 'create' + this.pascalCaseModel,
        parameters: [
          {
            name: 'data',
            type: `Create${this.pascalCaseModel}`,
          },
        ],
        returnType: `Promise<${this.pascalCaseModel}>`,
      });

      serviceClass.addMethod({
        name: 'create' + this.pascalCaseModel,
        parameters: [
          {
            name: 'data',
            type: `Create${this.pascalCaseModel}`,
          },
        ],
        returnType: `Promise<${this.pascalCaseModel}>`,
        isAsync: true,
        statements: writer => {
          writer
            .write('try')
            .block(() => {
              writer
                .write('const ')
                .write(this.camelCaseModel)
                .write(' = await prisma.')
                .write(this.camelCaseModel)
                .write('.create(')
                .inlineBlock(() => {
                  writer.write('data');
                })
                .write(');')
                .newLine();

              writer.write('return ').write(this.camelCaseModel).write(';');
            })
            .write('catch (error)')
            .block(() => {
              writer
                .write('throw formatCreateUpdate')
                .write(this.pascalCaseModel)
                .write('Error(error);');
            });
        },
      });
    }

    if (operations.update) {
      serviceInterface.addMethod({
        name: 'update' + this.pascalCaseModel,
        parameters: [
          {
            name: 'id',
            type: `${this.pascalCaseModel}['id']`,
          },
          {
            name: 'data',
            type: `Update${this.pascalCaseModel}`,
          },
        ],
        returnType: `Promise<${this.pascalCaseModel}>`,
      });

      serviceClass.addMethod({
        name: 'update' + this.pascalCaseModel,
        parameters: [
          {
            name: 'id',
            type: `${this.pascalCaseModel}['id']`,
          },
          {
            name: 'data',
            type: `Update${this.pascalCaseModel}`,
          },
        ],
        returnType: `Promise<${this.pascalCaseModel}>`,
        isAsync: true,
        statements: writer => {
          writer
            .write('try')
            .block(() => {
              writer
                .write('const ')
                .write(this.camelCaseModel)
                .write(' = await prisma.')
                .write(this.camelCaseModel)
                .write('.update(')
                .inlineBlock(() => {
                  writer.writeLine('where: { id },');
                  writer.writeLine('data');
                })
                .write(');')
                .newLine();

              writer.write('return ').write(this.camelCaseModel).write(';');
            })
            .write('catch (error)')
            .block(() => {
              writer
                .write('throw formatCreateUpdate')
                .write(this.pascalCaseModel)
                .write('Error(error);');
            });
        },
      });
    }

    if (operations.delete) {
      serviceInterface.addMethod({
        name: 'delete' + this.pascalCaseModel,
        parameters: [
          {
            name: 'id',
            type: `${this.pascalCaseModel}['id']`,
          },
        ],
        returnType: `Promise<${this.pascalCaseModel}>`,
      });

      serviceClass.addMethod({
        name: 'delete' + this.pascalCaseModel,
        parameters: [
          {
            name: 'id',
            type: `${this.pascalCaseModel}['id']`,
          },
        ],
        returnType: `Promise<${this.pascalCaseModel}>`,
        isAsync: true,
        statements: writer => {
          writer
            .write('try')
            .block(() => {
              writer
                .write('const ')
                .write(this.camelCaseModel)
                .write(' = await prisma.')
                .write(this.camelCaseModel)
                .write('.delete(')
                .inlineBlock(() => {
                  writer.writeLine('where: { id },');
                })
                .write(');')
                .newLine();

              writer.write('return ').write(this.camelCaseModel).write(';');
            })
            .write('catch (error)')
            .block(() => {
              writer.write('throw formatDelete').write(this.pascalCaseModel).write('Error(error);');
            });
        },
      });
    }
  }

  private addImports(file: SourceFile): void {
    file.addImportDeclaration({
      moduleSpecifier: '@prisma/client',
      namedImports: [this.pascalCaseModel],
    });

    const prismaClientPath = path.join(
      this.config.api.rootPath,
      this.config.api.prismaClientFilePath
    );
    const prismaClientRelativePath = path.relative(
      path.dirname(file.getFilePath()),
      prismaClientPath
    );

    file.addImportDeclaration({
      moduleSpecifier: prismaClientRelativePath,
      namedImports: ['prisma'],
    });

    const errorsImportDeclaration = file.addImportDeclaration({
      moduleSpecifier: './' + this.kebabCaseModel + '.errors',
    });
    const schemasImportDeclaration = file.addImportDeclaration({
      moduleSpecifier: './' + this.kebabCaseModel + '.schemas',
    });

    const { operations } = this.config;

    if (operations.findMultiple) {
      file.addImportDeclaration({
        moduleSpecifier: '@devoxa/prisma-relay-cursor-connection',
        namedImports: ['Connection', 'Edge', 'findManyCursorConnection'],
      });
      schemasImportDeclaration.addNamedImport(`Find${this.pluralPascalCaseModel}Query`);
    }

    if (operations.findById) {
      errorsImportDeclaration.addNamedImport(`formatFind${this.pascalCaseModel}Error`);
    }

    if (operations.create || operations.update) {
      errorsImportDeclaration.addNamedImport(`formatCreateUpdate${this.pascalCaseModel}Error`);

      if (operations.create) {
        schemasImportDeclaration.addNamedImport(`Create${this.pascalCaseModel}`);
      }

      if (operations.update) {
        schemasImportDeclaration.addNamedImport(`Update${this.pascalCaseModel}`);
      }
    }

    if (operations.delete) {
      errorsImportDeclaration.addNamedImport(`formatDelete${this.pascalCaseModel}Error`);
    }
  }
}
