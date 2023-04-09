import { mkdirSync, rmSync } from 'fs';
import path from 'path';
import {
  CodeBlockWriter,
  MethodSignatureStructure,
  OptionalKind,
  Project,
  StructureKind,
  VariableDeclarationKind,
  Writers,
} from 'ts-morph';
import { paramCase, pascalCase, camelCase, snakeCase } from 'change-case';

const payload = {
  extends: '',
  config: {
    rootPath: '/home/victor/projects/genco/examples/api',
    tsconfigFilePath: 'tsconfig.json',
    modulesFolderPath: 'src/modules',
    appFilePath: 'src/app.ts',
    appVariableName: 'aop',
    prismaFilePath: 'prisma/schema.prisma',
    prismaErrorUtilsFilePath: 'src/commons/prisma-error.ts',
    typeboxTypesFilePath: 'src/commons/typebox-types.ts',
    loggerPath: 'src/logger.ts',
  },
  operations: {
    findMultiple: true,
    findById: true,
    create: true,
    update: true,
    delete: true,
  },
  model: 'Person',
  fields: {
    name: {
      type: 'string' as const,
      required: true,
      unique: false,
    },
    email: {
      type: 'string' as const,
      format: 'email' as const,
      required: true,
      unique: true,
      immutable: true,
    },
    age: {
      type: 'int' as const,
      required: true,
      validations: {
        min: 18,
        max: 150,
      },
    },
    address: {
      type: 'string' as const,
      required: false,
      // unique: true,
    },
    receiveNotifications: {
      type: 'boolean' as const,
      required: true,
      default: true,
    },
  },
};

rmSync(
  path.join(
    payload.config.rootPath,
    payload.config.modulesFolderPath,
    paramCase(payload.model)
  ),
  { force: true, recursive: true }
);

// mkdirSync(
//   path.join(
//     payload.config.rootPath,
//     payload.config.modulesFolderPath,
//     paramCase(payload.model)
//   )
// );

async function run() {
  console.log('Payload', payload);

  const moduleFolderPath = path.join(
    payload.config.rootPath,
    payload.config.modulesFolderPath,
    paramCase(payload.model)
  );
  rmSync(moduleFolderPath, { force: true, recursive: true });

  const tsProject = new Project({
    tsConfigFilePath: path.join(
      payload.config.rootPath,
      payload.config.tsconfigFilePath
    ),
  });

  // index.ts
  const model = paramCase(payload.model);
  const indexFile = tsProject.createSourceFile(
    path.join(moduleFolderPath, 'index.ts')
  );
  indexFile.addExportDeclarations([{ moduleSpecifier: `./${model}.routes` }]);
  indexFile.addExportDeclarations([{ moduleSpecifier: `./${model}.schemas` }]);
  indexFile.addExportDeclarations([{ moduleSpecifier: `./${model}.service` }]);

  await indexFile.save();

  // model.routes
  const routesFile = tsProject.createSourceFile(
    path.join(moduleFolderPath, `./${model}.routes.ts`)
  );

  routesFile.addImportDeclaration({
    moduleSpecifier: 'fastify',
    namedImports: ['FastifyPluginAsync'],
  });
  routesFile.addImportDeclaration({
    moduleSpecifier: `./${model}.service`,
    namedImports: [`${pascalCase(model)}Service`],
  });
  const schemaImportDeclaration = routesFile.addImportDeclaration({
    moduleSpecifier: `./${model}.schemas`,
    namedImports: [],
  });

  schemaImportDeclaration.addNamedImports([
    `${pascalCase(model)}Response`,
    `${pascalCase(model)}ResponseSchema`,
  ]);

  if (payload.operations.findMultiple) {
    // TODO - Improve pluralization
    schemaImportDeclaration.addNamedImports([
      `Find${pascalCase(model)}sQuery`,
      `Find${pascalCase(model)}sQuerySchema`,
      `Find${pascalCase(model)}sResponse`,
      `Find${pascalCase(model)}sResponseSchema`,
    ]);
  }

  if (payload.operations.findById) {
    schemaImportDeclaration.addNamedImports([
      `Find${pascalCase(model)}Params`,
      `Find${pascalCase(model)}ParamsSchema`,
    ]);
  }

  if (payload.operations.create) {
    schemaImportDeclaration.addNamedImports([
      `Create${pascalCase(model)}`,
      `Create${pascalCase(model)}Schema`,
    ]);
  }

  if (payload.operations.update) {
    schemaImportDeclaration.addNamedImports([
      `Update${pascalCase(model)}`,
      `Update${pascalCase(model)}Schema`,
      `Update${pascalCase(model)}Params`,
      `Update${pascalCase(model)}ParamsSchema`,
    ]);
  }

  if (payload.operations.delete) {
    schemaImportDeclaration.addNamedImports([
      `Delete${pascalCase(model)}Params`,
      `Delete${pascalCase(model)}ParamsSchema`,
    ]);
  }

  routesFile.addVariableStatement({
    isExported: true,
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: `${model}Routes`,
        type: 'FastifyPluginAsync',
        initializer: writer => {
          writer.write('async server =>').block(() => {
            if (payload.operations.findMultiple) {
              writer
                .writeLine(
                  `server.get<{ Querystring:Find${pascalCase(
                    model
                  )}sQuery, Reply: Find${pascalCase(model)}sResponse }>(`
                )
                .quote('/' + paramCase(model) + 's')
                .write(',')
                .block(() => {
                  writer.write('schema:').block(() => {
                    // TODO - Improve pluralization
                    writer
                      .write('tags: [')
                      .quote(pascalCase(model) + 's')
                      .writeLine('],');
                    writer
                      .write('querystring: ')
                      .writeLine(`Find${pascalCase(model)}sQuerySchema,`);
                    writer.write('response: ').block(() => {
                      writer
                        .write('200: ')
                        .write(`Find${pascalCase(model)}sResponseSchema,`);
                    });
                  });
                })
                .writeLine(',')
                .write('async (request, reply) =>')
                .block(() => {
                  writer
                    .write('const ')
                    .write(camelCase(model) + 's')
                    .write(' = await ')
                    .write(pascalCase(model) + 'Service')
                    .write('.find')
                    .write(pascalCase(model) + 's')
                    .write('(request.query);')
                    .newLine();
                  writer
                    .write('return reply.status(200).send(')
                    .write(camelCase(model) + 's')
                    .write(');');
                })
                .writeLine(');')
                .newLine();
            }

            if (payload.operations.findById) {
              writer
                .writeLine(
                  `server.get<{ Params: Find${pascalCase(
                    model
                  )}Params, Reply: ${pascalCase(model)}Response }>(`
                )
                .quote('/' + paramCase(model) + 's/:id')
                .write(',')
                .block(() => {
                  writer.write('schema:').block(() => {
                    // TODO - Improve pluralization
                    writer
                      .write('tags: [')
                      .quote(pascalCase(model) + 's')
                      .writeLine('],');
                    writer
                      .write('params: ')
                      .writeLine(`Find${pascalCase(model)}ParamsSchema,`);
                    writer.write('response: ').block(() => {
                      writer
                        .write('200: ')
                        .write(`${pascalCase(model)}ResponseSchema,`);
                    });
                  });
                })
                .writeLine(',')
                .write('async (request, reply) =>')
                .block(() => {
                  writer
                    .write('const ')
                    .write(camelCase(model))
                    .write(' = await ')
                    .write(pascalCase(model) + 'Service')
                    .write('.find')
                    .write(pascalCase(model) + 'ById')
                    .write('(request.params.id);')
                    .newLine();
                  writer
                    .write('return reply.status(200).send(')
                    .write(camelCase(model))
                    .write(');');
                })
                .writeLine(');')
                .newLine();
            }

            if (payload.operations.create) {
              writer
                .writeLine(
                  `server.post<{ Body: Create${pascalCase(
                    model
                  )}, Reply: ${pascalCase(model)}Response }>(`
                )
                .quote('/' + paramCase(model) + 's')
                .write(',')
                .block(() => {
                  writer.write('schema:').block(() => {
                    // TODO - Improve pluralization
                    writer
                      .write('tags: [')
                      .quote(pascalCase(model) + 's')
                      .writeLine('],');
                    writer
                      .write('body: ')
                      .writeLine(`Create${pascalCase(model)}Schema,`);
                    writer.write('response: ').block(() => {
                      writer
                        .write('201: ')
                        .write(`${pascalCase(model)}ResponseSchema,`);
                    });
                  });
                })
                .writeLine(',')
                .write('async (request, reply) =>')
                .block(() => {
                  writer
                    .write('const ')
                    .write(camelCase(model))
                    .write(' = await ')
                    .write(pascalCase(model) + 'Service')
                    .write('.create')
                    .write(pascalCase(model))
                    .write('(request.body);')
                    .newLine();
                  writer
                    .write('return reply.status(201).send(')
                    .write(camelCase(model))
                    .write(');');
                })
                .writeLine(');')
                .newLine();
            }

            if (payload.operations.update) {
              writer
                .writeLine(
                  `server.patch<{ Body: Update${pascalCase(
                    model
                  )}, Params: Update${pascalCase(
                    model
                  )}Params, Reply: ${pascalCase(model)}Response }>(`
                )
                .quote('/' + paramCase(model) + 's')
                .write(',')
                .block(() => {
                  writer.write('schema:').block(() => {
                    // TODO - Improve pluralization
                    writer
                      .write('tags: [')
                      .quote(pascalCase(model) + 's')
                      .writeLine('],');
                    writer
                      .write('params: ')
                      .writeLine(`Update${pascalCase(model)}ParamsSchema,`);
                    writer
                      .write('body: ')
                      .writeLine(`Update${pascalCase(model)}Schema,`);
                    writer.write('response: ').block(() => {
                      writer
                        .write('200: ')
                        .write(`${pascalCase(model)}ResponseSchema,`);
                    });
                  });
                })
                .writeLine(',')
                .write('async (request, reply) =>')
                .block(() => {
                  writer
                    .write('const ')
                    .write(camelCase(model))
                    .write(' = await ')
                    .write(pascalCase(model) + 'Service')
                    .write('.update')
                    .write(pascalCase(model))
                    .write('(request.params.id, request.body);')
                    .newLine();
                  writer
                    .write('return reply.status(200).send(')
                    .write(camelCase(model))
                    .write(');');
                })
                .writeLine(');')
                .newLine();
            }

            if (payload.operations.delete) {
              writer
                .writeLine(
                  `server.delete<{ Params: Delete${pascalCase(
                    model
                  )}Params, Reply: ${pascalCase(model)}Response }>(`
                )
                .quote('/' + paramCase(model) + 's')
                .write(',')
                .block(() => {
                  writer.write('schema:').block(() => {
                    // TODO - Improve pluralization
                    writer
                      .write('tags: [')
                      .quote(pascalCase(model) + 's')
                      .writeLine('],');
                    writer
                      .write('params: ')
                      .writeLine(`Delete${pascalCase(model)}ParamsSchema,`);
                    writer.write('response: ').block(() => {
                      writer
                        .write('200: ')
                        .write(`${pascalCase(model)}ResponseSchema,`);
                    });
                  });
                })
                .writeLine(',')
                .write('async (request, reply) =>')
                .block(() => {
                  writer
                    .write('const ')
                    .write(camelCase(model))
                    .write(' = await ')
                    .write(pascalCase(model) + 'Service')
                    .write('.delete')
                    .write(pascalCase(model))
                    .write('(request.params.id);')
                    .newLine();
                  writer
                    .write('return reply.status(200).send(')
                    .write(camelCase(model))
                    .write(');');
                })
                .writeLine(');')
                .newLine();
            }
          });
        },
      },
    ],
  });

  await routesFile.save();

  // model.service
  const serviceFile = tsProject.createSourceFile(
    path.join(moduleFolderPath, `./${model}.service.ts`)
  );

  serviceFile.addImportDeclaration({
    moduleSpecifier: '@devoxa/prisma-relay-cursor-connection',
    namedImports: ['Connection', 'Edge', 'findManyCursorConnection'],
  });
  serviceFile.addImportDeclaration({
    moduleSpecifier: '@prisma/client',
    namedImports: [pascalCase(model)],
  });
  serviceFile.addImportDeclaration({
    // Get from config
    moduleSpecifier: '../../prisma',
    namedImports: ['prisma'],
  });

  const errorsImportDeclaration = serviceFile.addImportDeclaration({
    moduleSpecifier: './' + paramCase(model) + '.errors',
  });

  const schemasImportDeclaration = serviceFile.addImportDeclaration({
    moduleSpecifier: './' + paramCase(model) + '.schemas',
  });

  if (payload.operations.findMultiple) {
    schemasImportDeclaration.addNamedImport(`Find${pascalCase(model)}sQuery`);
  }

  if (payload.operations.findById) {
    errorsImportDeclaration.addNamedImport(
      `formatFind${pascalCase(model)}Error`
    );
  }

  if (payload.operations.create || payload.operations.update) {
    errorsImportDeclaration.addNamedImport(
      `formatCreateUpdate${pascalCase(model)}Error`
    );

    if (payload.operations.create) {
      schemasImportDeclaration.addNamedImport(`Create${pascalCase(model)}`);
    }
    if (payload.operations.update) {
      schemasImportDeclaration.addNamedImport(`Update${pascalCase(model)}`);
    }
  }

  if (payload.operations.delete) {
    errorsImportDeclaration.addNamedImport(
      `formatDelete${pascalCase(model)}Error`
    );
  }

  const serviceInterface = serviceFile.addInterface({
    name: pascalCase(model) + 'Service',
  });

  const serviceClass = serviceFile.addClass({
    name: pascalCase(model) + 'ServiceImpl',
    implements: [pascalCase(model) + 'Service'],
  });

  if (payload.operations.findMultiple) {
    serviceInterface.addMethod({
      name: 'find' + pascalCase(model) + 's',
      parameters: [
        {
          name: 'query',
          type: `Find${pascalCase(model)}sQuery`,
        },
      ],
      returnType: `Promise<Connection<${pascalCase(model)}, Edge<${pascalCase(
        model
      )}>>>`,
    });

    serviceClass.addMethod({
      name: 'find' + pascalCase(model) + 's',
      parameters: [
        {
          name: 'query',
          type: `Find${pascalCase(model)}sQuery`,
        },
      ],
      returnType: `Promise<Connection<${pascalCase(model)}, Edge<${pascalCase(
        model
      )}>>>`,
      statements: writer => {
        writer
          .write('return findManyCursorConnection(args => ')
          .write('prisma.')
          .write(camelCase(model))
          .write('.findMany({ ...args, where: { id: { in: query.ids } } }),')
          .write('() => prisma.')
          .write(camelCase(model))
          .write('.count({ where: { id: { in: query.ids } } }),')
          .write('query')
          .write(');');
      },
    });
  }

  if (payload.operations.findById) {
    serviceInterface.addMethod({
      name: 'find' + pascalCase(model) + 'ById',
      parameters: [
        {
          name: 'id',
          type: `${pascalCase(model)}['id']`,
        },
      ],
      returnType: `Promise<${pascalCase(model)}>`,
    });

    serviceClass.addMethod({
      name: 'find' + pascalCase(model) + 'ById',
      parameters: [
        {
          name: 'id',
          type: `${pascalCase(model)}['id']`,
        },
      ],
      returnType: `Promise<${pascalCase(model)}>`,
      isAsync: true,
      statements: writer => {
        writer
          .write('try')
          .block(() => {
            writer
              .write('const ')
              .write(camelCase(model))
              .write(' = await prisma.')
              .write(camelCase(model))
              .write('.findUniqueOrThrow(')
              .block(() => {
                writer.write('where: { id }');
              })
              .write(');')
              .newLine();

            writer.write('return ').write(camelCase(model)).write(';');
          })
          .write('catch (error)')
          .block(() => {
            writer
              .write('throw formatFind')
              .write(pascalCase(model))
              .write('Error(error);');
          });
      },
    });
  }

  if (payload.operations.create) {
    serviceInterface.addMethod({
      name: 'create' + pascalCase(model),
      parameters: [
        {
          name: 'data',
          type: `Create${pascalCase(model)}`,
        },
      ],
      returnType: `Promise<${pascalCase(model)}>`,
    });

    serviceClass.addMethod({
      name: 'create' + pascalCase(model),
      parameters: [
        {
          name: 'data',
          type: `Create${pascalCase(model)}`,
        },
      ],
      returnType: `Promise<${pascalCase(model)}>`,
      isAsync: true,
      statements: writer => {
        writer
          .write('try')
          .block(() => {
            writer
              .write('const ')
              .write(camelCase(model))
              .write(' = await prisma.')
              .write(camelCase(model))
              .write('.create(')
              .inlineBlock(() => {
                writer.write('data');
              })
              .write(');')
              .newLine();

            writer.write('return ').write(camelCase(model)).write(';');
          })
          .write('catch (error)')
          .block(() => {
            writer
              .write('throw formatCreateUpdate')
              .write(pascalCase(model))
              .write('Error(error);');
          });
      },
    });
  }

  if (payload.operations.update) {
    serviceInterface.addMethod({
      name: 'update' + pascalCase(model),
      parameters: [
        {
          name: 'id',
          type: `${pascalCase(model)}['id']`,
        },
        {
          name: 'data',
          type: `Update${pascalCase(model)}`,
        },
      ],
      returnType: `Promise<${pascalCase(model)}>`,
    });

    serviceClass.addMethod({
      name: 'update' + pascalCase(model),
      parameters: [
        {
          name: 'id',
          type: `${pascalCase(model)}['id']`,
        },
        {
          name: 'data',
          type: `Update${pascalCase(model)}`,
        },
      ],
      returnType: `Promise<${pascalCase(model)}>`,
      isAsync: true,
      statements: writer => {
        writer
          .write('try')
          .block(() => {
            writer
              .write('const ')
              .write(camelCase(model))
              .write(' = await prisma.')
              .write(camelCase(model))
              .write('.update(')
              .inlineBlock(() => {
                writer.writeLine('where: { id },');
                writer.writeLine('data');
              })
              .write(');')
              .newLine();

            writer.write('return ').write(camelCase(model)).write(';');
          })
          .write('catch (error)')
          .block(() => {
            writer
              .write('throw formatCreateUpdate')
              .write(pascalCase(model))
              .write('Error(error);');
          });
      },
    });
  }

  if (payload.operations.delete) {
    serviceInterface.addMethod({
      name: 'delete' + pascalCase(model),
      parameters: [
        {
          name: 'id',
          type: `${pascalCase(model)}['id']`,
        },
      ],
      returnType: `Promise<${pascalCase(model)}>`,
    });

    serviceClass.addMethod({
      name: 'delete' + pascalCase(model),
      parameters: [
        {
          name: 'id',
          type: `${pascalCase(model)}['id']`,
        },
      ],
      returnType: `Promise<${pascalCase(model)}>`,
      isAsync: true,
      statements: writer => {
        writer
          .write('try')
          .block(() => {
            writer
              .write('const ')
              .write(camelCase(model))
              .write(' = await prisma.')
              .write(camelCase(model))
              .write('.delete(')
              .inlineBlock(() => {
                writer.writeLine('where: { id },');
              })
              .write(');')
              .newLine();

            writer.write('return ').write(camelCase(model)).write(';');
          })
          .write('catch (error)')
          .block(() => {
            writer
              .write('throw formatDelete')
              .write(pascalCase(model))
              .write('Error(error);');
          });
      },
    });
  }

  serviceFile.addVariableStatement({
    isExported: true,
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: pascalCase(model) + 'Service',
        initializer: `new ${pascalCase(model)}ServiceImpl()`,
      },
    ],
  });

  await serviceFile.save();

  // model.schemas
  const schemasFile = tsProject.createSourceFile(
    path.join(moduleFolderPath, `./${model}.schemas.ts`)
  );

  schemasFile.addImportDeclaration({
    moduleSpecifier: '@sinclair/typebox',
    namedImports: ['Static', 'Type'],
  });
  schemasFile.addImportDeclaration({
    // moduleSpecifier: payload.config.typeboxTypesFilePath,
    moduleSpecifier: '../../common/typebox-types',
    namedImports: ['DateType'],
  });

  type ObjectToWrite = Record<
    string,
    string | Record<string, string | Record<string, string>>
  >;

  const writeObject = (writer: CodeBlockWriter, obj: ObjectToWrite) => {
    writer.block(() => {
      for (const [key, value] of Object.entries(obj)) {
        writer.write(key).write(': ');
        if (typeof value === 'string') {
          writer.write(value);
        } else {
          writeObject(writer, value);
        }

        writer.write(',');
      }
    });
  };

  type Fields = typeof payload['fields'];
  type Field = Fields[keyof Fields];
  function getFieldSchema(field: Field, response: boolean): string {
    if (field.type === 'string') {
      let schema = `Type.String(`;
      if ('format' in field) {
        if (field.format === 'email') {
          schema += '{ format: "email"}';
        }
      }
      schema += ')';

      if (field.required === false) {
        if (response) {
          schema = `Type.Union([Type.Null(), ${schema}])`;
        } else {
          schema = `Type.Optional(${schema})`;
        }
      }

      return schema;
    }

    if (field.type === 'boolean') {
      let schema = `Type.Boolean(`;
      if (field.default !== undefined) {
        schema += `{ default: ${field.default}}`;
      }
      schema += ')';

      if (field.required === false) {
        if (response) {
          schema = `Type.Union([Type.Null(), ${schema}])`;
        } else {
          schema = `Type.Optional(${schema})`;
        }
      }

      return schema;
    }

    if (field.type === 'int') {
      let schema = `Type.Integer(`;
      if (field.validations) {
        schema += '{';

        if (field.validations.min !== undefined) {
          schema += 'minimum: ' + field.validations.min + ',';
        }
        if (field.validations.max !== undefined) {
          schema += 'maximum: ' + field.validations.max;
        }

        schema += '}';
      }
      schema += ')';

      if (field.required === false) {
        if (response) {
          schema = `Type.Union([Type.Null(), ${schema}])`;
        } else {
          schema = `Type.Optional(${schema})`;
        }
      }

      return schema;
    }

    throw new Error('Field type not implemented');
  }

  schemasFile.addVariableStatement({
    isExported: true,
    declarationKind: VariableDeclarationKind.Const,
    leadingTrivia: '// Common',
    trailingTrivia: '\n\n',
    declarations: [
      {
        name: pascalCase(model) + 'ResponseSchema',
        initializer: writer => {
          writer.write('Type.Object(');

          const objectToWrite: ObjectToWrite = {
            id: 'Type.String()',
          };

          for (const [fieldName, field] of Object.entries(payload.fields)) {
            objectToWrite[fieldName] = getFieldSchema(field, true);
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

  schemasFile
    .addTypeAlias({
      isExported: true,
      name: pascalCase(model) + 'Response',
      type: `Static<typeof ${pascalCase(model)}ResponseSchema>`,
    })
    .prependWhitespace(writer => writer.newLine());

  if (payload.operations.findMultiple) {
    schemasFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      leadingTrivia: '// Find ' + pascalCase(model) + 's',
      trailingTrivia: '\n\n',
      declarations: [
        {
          name: 'Find' + pascalCase(model) + 'sQuerySchema',
          initializer: writer => {
            writer.write('Type.Object(');
            writeObject(writer, {
              ids: 'Type.Optional(Type.Array(Type.String()))',
              after: 'Type.Optional(Type.String())',
              first:
                'Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 }))',
            });
            writer.write(')');
          },
        },
      ],
    });

    schemasFile
      .addTypeAlias({
        isExported: true,
        name: 'Find' + pascalCase(model) + 'sQuery',
        type: `Static<typeof Find${pascalCase(model)}sQuerySchema>`,
      })
      .prependWhitespace(writer => writer.newLine());

    schemasFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      trailingTrivia: '\n\n',
      declarations: [
        {
          name: 'Find' + pascalCase(model) + 'sResponseSchema',
          initializer: writer => {
            writer.write('Type.Object(');
            writeObject(writer, {
              edges: `Type.Array(
                Type.Object({
                  cursor: Type.String(),
                  node: ${pascalCase(model)}ResponseSchema,
                })
              )`,
              totalCount: 'Type.Integer()',
              pageInfo: `Type.Object({
                hasNextPage: Type.Boolean(),
                hasPreviousPage: Type.Boolean(),
                startCursor: Type.Optional(Type.String()),
                endCursor: Type.Optional(Type.String()),
              })`,
            });
            writer.write(')');
          },
        },
      ],
    });

    schemasFile
      .addTypeAlias({
        isExported: true,
        name: 'Find' + pascalCase(model) + 'sResponse',
        type: `Static<typeof Find${pascalCase(model)}sResponseSchema>`,
      })
      .prependWhitespace(writer => writer.newLine());
  }

  if (payload.operations.findById) {
    schemasFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      leadingTrivia: '// Find ' + pascalCase(model) + ' by id',
      trailingTrivia: '\n\n',
      declarations: [
        {
          name: 'Find' + pascalCase(model) + 'ParamsSchema',
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

    schemasFile
      .addTypeAlias({
        isExported: true,
        name: 'Find' + pascalCase(model) + 'Params',
        type: `Static<typeof Find${pascalCase(model)}ParamsSchema>`,
      })
      .prependWhitespace(writer => writer.newLine());
  }

  if (payload.operations.create) {
    schemasFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      leadingTrivia: '// Create ' + pascalCase(model),
      trailingTrivia: '\n\n',
      declarations: [
        {
          name: 'Create' + pascalCase(model) + 'Schema',
          initializer: writer => {
            writer.write('Type.Object(');

            const objectToWrite: ObjectToWrite = {};
            for (const [fieldName, field] of Object.entries(payload.fields)) {
              objectToWrite[fieldName] = getFieldSchema(field, false);
            }

            writeObject(writer, objectToWrite);
            writer.write(')');
          },
        },
      ],
    });

    schemasFile
      .addTypeAlias({
        isExported: true,
        name: 'Create' + pascalCase(model) + '',
        type: `Static<typeof Create${pascalCase(model)}Schema>`,
      })
      .prependWhitespace(writer => writer.newLine());
  }

  if (payload.operations.update) {
    schemasFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      leadingTrivia: '// Update ' + pascalCase(model),
      declarations: [
        {
          name: 'Update' + pascalCase(model) + 'Schema',
          initializer: writer => {
            writer.write('Type.Object(');

            const objectToWrite: ObjectToWrite = {};
            for (const [fieldName, field] of Object.entries(payload.fields)) {
              if (!('immutable' in field) || field.immutable === false) {
                objectToWrite[fieldName] = getFieldSchema(field, false);
              }
            }

            writeObject(writer, objectToWrite);
            writer.write(')');
          },
        },
      ],
    });

    schemasFile
      .addTypeAlias({
        isExported: true,
        name: 'Update' + pascalCase(model) + '',
        type: `Static<typeof Update${pascalCase(model)}Schema>`,
      })
      .prependWhitespace(writer => writer.newLine());

    schemasFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: 'Update' + pascalCase(model) + 'ParamsSchema',
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

    schemasFile
      .addTypeAlias({
        isExported: true,
        name: 'Update' + pascalCase(model) + 'Params',
        type: `Static<typeof Update${pascalCase(model)}ParamsSchema>`,
      })
      .prependWhitespace(writer => writer.newLine());
  }

  if (payload.operations.delete) {
    schemasFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      leadingTrivia: '// Delete ' + pascalCase(model),
      declarations: [
        {
          name: 'Delete' + pascalCase(model) + 'ParamsSchema',
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

    schemasFile
      .addTypeAlias({
        isExported: true,
        name: 'Delete' + pascalCase(model) + 'Params',
        type: `Static<typeof Delete${pascalCase(model)}ParamsSchema>`,
      })
      .prependWhitespace(writer => writer.newLine());
  }

  await schemasFile.save();

  // model.errors
  const errorsFile = tsProject.createSourceFile(
    path.join(moduleFolderPath, `./${model}.errors.ts`)
  );

  errorsFile.addImportDeclaration({
    moduleSpecifier: '@fastify/error',
    defaultImport: 'createError',
    namedImports: ['FastifyError'],
  });
  errorsFile.addImportDeclaration({
    moduleSpecifier: '../../common/prisma-error',
    namedImports: ['isPrismaError'],
  });
  errorsFile.addImportDeclaration({
    moduleSpecifier: '../../logger',
    namedImports: ['logger'],
  });

  errorsFile.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: 'Unexpected' + pascalCase(model) + 'Error',
        initializer: writer => {
          writer
            .write('createError(')
            .quote('UNEXPECTED_' + snakeCase(model).toUpperCase() + '_ERROR')
            .write(',')
            .quote('Unexpected ' + pascalCase(model) + ' error')
            .write(',')
            .write('500)');
        },
      },
    ],
  });

  if (
    payload.operations.findById ||
    payload.operations.create ||
    payload.operations.update ||
    payload.operations.delete
  ) {
    errorsFile.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: pascalCase(model) + 'NotFoundError',
          initializer: writer => {
            writer
              .write('createError(')
              .quote(snakeCase(model).toUpperCase() + '_NOT_FOUND')
              .write(',')
              .quote(pascalCase(model) + ' not found')
              .write(',')
              .write('404)');
          },
        },
      ],
    });

    if (payload.operations.create || payload.operations.update) {
      for (const [fieldName, field] of Object.entries(payload.fields)) {
        if ('unique' in field && field.unique) {
          errorsFile.addVariableStatement({
            declarationKind: VariableDeclarationKind.Const,
            declarations: [
              {
                name: pascalCase(model) + pascalCase(fieldName) + 'NotUnique',
                initializer: writer => {
                  writer
                    .write('createError(')
                    .quote(
                      snakeCase(model).toUpperCase() +
                        '_' +
                        snakeCase(fieldName).toUpperCase() +
                        '_NOT_UNIQUE'
                    )
                    .write(',')
                    .quote(
                      pascalCase(model) +
                        ' ' +
                        camelCase(fieldName) +
                        ' is not unique'
                    )
                    .write(',')
                    .write('400)');
                },
              },
            ],
          });
        }
      }
    }
  }

  if (
    payload.operations.findById ||
    payload.operations.create ||
    payload.operations.update ||
    payload.operations.delete
  ) {
    errorsFile.addFunction({
      name: 'formatFind' + pascalCase(model) + 'Error',
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
          .write(
            `if (error instanceof Error && error.name === 'NotFoundError')`
          )
          .block(() => {
            writer.write(`return new ${pascalCase(model)}NotFoundError();`);
          });

        writer.writeLine(
          `logger.error('Unexpected error while finding ${pascalCase(
            model
          )}', error);`
        );
        writer.writeLine(`return new Unexpected${pascalCase(model)}Error();`);
      },
    });
  }

  if (payload.operations.create || payload.operations.update) {
    errorsFile.addFunction({
      name: 'formatCreateUpdate' + pascalCase(model) + 'Error',
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
          writer.writeLine('// No ' + camelCase(model) + ' found');
          writer.write(`if (error.code === 'P2025')`).block(() => {
            writer.write(`return new ${pascalCase(model)}NotFoundError();`);
          });

          // TODO- Add consstraint violation
        });

        writer.writeLine(
          `logger.error('Unexpected error while creating/updating ${pascalCase(
            model
          )}', error);`
        );
        writer.writeLine(`return new Unexpected${pascalCase(model)}Error();`);
      },
    });
  }

  if (payload.operations.delete) {
    errorsFile.addFunction({
      name: 'formatDelete' + pascalCase(model) + 'Error',
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
          writer.writeLine('// No ' + camelCase(model) + ' found');
          writer.write(`if (error.code === 'P2025')`).block(() => {
            writer.write(`return new ${pascalCase(model)}NotFoundError();`);
          });
        });

        writer.writeLine(
          `logger.error('Unexpected error while deleting ${pascalCase(
            model
          )}', error);`
        );
        writer.writeLine(`return new Unexpected${pascalCase(model)}Error();`);
      },
    });
  }

  await errorsFile.save();

  console.log('Done');
}

run();
