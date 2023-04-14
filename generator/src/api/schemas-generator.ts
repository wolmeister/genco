import { SourceFile, VariableDeclarationKind } from 'ts-morph';
import path from 'path';
import { Config, Field } from '../config.schemas';
import { WritableObject, objectToString, writeObject } from '../utils/writer.utils';
import { kebabCase, pascalCase, quote } from '../utils/string.utils';

export class SchemasGenerator {
  private readonly pascalCaseModel: string;
  private readonly kebabCaseModel: string;

  constructor(private config: Config) {
    this.pascalCaseModel = pascalCase(this.config.model);
    this.kebabCaseModel = kebabCase(this.config.model);
  }

  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addSchemas(file);
  }

  private addSchemas(file: SourceFile): void {
    this.addCommonSchemas(file);

    const { operations } = this.config;

    if (operations.findMultiple) {
      this.addFindMultipleSchemas(file);
    }
    if (operations.create) {
      this.addCreateSchemas(file);
    }
    if (operations.update) {
      this.addUpdateSchemas(file);
    }
  }

  private addCommonSchemas(file: SourceFile): void {
    file.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      leadingTrivia: '// Common',
      trailingTrivia: '\n\n',
      declarations: [
        {
          name: this.pascalCaseModel + 'ResponseSchema',
          initializer: writer => {
            writer.write('Type.Object(');
            const objectToWrite: WritableObject = {
              id: 'Type.String()',
            };
            for (const [fieldName, field] of Object.entries(this.config.fields)) {
              objectToWrite[fieldName] = this.getTypeboxFieldSchema(field, true);
            }
            writeObject(writer, {
              ...objectToWrite,
              updatedAt: 'DateType()',
              createdAt: 'DateType()',
            });
            writer.write(')');
          },
        },
      ],
    });
    file
      .addTypeAlias({
        isExported: true,
        name: this.pascalCaseModel + 'Response',
        type: `Static<typeof ${this.pascalCaseModel}ResponseSchema>`,
      })
      .prependWhitespace(writer => writer.newLine());

    const { operations } = this.config;
    if (operations.findById || operations.update || operations.delete) {
      file.addVariableStatement({
        isExported: true,
        declarationKind: VariableDeclarationKind.Const,
        declarations: [
          {
            name: this.pascalCaseModel + 'IdParamsSchema',
            initializer: writer => {
              writer.write('Type.Object(');
              writeObject(writer, {
                id: 'Type.String()',
              });
              writer.write(')');
            },
          },
        ],
      });
      file
        .addTypeAlias({
          isExported: true,
          name: this.pascalCaseModel + 'IdParams',
          type: `Static<typeof ${this.pascalCaseModel}IdParamsSchema>`,
        })
        .prependWhitespace(writer => writer.newLine());
    }
  }

  private addFindMultipleSchemas(file: SourceFile): void {
    file.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      leadingTrivia: '// Find ' + this.pascalCaseModel + 's',
      trailingTrivia: '\n\n',
      declarations: [
        {
          name: 'Find' + this.pascalCaseModel + 'sQuerySchema',
          initializer: writer => {
            writer.write('Type.Object(');
            writeObject(writer, {
              ids: 'Type.Optional(Type.Array(Type.String()))',
              after: 'Type.Optional(Type.String())',
              first: 'Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 }))',
            });
            writer.write(')');
          },
        },
      ],
    });
    file
      .addTypeAlias({
        isExported: true,
        name: 'Find' + this.pascalCaseModel + 'sQuery',
        type: `Static<typeof Find${this.pascalCaseModel}sQuerySchema>`,
      })
      .prependWhitespace(writer => writer.newLine());

    file.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      trailingTrivia: '\n\n',
      declarations: [
        {
          name: 'Find' + this.pascalCaseModel + 'sResponseSchema',
          initializer: `createPaginationSchema(${this.pascalCaseModel}ResponseSchema)`,
        },
      ],
    });
    file
      .addTypeAlias({
        isExported: true,
        name: 'Find' + this.pascalCaseModel + 'sResponse',
        type: `Static<typeof Find${this.pascalCaseModel}sResponseSchema>`,
      })
      .prependWhitespace(writer => writer.newLine());
  }

  private addCreateSchemas(file: SourceFile): void {
    file.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      leadingTrivia: '// Create ' + this.pascalCaseModel,
      trailingTrivia: '\n\n',
      declarations: [
        {
          name: 'Create' + this.pascalCaseModel + 'Schema',
          initializer: writer => {
            writer.write('Type.Object(');
            const objectToWrite: WritableObject = {};
            for (const [fieldName, field] of Object.entries(this.config.fields)) {
              objectToWrite[fieldName] = this.getTypeboxFieldSchema(field, false);
            }
            writeObject(writer, objectToWrite);
            writer.write(')');
          },
        },
      ],
    });
    file
      .addTypeAlias({
        isExported: true,
        name: 'Create' + this.pascalCaseModel + '',
        type: `Static<typeof Create${this.pascalCaseModel}Schema>`,
      })
      .prependWhitespace(writer => writer.newLine());
  }

  private addUpdateSchemas(file: SourceFile): void {
    file.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      leadingTrivia: '// Update ' + this.pascalCaseModel,
      declarations: [
        {
          name: 'Update' + this.pascalCaseModel + 'Schema',
          initializer: writer => {
            writer.write('Type.Object(');
            const objectToWrite: WritableObject = {};
            for (const [fieldName, field] of Object.entries(this.config.fields)) {
              if (field.immutable === false) {
                objectToWrite[fieldName] = this.getTypeboxFieldSchema(field, false);
              }
            }
            writeObject(writer, objectToWrite);
            writer.write(')');
          },
        },
      ],
    });
    file
      .addTypeAlias({
        isExported: true,
        name: 'Update' + this.pascalCaseModel + '',
        type: `Static<typeof Update${this.pascalCaseModel}Schema>`,
      })
      .prependWhitespace(writer => writer.newLine());
  }

  private getTypeboxFieldSchema(field: Field, responseSchema: boolean): string {
    const options: WritableObject = {};
    let schema: string;

    switch (field.type) {
      case 'string':
        schema = 'Type.String';
        if (field.format) {
          options.format = quote(field.format);
        }
        if (field.validations) {
          options.validations = {};
          if (field.validations.minLength !== undefined) {
            options.validations.minLength = String(field.validations.minLength);
          }
          if (field.validations.maxLength !== undefined) {
            options.validations.maxLength = String(field.validations.maxLength);
          }
        }
        break;
      case 'int':
      case 'double':
        schema = 'Type.' + (field.type === 'int' ? 'Integer' : 'Number');
        if (field.validations) {
          options.validations = {};
          if (field.validations.min !== undefined) {
            options.validations.minimum = String(field.validations.min);
          }
          if (field.validations.max !== undefined) {
            options.validations.maximum = String(field.validations.max);
          }
        }
        break;
      case 'boolean':
        schema = 'Type.Boolean';
        break;
      case 'date':
        schema = 'DateType';
        // ADD - Support date validations
        break;
      default:
        throw new Error('Field type not implemented');
    }

    if (field.default !== undefined) {
      if (field.type === 'string' || field.type === 'date') {
        field.default = quote(field.default);
      } else {
        options.default = String(field.default);
      }
    }

    schema += '(';
    if (Object.keys(options).length > 0) {
      schema += objectToString(options);
    }
    schema += ')';

    if (field.required === false) {
      if (responseSchema) {
        schema = `Type.Union([Type.Null(), ${schema}])`;
      } else {
        schema = `Type.Optional(${schema})`;
      }
    }

    return schema;
  }

  private addImports(file: SourceFile): void {
    file.addImportDeclaration({
      moduleSpecifier: '@sinclair/typebox',
      namedImports: ['Static', 'Type'],
    });

    const typeboxTypesPath = path.join(
      this.config.api.rootPath,
      this.config.api.typeboxTypesFilePath
    );
    const typeboxTypesRelativePath = path.relative(
      path.dirname(file.getFilePath()),
      typeboxTypesPath
    );

    const typeboxUtilsImports = ['DateType'];

    if (this.config.operations.findMultiple) {
      typeboxUtilsImports.push('createPaginationSchema');
    }

    file.addImportDeclaration({
      moduleSpecifier: typeboxTypesRelativePath,
      namedImports: typeboxUtilsImports,
    });
  }
}
