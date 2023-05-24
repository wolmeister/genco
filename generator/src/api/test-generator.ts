import { CodeBlockWriter, SourceFile, VariableDeclarationKind } from 'ts-morph';

import { getPermissionRole } from '../common/roles';
import { TypescriptGenerator } from '../common/typescript-generator';
import { Config, Field, Operation, Permission } from '../config.schemas';
import { humanize, quote, snakeCase } from '../utils/string.utils';
import { objectToString, WritableObject, writeObject } from '../utils/writer.utils';

export class TestGenerator extends TypescriptGenerator {
  private readonly humanizedModel: string;
  private readonly pluralHumanizedModel: string;

  constructor(config: Config) {
    super(config);
    this.humanizedModel = humanize(this.config.model, true);
    this.pluralHumanizedModel = humanize(this.config.model, true, true);
  }

  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addMocks(file);
    this.addTests(file);
  }

  private addTests(file: SourceFile): void {
    file.addStatements(writer => {
      writer
        .blankLine()
        .writeLine(`describe('${this.pascalCaseModel} API (/${this.pluralKebabCaseModel})', () => `)
        .block(() => {
          if (this.config.operations.findMultiple) {
            this.addFindMultipleTests(writer);
          }

          if (this.config.operations.findById) {
            this.addFindByIdTests(writer);
          }

          if (this.config.operations.create) {
            this.addCreateTests(writer);
          }

          if (this.config.operations.update) {
            this.addUpdateTests(writer);
          }

          if (this.config.operations.delete) {
            this.addDeleteTests(writer);
          }
        })
        .write(');');
    });
  }

  private addFindMultipleTests(writer: CodeBlockWriter): void {
    const url = quote(`/${this.pluralKebabCaseModel}`);

    writer
      .blankLine()
      .writeLine(`describe('GET /${this.pluralKebabCaseModel}', () => `)
      .block(() => {
        writer
          .writeLine(`it('should return a page of ${this.pluralHumanizedModel}', async () => `)
          .block(() => {
            writer
              .write('const pageSize = 25;')
              .write(
                `const ${this.camelCaseModel}Mocks = Array.from({ length: pageSize }).map((_, index) => (`
              )
              .write(
                objectToString({
                  [`...${this.camelCaseModel}Mock`]: '',
                  id: `${this.camelCaseModel}Mock.id + '-' + index`,
                })
              )
              .write('));')
              .write(
                `const ${this.camelCaseModel}MockEdges = Array.from({ length: pageSize }).map((_, index) => (`
              )
              .write(
                objectToString({
                  cursor: `serialized${this.pascalCaseModel}Mock.id + '-' + index`,
                  node: {
                    [`...serialized${this.pascalCaseModel}Mock`]: '',
                    id: `serialized${this.pascalCaseModel}Mock.id + '-' + index`,
                  },
                })
              )
              .write('));')
              .write(
                `prismaMock.${this.camelCaseModel}.findMany.mockResolvedValue(${this.camelCaseModel}Mocks);`
              )
              .write(`prismaMock.${this.camelCaseModel}.count.mockResolvedValue(pageSize);`)
              .blankLine()
              .write('const response = await app.inject(')
              .write(
                objectToString({
                  method: quote('GET'),
                  url,
                  ...this.getRequestConfigForOperation('findMultiple'),
                })
              )
              .write(');')
              .blankLine()
              .write('expect(response.statusCode).toBe(200);')
              .write(`expect(response.json()).toStrictEqual(`)
              .write(
                objectToString({
                  edges: `${this.camelCaseModel}MockEdges`,
                  pageInfo: {
                    hasNextPage: 'false',
                    hasPreviousPage: 'false',
                    startCursor: quote('id-0'),
                    endCursor: `${quote('id-')} + (pageSize - 1)`,
                  },
                  totalCount: 'pageSize',
                })
              )
              .write(');');
          })
          .write(');');

        writer
          .blankLine()
          .writeLine(`it('should fail if the request query is invalid', async () => `)
          .block(() => {
            writer
              .write('const response = await app.inject(')
              .write(
                objectToString({
                  method: quote('GET'),
                  url,
                  ...this.getRequestConfigForOperation('findMultiple'),
                  query: {
                    first: quote('0'),
                  },
                })
              )
              .write(');')
              .blankLine()
              .write('expect(response.statusCode).toBe(400);')
              .write(`expect(response.json()).toStrictEqual(`)
              .write(
                objectToString({
                  statusCode: '400',
                  message: quote('querystring/first must be >= 1'),
                  error: quote('Bad Request'),
                })
              )
              .write(');');
          })
          .write(');');

        this.addPermissionTests(this.config.permissions.findMultiple, 'GET', url, writer);
      })
      .write(');');
  }

  private addFindByIdTests(writer: CodeBlockWriter): void {
    const url = `'/${this.pluralKebabCaseModel}/' + ${this.camelCaseModel}Mock.id`;

    writer
      .blankLine()
      .writeLine(`describe('GET /${this.pluralKebabCaseModel}/:id', () => `)
      .block(() => {
        writer
          .writeLine(`it('should return the ${this.humanizedModel}', async () => `)
          .block(() => {
            writer
              .write(
                `prismaMock.${this.camelCaseModel}.findUniqueOrThrow.mockResolvedValue(${this.camelCaseModel}Mock);`
              )
              .blankLine()
              .write('const response = await app.inject(')
              .write(
                objectToString({
                  method: quote('GET'),
                  url,
                  ...this.getRequestConfigForOperation('findById'),
                })
              )
              .write(');')
              .blankLine()
              .write('expect(response.statusCode).toBe(200);')
              .write(
                `expect(response.json()).toStrictEqual(serialized${this.pascalCaseModel}Mock);`
              );
          })
          .write(');');

        writer
          .blankLine()
          .writeLine(`it('should fail if the ${this.humanizedModel} does not exists', async () => `)
          .block(() => {
            writer
              .write('const notFoundError = new Error();')
              .write(`notFoundError.name = 'NotFoundError';`)
              .write(
                `prismaMock.${this.camelCaseModel}.findUniqueOrThrow.mockRejectedValue(notFoundError);`
              )
              .blankLine()
              .write('const response = await app.inject(')
              .write(
                objectToString({
                  method: quote('GET'),
                  url,
                  ...this.getRequestConfigForOperation('findById'),
                })
              )
              .write(');')
              .blankLine()
              .write('expect(response.statusCode).toBe(404);')
              .write(`expect(response.json()).toStrictEqual(`)
              .write(
                objectToString({
                  code: quote(`${this.snakeCaseModel.toUpperCase()}_NOT_FOUND`),
                  statusCode: '404',
                  message: quote(`${this.pascalCaseModel} not found`),
                  error: quote('Not Found'),
                })
              )
              .write(');');
          })
          .write(');');

        this.addPermissionTests(this.config.permissions.findById, 'GET', url, writer);
      })
      .write(');');
  }

  private addCreateTests(writer: CodeBlockWriter): void {
    const url = quote(`/${this.pluralKebabCaseModel}`);

    writer
      .blankLine()
      .writeLine(`describe('POST /${this.pluralKebabCaseModel}', () => `)
      .block(() => {
        writer
          .writeLine(`it('should create and return the ${this.humanizedModel}', async () => `)
          .block(() => {
            const payload: WritableObject = {};
            for (const fieldName of Object.keys(this.config.fields)) {
              payload[fieldName] = `${this.camelCaseModel}Mock.${fieldName}`;
            }

            writer
              .write(
                `prismaMock.${this.camelCaseModel}.create.mockResolvedValue(${this.camelCaseModel}Mock);`
              )
              .blankLine()
              .write('const response = await app.inject(')
              .write(
                objectToString({
                  method: quote('POST'),
                  url,
                  ...this.getRequestConfigForOperation('create'),
                  payload,
                })
              )
              .write(');')
              .blankLine()
              .write('expect(response.statusCode).toBe(201);')
              .write(
                `expect(response.json()).toStrictEqual(serialized${this.pascalCaseModel}Mock);`
              );
          })
          .write(');');

        writer
          .blankLine()
          .writeLine(`it('should fail if the request body is invalid', async () => `)
          .block(() => {
            writer
              .write('const response = await app.inject(')
              .write(
                objectToString({
                  method: quote('POST'),
                  url,
                  ...this.getRequestConfigForOperation('create'),
                })
              )
              .write(');')
              .blankLine()
              .write('expect(response.statusCode).toBe(400);')
              .write(`expect(response.json()).toStrictEqual(`)
              .write(
                objectToString({
                  statusCode: '400',
                  message: quote('body must be object'),
                  error: quote('Bad Request'),
                })
              )
              .write(');');
          })
          .write(');');

        this.addUniqueFieldTests('create', url, writer);
        this.addPermissionTests(this.config.permissions.create, 'POST', url, writer);
      })
      .write(');');
  }

  private addUpdateTests(writer: CodeBlockWriter): void {
    const url = `'/${this.pluralKebabCaseModel}/' + ${this.camelCaseModel}Mock.id`;

    const validPayload: WritableObject = {};
    for (const [fieldName, field] of Object.entries(this.config.fields)) {
      if (field.immutable === false) {
        validPayload[fieldName] = `${this.camelCaseModel}Mock.${fieldName}`;
      }
    }

    writer
      .blankLine()
      .writeLine(`describe('PATCH /${this.pluralKebabCaseModel}/:id', () => `)
      .block(() => {
        writer
          .writeLine(`it('should update and return the ${this.humanizedModel}', async () => `)
          .block(() => {
            writer
              .write(
                `prismaMock.${this.camelCaseModel}.update.mockResolvedValue(${this.camelCaseModel}Mock);`
              )
              .blankLine()
              .write('const response = await app.inject(')
              .write(
                objectToString({
                  method: quote('PATCH'),
                  url,
                  ...this.getRequestConfigForOperation('update'),
                  payload: validPayload,
                })
              )
              .write(');')
              .blankLine()
              .write('expect(response.statusCode).toBe(200);')
              .write(
                `expect(response.json()).toStrictEqual(serialized${this.pascalCaseModel}Mock);`
              );
          })
          .write(');');

        writer
          .blankLine()
          .writeLine(`it('should fail if the request body is invalid', async () => `)
          .block(() => {
            writer
              .write('const response = await app.inject(')
              .write(
                objectToString({
                  method: quote('PATCH'),
                  url,
                  ...this.getRequestConfigForOperation('update'),
                })
              )
              .write(');')
              .blankLine()
              .write('expect(response.statusCode).toBe(400);')
              .write(`expect(response.json()).toStrictEqual(`)
              .write(
                objectToString({
                  statusCode: '400',
                  message: quote('body must be object'),
                  error: quote('Bad Request'),
                })
              )
              .write(');');
          })
          .write(');');

        this.addUniqueFieldTests('update', url, writer);

        writer
          .blankLine()
          .writeLine(`it('should fail if the ${this.humanizedModel} does not exists', async () => `)
          .block(() => {
            writer
              .write(`const error = new PrismaClientKnownRequestError('Error', `)
              .write(
                objectToString({
                  clientVersion: quote('testing'),
                  code: quote('P2025'),
                })
              )
              .write(');')
              .write(`prismaMock.${this.camelCaseModel}.update.mockRejectedValue(error);`)
              .blankLine()
              .write('const response = await app.inject(')
              .write(
                objectToString({
                  method: quote('PATCH'),
                  url,
                  ...this.getRequestConfigForOperation('update'),
                  payload: validPayload,
                })
              )
              .write(');')
              .blankLine()
              .write('expect(response.statusCode).toBe(404);')
              .write(`expect(response.json()).toStrictEqual(`)
              .write(
                objectToString({
                  code: quote(`${this.snakeCaseModel.toUpperCase()}_NOT_FOUND`),
                  statusCode: '404',
                  message: quote(`${this.pascalCaseModel} not found`),
                  error: quote('Not Found'),
                })
              )
              .write(');');
          })
          .write(');');

        this.addPermissionTests(this.config.permissions.update, 'PATCH', url, writer);
      })
      .write(');');
  }

  private addDeleteTests(writer: CodeBlockWriter): void {
    const url = `'/${this.pluralKebabCaseModel}/' + ${this.camelCaseModel}Mock.id`;

    writer
      .blankLine()
      .writeLine(`describe('DELETE /${this.pluralKebabCaseModel}/:id', () => `)
      .block(() => {
        writer
          .writeLine(`it('should delete and return the ${this.humanizedModel}', async () => `)
          .block(() => {
            writer
              .write(
                `prismaMock.${this.camelCaseModel}.delete.mockResolvedValue(${this.camelCaseModel}Mock);`
              )
              .blankLine()
              .write('const response = await app.inject(')
              .write(
                objectToString({
                  method: quote('DELETE'),
                  url,
                  ...this.getRequestConfigForOperation('delete'),
                })
              )
              .write(');')
              .blankLine()
              .write('expect(response.statusCode).toBe(200);')
              .write(
                `expect(response.json()).toStrictEqual(serialized${this.pascalCaseModel}Mock);`
              );
          })
          .write(');');

        writer
          .blankLine()
          .writeLine(`it('should fail if the ${this.humanizedModel} does not exists', async () => `)
          .block(() => {
            writer
              .write(`const error = new PrismaClientKnownRequestError('Error', `)
              .write(
                objectToString({
                  clientVersion: quote('testing'),
                  code: quote('P2025'),
                })
              )
              .write(');')
              .write(`prismaMock.${this.camelCaseModel}.delete.mockRejectedValue(error);`)
              .blankLine()
              .write('const response = await app.inject(')
              .write(
                objectToString({
                  method: quote('DELETE'),
                  url,
                  ...this.getRequestConfigForOperation('delete'),
                })
              )
              .write(');')
              .blankLine()
              .write('expect(response.statusCode).toBe(404);')
              .write(`expect(response.json()).toStrictEqual(`)
              .write(
                objectToString({
                  code: quote(`${this.snakeCaseModel.toUpperCase()}_NOT_FOUND`),
                  statusCode: '404',
                  message: quote(`${this.pascalCaseModel} not found`),
                  error: quote('Not Found'),
                })
              )
              .write(');');
          })
          .write(');');

        this.addPermissionTests(this.config.permissions.delete, 'DELETE', url, writer);
      })
      .write(');');
  }

  private addUniqueFieldTests(
    operation: 'create' | 'update',
    url: string,
    writer: CodeBlockWriter
  ): void {
    const payload: WritableObject = {};
    for (const [fieldName, field] of Object.entries(this.config.fields)) {
      if (operation === 'create' || field.immutable === false) {
        payload[fieldName] = `${this.camelCaseModel}Mock.${fieldName}`;
      }
    }

    for (const [fieldName, field] of Object.entries(this.config.fields)) {
      if (field.unique === false) {
        continue;
      }

      const snakeCaseFieldName = snakeCase(fieldName);
      const errorCode = `${this.snakeCaseModel.toUpperCase()}_${snakeCaseFieldName.toUpperCase()}_NOT_UNIQUE`;

      writer
        .blankLine()
        .writeLine(`it('should fail if the ${fieldName} is not unique', async () => `)
        .block(() => {
          writer
            .write(`const error = new PrismaClientKnownRequestError('Error', `)
            .write(
              objectToString({
                clientVersion: quote('testing'),
                code: quote('P2002'),
                meta: {
                  target: quote(fieldName),
                },
              })
            )
            .write(');')
            .write(`prismaMock.${this.camelCaseModel}.${operation}.mockRejectedValue(error);`)
            .blankLine()
            .write('const response = await app.inject(')
            .write(
              objectToString({
                method: quote(operation === 'create' ? 'POST' : 'PATCH'),
                url,
                ...this.getRequestConfigForOperation(operation),
                payload,
              })
            )
            .write(');')
            .blankLine()
            .write('expect(response.statusCode).toBe(400);')
            .write(`expect(response.json()).toStrictEqual(`)
            .write(
              objectToString({
                code: quote(errorCode),
                statusCode: '400',
                message: quote(`${this.pascalCaseModel} ${fieldName} is not unique`),
                error: quote('Bad Request'),
              })
            )
            .write(');');
        })
        .write(');');
    }
  }

  private addPermissionTests(
    permission: Permission,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    url: string,
    writer: CodeBlockWriter
  ): void {
    if (permission.type === 'public') {
      return;
    }

    if (permission.type === 'authenticated' || permission.type === 'role') {
      writer
        .blankLine()
        .writeLine(`it('should fail if the user is not authenticated', async () => `)
        .block(() => {
          writer
            .write('const response = await app.inject(')
            .write(
              objectToString({
                method: quote(method),
                url,
              })
            )
            .write(');')
            .blankLine()
            .write('expect(response.statusCode).toBe(401);')
            .write(`expect(response.json()).toStrictEqual(`)
            .write(
              objectToString({
                code: quote('NOT_AUTHENTICATED'),
                statusCode: '401',
                message: quote('Not authenticated'),
                error: quote('Unauthorized'),
              })
            )
            .write(');');
        })
        .write(');');
    }

    if (permission.type === 'role') {
      writer
        .blankLine()
        .writeLine(`it('should fail if the user does not have permission', async () => `)
        .block(() => {
          writer
            .write('const response = await app.inject(')
            .write(
              objectToString({
                method: quote(method),
                url,
                headers: {
                  authorization: `${quote('Bearer ')} + signJwt({scope: [], sub: 'testing'})`,
                },
              })
            )
            .write(');')
            .blankLine()
            .write('expect(response.statusCode).toBe(403);')
            .write(`expect(response.json()).toStrictEqual(`)
            .write(
              objectToString({
                code: quote('NOT_UNAUTHORIZED'),
                statusCode: '403',
                message: quote('Not authorized'),
                error: quote('Forbidden'),
              })
            )
            .write(');');
        })
        .write(');');
    }
  }

  private getRequestConfigForOperation(operation: Operation): WritableObject {
    const permission = this.config.permissions[operation];

    if (permission.type === 'authenticated') {
      return {
        headers: {
          authorization: `${quote('Bearer ')} + signJwt({scope: [], sub: 'testing'})`,
        },
      };
    }

    if (permission.type === 'role') {
      const role = getPermissionRole(this.config, permission, operation);
      return {
        headers: {
          authorization: `${quote('Bearer ')} + signJwt({scope: ['${role}'], sub: 'testing'})`,
        },
      };
    }

    return {};
  }

  private addMocks(file: SourceFile): void {
    file.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `${this.camelCaseModel}Mock`,
          type: this.pascalCaseModel,
          initializer: writer => {
            const now = Date.now();

            const mock: WritableObject = {};
            for (const [fieldName, field] of Object.entries(this.config.fields)) {
              mock[fieldName] = this.getFieldMock(fieldName, field);
            }

            writeObject(writer, {
              id: quote('id'),
              ...mock,
              createdAt: `new Date(${now})`,
              updatedAt: `new Date(${now})`,
            });
          },
        },
      ],
    });

    file.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `serialized${this.pascalCaseModel}Mock`,
          initializer: writer => {
            const dateFields: WritableObject = {};
            for (const [fieldName, field] of Object.entries(this.config.fields)) {
              if (field.type === 'date') {
                dateFields[fieldName] = `${this.camelCaseModel}Mock.${fieldName}.toISOString()`;
              }
            }

            writeObject(writer, {
              [`...${this.camelCaseModel}Mock`]: '',
              ...dateFields,
              createdAt: `${this.camelCaseModel}Mock.createdAt.toISOString()`,
              updatedAt: `${this.camelCaseModel}Mock.updatedAt.toISOString()`,
            });
          },
        },
      ],
    });
  }

  private getFieldMock(fieldName: string, field: Field): string {
    switch (field.type) {
      case 'string': {
        if (field.options) {
          return quote(field.options[0].value);
        }

        if (field.format) {
          let valuePrefix = fieldName;
          const valueSuffix = '@g.co';

          if (field.validations?.minLength) {
            while (valuePrefix.length < field.validations.minLength) {
              valuePrefix += `-${fieldName}`;
            }
          }

          if (field.validations?.maxLength) {
            // The email must have at least one character as a prefix
            if (field.validations.maxLength < valueSuffix.length + 1) {
              throw new Error(
                `Field ${fieldName} cannot have a maximum length of less than 6 because it is an email field`
              );
            }
            if (valuePrefix.length > field.validations.maxLength - valueSuffix.length) {
              valuePrefix = valuePrefix.substring(
                0,
                field.validations.maxLength - valueSuffix.length
              );
            }
          }
          return quote(`${valuePrefix}@g.co`);
        }

        let value = fieldName;
        if (field.validations?.minLength) {
          while (value.length < field.validations.minLength) {
            value += `-${fieldName}`;
          }
        }
        if (field.validations?.maxLength && value.length > field.validations.maxLength) {
          value = value.substring(0, field.validations.maxLength);
        }

        return quote(value);
      }
      case 'int': {
        return String(
          this.getRandomNumber(
            field.validations?.min ?? null,
            field.validations?.max ?? null,
            false
          )
        );
      }
      case 'double': {
        return this.getRandomNumber(
          field.validations?.min ?? null,
          field.validations?.max ?? null,
          false
        ).toFixed(2);
      }
      case 'boolean': {
        return 'true';
      }
      case 'date': {
        return `new Date(${Date.now()})`;
      }
      default: {
        throw new Error('Field type not implemented');
      }
    }
  }

  private getRandomNumber(min: number | null, max: number | null, isDouble: boolean): number {
    if (min === null || max === null) {
      let value = Math.random() * 1000;
      if (min !== null) {
        value = Math.max(value, min);
      }
      if (max !== null) {
        value = Math.min(value, max);
      }
      return isDouble ? value : Math.floor(value);
    }

    if (isDouble) {
      return Math.random() * (max - min) + min;
    }

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private addImports(file: SourceFile): void {
    // Prisma
    file.addImportDeclaration({
      moduleSpecifier: '@prisma/client',
      namedImports: [this.pascalCaseModel],
    });

    const { operations } = this.config;

    const uniqueFields = Object.values(this.config.fields).filter(f => f.unique);
    if (operations.update || operations.delete || (operations.create && uniqueFields.length)) {
      file.addImportDeclaration({
        moduleSpecifier: '@prisma/client/runtime/library',
        namedImports: ['PrismaClientKnownRequestError'],
      });
    }

    // App
    file.addImportDeclaration({
      moduleSpecifier: this.getRelativeImportPath(
        this.config.api.rootPath,
        this.config.api.appFilePath,
        file
      ),
      namedImports: ['app'],
    });

    // Jwt
    if (Object.values(this.config.permissions).some(p => p.type === 'role')) {
      file.addImportDeclaration({
        moduleSpecifier: this.getRelativeImportPath(
          this.config.api.rootPath,
          this.config.api.jwtFilePath,
          file
        ),
        namedImports: ['signJwt'],
      });
    }

    // Mocks
    file.addImportDeclaration({
      moduleSpecifier: this.getRelativeImportPath(
        this.config.api.rootPath,
        this.config.api.prismaMockFilePath,
        file
      ),
      namedImports: ['prismaMock'],
    });
  }
}
