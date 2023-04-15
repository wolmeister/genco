import path from 'path';
import { SourceFile, VariableDeclarationKind } from 'ts-morph';

import { Config } from '../config.schemas';
import { camelCase, kebabCase, pascalCase, quote, snakeCase } from '../utils/string.utils';

export class ErrorsGenerator {
  private readonly pascalCaseModel: string;
  private readonly kebabCaseModel: string;
  private readonly camelCaseModel: string;
  private readonly snakeCaseModel: string;
  private readonly pluralPascalCaseModel: string;
  private readonly pluralKebabCaseModel: string;
  private readonly pluralCamelCaseModel: string;

  constructor(private config: Config) {
    this.pascalCaseModel = pascalCase(this.config.model);
    this.kebabCaseModel = kebabCase(this.config.model);
    this.camelCaseModel = camelCase(this.config.model);
    this.snakeCaseModel = snakeCase(this.config.model);
    this.pluralPascalCaseModel = pascalCase(this.pascalCaseModel, true);
    this.pluralKebabCaseModel = kebabCase(this.kebabCaseModel, true);
    this.pluralCamelCaseModel = camelCase(this.config.model, true);
  }

  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addErrors(file);
  }

  private addErrors(file: SourceFile): void {
    file.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `Unexpected${this.pascalCaseModel}Error`,
          initializer: writer => {
            writer
              .write('createError(')
              .quote(`UNEXPECTED_${this.snakeCaseModel.toUpperCase()}_ERROR`)
              .write(',')
              .quote(`Unexpected ${this.pascalCaseModel} error`)
              .write(',')
              .write('500)');
          },
        },
      ],
    });

    const { operations } = this.config;
    const uniqueFieldEntries = Object.entries(this.config.fields).filter(
      ([_, field]) => field.unique
    );

    if (operations.findById || operations.update || operations.delete) {
      file.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        declarations: [
          {
            name: `${this.pascalCaseModel}NotFoundError`,
            initializer: writer => {
              writer
                .write('createError(')
                .quote(`${this.snakeCaseModel.toUpperCase()}_NOT_FOUND`)
                .write(',')
                .quote(`${this.pascalCaseModel} not found`)
                .write(',')
                .write('404)');
            },
          },
        ],
      });
    }

    if (operations.create || operations.update) {
      for (const [fieldName] of uniqueFieldEntries) {
        file.addVariableStatement({
          declarationKind: VariableDeclarationKind.Const,
          declarations: [
            {
              name: `${this.pascalCaseModel + pascalCase(fieldName)}NotUniqueError`,
              initializer: writer => {
                writer
                  .write('createError(')
                  .quote(
                    `${this.snakeCaseModel.toUpperCase()}_${snakeCase(
                      fieldName
                    ).toUpperCase()}_NOT_UNIQUE`
                  )
                  .write(',')
                  .quote(`${this.pascalCaseModel} ${camelCase(fieldName)} is not unique`)
                  .write(',')
                  .write('400)');
              },
            },
          ],
        });
      }
    }

    if (operations.findById) {
      file.addFunction({
        name: `formatFind${this.pascalCaseModel}Error`,
        parameters: [
          {
            name: 'error',
            type: 'unknown',
          },
        ],
        returnType: 'FastifyError',
        isExported: true,
        statements: writer => {
          writer
            .write(`if (error instanceof Error && error.name === 'NotFoundError')`)
            .block(() => {
              writer.write(`return new ${this.pascalCaseModel}NotFoundError();`);
            });
          writer.writeLine(
            `logger.error('Unexpected error while finding ${this.pascalCaseModel}', error);`
          );
          writer.writeLine(`return new Unexpected${this.pascalCaseModel}Error();`);
        },
      });
    }

    if (operations.create || operations.update) {
      file.addFunction({
        name: `formatCreateUpdate${this.pascalCaseModel}Error`,
        parameters: [
          {
            name: 'error',
            type: 'unknown',
          },
        ],
        returnType: 'FastifyError',
        isExported: true,
        statements: writer => {
          writer.write(`if (isPrismaError(error))`).block(() => {
            writer.writeLine(`// No ${this.pascalCaseModel} found`);
            writer.write(`if (error.code === 'P2025')`).block(() => {
              writer.write(`return new ${this.pascalCaseModel}NotFoundError();`);
            });

            if (uniqueFieldEntries.length > 0) {
              writer.writeLine('// Constraint violation');

              writer.write(`if (error.code === 'P2002')`).block(() => {
                writer.writeLine('const meta = error.meta as { target?: string[] };');
                writer.newLine();

                for (const [fieldName] of uniqueFieldEntries) {
                  writer.write(`if (meta.target?.includes(${quote(fieldName)}))`).block(() => {
                    writer.write(
                      `return new ${this.pascalCaseModel}${pascalCase(fieldName)}NotUniqueError();`
                    );
                  });
                }
              });
            }
          });
          writer.writeLine(
            `logger.error('Unexpected error while creating/updating ${this.pascalCaseModel}', error);`
          );
          writer.writeLine(`return new Unexpected${this.pascalCaseModel}Error();`);
        },
      });
    }

    if (operations.delete) {
      file.addFunction({
        name: `formatDelete${this.pascalCaseModel}Error`,
        parameters: [
          {
            name: 'error',
            type: 'unknown',
          },
        ],
        returnType: 'FastifyError',
        isExported: true,
        statements: writer => {
          writer.write(`if (isPrismaError(error))`).block(() => {
            writer.writeLine(`// No ${this.pascalCaseModel} found`);
            writer.write(`if (error.code === 'P2025')`).block(() => {
              writer.write(`return new ${this.pascalCaseModel}NotFoundError();`);
            });
          });
          writer.writeLine(
            `logger.error('Unexpected error while deleting ${this.pascalCaseModel}', error);`
          );
          writer.writeLine(`return new Unexpected${this.pascalCaseModel}Error();`);
        },
      });
    }
  }

  private addImports(file: SourceFile): void {
    file.addImportDeclaration({
      moduleSpecifier: '@fastify/error',
      defaultImport: 'createError',
      namedImports: ['FastifyError'],
    });

    const prismaErrorUtilsPath = path.join(
      this.config.api.rootPath,
      this.config.api.prismaErrorUtilsFilePath
    );
    const prismaErrorUtilsRelativePath = path.relative(
      path.dirname(file.getFilePath()),
      prismaErrorUtilsPath
    );
    file.addImportDeclaration({
      moduleSpecifier: prismaErrorUtilsRelativePath,
      namedImports: ['isPrismaError'],
    });

    const loggerPath = path.join(this.config.api.rootPath, this.config.api.loggerFilePath);
    const loggerRelativePath = path.relative(path.dirname(file.getFilePath()), loggerPath);
    file.addImportDeclaration({
      moduleSpecifier: loggerRelativePath,
      namedImports: ['logger'],
    });
  }
}
