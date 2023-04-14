import { existsSync, mkdirSync, rmSync } from 'fs';
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
import { program } from 'commander';

import { Config, configSchema } from './config.schemas';
import { readFile, rm } from 'fs/promises';
import { ApiGenerator } from './api/api-generator';

async function run() {
  // Parse the app params
  program
    .name('GenCo - Node/React code generator!')
    .requiredOption('-c, --configPath <string>', 'config file')
    .parse();

  const { configPath } = program.opts() as { configPath: string };

  // Validate and load the app params
  const realConfigPath = path.isAbsolute(configPath)
    ? configPath
    : path.join(process.cwd(), configPath);

  if (existsSync(realConfigPath) === false) {
    console.error(`Config file ${realConfigPath} does not exists`);
    return;
  }

  const rawConfigBuffer = await readFile(realConfigPath, 'utf-8');
  const rawConfig = JSON.parse(rawConfigBuffer.toString());
  const parsedConfig = configSchema.safeParse(rawConfig);
  if (parsedConfig.success === false) {
    // TODO - Formar error
    console.error('Invalid config', parsedConfig.error);
    return;
  }

  // Start the generator
  const apiGenerator = new ApiGenerator(parsedConfig.data);
  await apiGenerator.generate();
  // const config = parsedConfig.data;
  // const moduleFolderPath = path.join(
  //   config.backend.rootPath,
  //   config.backend.modulesFolderPath,
  //   paramCase(config.model)
  // );

  // // Delete existing module
  // if (config.overwrite) {
  //   await rm(moduleFolderPath, { force: true, recursive: true });
  // }

  // const tsProject = new Project({
  //   tsConfigFilePath: path.join(
  //     payload.config.rootPath,
  //     payload.config.tsconfigFilePath
  //   ),
  // });

  // // index.ts
  // const model = paramCase(payload.model);
  // const indexFile = tsProject.createSourceFile(
  //   path.join(moduleFolderPath, 'index.ts')
  // );
  // indexFile.addExportDeclarations([{ moduleSpecifier: `./${model}.routes` }]);
  // indexFile.addExportDeclarations([{ moduleSpecifier: `./${model}.schemas` }]);
  // indexFile.addExportDeclarations([{ moduleSpecifier: `./${model}.service` }]);

  // await indexFile.save();

  // // model.service
  // const serviceFile = tsProject.createSourceFile(
  //   path.join(moduleFolderPath, `./${model}.service.ts`)
  // );

  // serviceFile.addImportDeclaration({
  //   moduleSpecifier: '@devoxa/prisma-relay-cursor-connection',
  //   namedImports: ['Connection', 'Edge', 'findManyCursorConnection'],
  // });
  // serviceFile.addImportDeclaration({
  //   moduleSpecifier: '@prisma/client',
  //   namedImports: [pascalCase(model)],
  // });
  // serviceFile.addImportDeclaration({
  //   // Get from config
  //   moduleSpecifier: '../../prisma',
  //   namedImports: ['prisma'],
  // });

  // const errorsImportDeclaration = serviceFile.addImportDeclaration({
  //   moduleSpecifier: './' + paramCase(model) + '.errors',
  // });

  // const schemasImportDeclaration = serviceFile.addImportDeclaration({
  //   moduleSpecifier: './' + paramCase(model) + '.schemas',
  // });

  // if (payload.operations.findMultiple) {
  //   schemasImportDeclaration.addNamedImport(`Find${pascalCase(model)}sQuery`);
  // }

  // if (payload.operations.findById) {
  //   errorsImportDeclaration.addNamedImport(
  //     `formatFind${pascalCase(model)}Error`
  //   );
  // }

  // if (payload.operations.create || payload.operations.update) {
  //   errorsImportDeclaration.addNamedImport(
  //     `formatCreateUpdate${pascalCase(model)}Error`
  //   );

  //   if (payload.operations.create) {
  //     schemasImportDeclaration.addNamedImport(`Create${pascalCase(model)}`);
  //   }
  //   if (payload.operations.update) {
  //     schemasImportDeclaration.addNamedImport(`Update${pascalCase(model)}`);
  //   }
  // }

  // if (payload.operations.delete) {
  //   errorsImportDeclaration.addNamedImport(
  //     `formatDelete${pascalCase(model)}Error`
  //   );
  // }

  // const serviceInterface = serviceFile.addInterface({
  //   name: pascalCase(model) + 'Service',
  // });

  // const serviceClass = serviceFile.addClass({
  //   name: pascalCase(model) + 'ServiceImpl',
  //   implements: [pascalCase(model) + 'Service'],
  // });

  // if (payload.operations.findMultiple) {
  //   serviceInterface.addMethod({
  //     name: 'find' + pascalCase(model) + 's',
  //     parameters: [
  //       {
  //         name: 'query',
  //         type: `Find${pascalCase(model)}sQuery`,
  //       },
  //     ],
  //     returnType: `Promise<Connection<${pascalCase(model)}, Edge<${pascalCase(
  //       model
  //     )}>>>`,
  //   });

  //   serviceClass.addMethod({
  //     name: 'find' + pascalCase(model) + 's',
  //     parameters: [
  //       {
  //         name: 'query',
  //         type: `Find${pascalCase(model)}sQuery`,
  //       },
  //     ],
  //     returnType: `Promise<Connection<${pascalCase(model)}, Edge<${pascalCase(
  //       model
  //     )}>>>`,
  //     statements: writer => {
  //       writer
  //         .write('return findManyCursorConnection(args => ')
  //         .write('prisma.')
  //         .write(camelCase(model))
  //         .write('.findMany({ ...args, where: { id: { in: query.ids } } }),')
  //         .write('() => prisma.')
  //         .write(camelCase(model))
  //         .write('.count({ where: { id: { in: query.ids } } }),')
  //         .write('query')
  //         .write(');');
  //     },
  //   });
  // }

  // if (payload.operations.findById) {
  //   serviceInterface.addMethod({
  //     name: 'find' + pascalCase(model) + 'ById',
  //     parameters: [
  //       {
  //         name: 'id',
  //         type: `${pascalCase(model)}['id']`,
  //       },
  //     ],
  //     returnType: `Promise<${pascalCase(model)}>`,
  //   });

  //   serviceClass.addMethod({
  //     name: 'find' + pascalCase(model) + 'ById',
  //     parameters: [
  //       {
  //         name: 'id',
  //         type: `${pascalCase(model)}['id']`,
  //       },
  //     ],
  //     returnType: `Promise<${pascalCase(model)}>`,
  //     isAsync: true,
  //     statements: writer => {
  //       writer
  //         .write('try')
  //         .block(() => {
  //           writer
  //             .write('const ')
  //             .write(camelCase(model))
  //             .write(' = await prisma.')
  //             .write(camelCase(model))
  //             .write('.findUniqueOrThrow(')
  //             .block(() => {
  //               writer.write('where: { id }');
  //             })
  //             .write(');')
  //             .newLine();

  //           writer.write('return ').write(camelCase(model)).write(';');
  //         })
  //         .write('catch (error)')
  //         .block(() => {
  //           writer
  //             .write('throw formatFind')
  //             .write(pascalCase(model))
  //             .write('Error(error);');
  //         });
  //     },
  //   });
  // }

  // if (payload.operations.create) {
  //   serviceInterface.addMethod({
  //     name: 'create' + pascalCase(model),
  //     parameters: [
  //       {
  //         name: 'data',
  //         type: `Create${pascalCase(model)}`,
  //       },
  //     ],
  //     returnType: `Promise<${pascalCase(model)}>`,
  //   });

  //   serviceClass.addMethod({
  //     name: 'create' + pascalCase(model),
  //     parameters: [
  //       {
  //         name: 'data',
  //         type: `Create${pascalCase(model)}`,
  //       },
  //     ],
  //     returnType: `Promise<${pascalCase(model)}>`,
  //     isAsync: true,
  //     statements: writer => {
  //       writer
  //         .write('try')
  //         .block(() => {
  //           writer
  //             .write('const ')
  //             .write(camelCase(model))
  //             .write(' = await prisma.')
  //             .write(camelCase(model))
  //             .write('.create(')
  //             .inlineBlock(() => {
  //               writer.write('data');
  //             })
  //             .write(');')
  //             .newLine();

  //           writer.write('return ').write(camelCase(model)).write(';');
  //         })
  //         .write('catch (error)')
  //         .block(() => {
  //           writer
  //             .write('throw formatCreateUpdate')
  //             .write(pascalCase(model))
  //             .write('Error(error);');
  //         });
  //     },
  //   });
  // }

  // if (payload.operations.update) {
  //   serviceInterface.addMethod({
  //     name: 'update' + pascalCase(model),
  //     parameters: [
  //       {
  //         name: 'id',
  //         type: `${pascalCase(model)}['id']`,
  //       },
  //       {
  //         name: 'data',
  //         type: `Update${pascalCase(model)}`,
  //       },
  //     ],
  //     returnType: `Promise<${pascalCase(model)}>`,
  //   });

  //   serviceClass.addMethod({
  //     name: 'update' + pascalCase(model),
  //     parameters: [
  //       {
  //         name: 'id',
  //         type: `${pascalCase(model)}['id']`,
  //       },
  //       {
  //         name: 'data',
  //         type: `Update${pascalCase(model)}`,
  //       },
  //     ],
  //     returnType: `Promise<${pascalCase(model)}>`,
  //     isAsync: true,
  //     statements: writer => {
  //       writer
  //         .write('try')
  //         .block(() => {
  //           writer
  //             .write('const ')
  //             .write(camelCase(model))
  //             .write(' = await prisma.')
  //             .write(camelCase(model))
  //             .write('.update(')
  //             .inlineBlock(() => {
  //               writer.writeLine('where: { id },');
  //               writer.writeLine('data');
  //             })
  //             .write(');')
  //             .newLine();

  //           writer.write('return ').write(camelCase(model)).write(';');
  //         })
  //         .write('catch (error)')
  //         .block(() => {
  //           writer
  //             .write('throw formatCreateUpdate')
  //             .write(pascalCase(model))
  //             .write('Error(error);');
  //         });
  //     },
  //   });
  // }

  // if (payload.operations.delete) {
  //   serviceInterface.addMethod({
  //     name: 'delete' + pascalCase(model),
  //     parameters: [
  //       {
  //         name: 'id',
  //         type: `${pascalCase(model)}['id']`,
  //       },
  //     ],
  //     returnType: `Promise<${pascalCase(model)}>`,
  //   });

  //   serviceClass.addMethod({
  //     name: 'delete' + pascalCase(model),
  //     parameters: [
  //       {
  //         name: 'id',
  //         type: `${pascalCase(model)}['id']`,
  //       },
  //     ],
  //     returnType: `Promise<${pascalCase(model)}>`,
  //     isAsync: true,
  //     statements: writer => {
  //       writer
  //         .write('try')
  //         .block(() => {
  //           writer
  //             .write('const ')
  //             .write(camelCase(model))
  //             .write(' = await prisma.')
  //             .write(camelCase(model))
  //             .write('.delete(')
  //             .inlineBlock(() => {
  //               writer.writeLine('where: { id },');
  //             })
  //             .write(');')
  //             .newLine();

  //           writer.write('return ').write(camelCase(model)).write(';');
  //         })
  //         .write('catch (error)')
  //         .block(() => {
  //           writer
  //             .write('throw formatDelete')
  //             .write(pascalCase(model))
  //             .write('Error(error);');
  //         });
  //     },
  //   });
  // }

  // serviceFile.addVariableStatement({
  //   isExported: true,
  //   declarationKind: VariableDeclarationKind.Const,
  //   declarations: [
  //     {
  //       name: pascalCase(model) + 'Service',
  //       initializer: `new ${pascalCase(model)}ServiceImpl()`,
  //     },
  //   ],
  // });

  // await serviceFile.save();

  // // model.errors
  // const errorsFile = tsProject.createSourceFile(
  //   path.join(moduleFolderPath, `./${model}.errors.ts`)
  // );

  // errorsFile.addImportDeclaration({
  //   moduleSpecifier: '@fastify/error',
  //   defaultImport: 'createError',
  //   namedImports: ['FastifyError'],
  // });
  // errorsFile.addImportDeclaration({
  //   moduleSpecifier: '../../common/prisma-error',
  //   namedImports: ['isPrismaError'],
  // });
  // errorsFile.addImportDeclaration({
  //   moduleSpecifier: '../../logger',
  //   namedImports: ['logger'],
  // });

  // errorsFile.addVariableStatement({
  //   declarationKind: VariableDeclarationKind.Const,
  //   declarations: [
  //     {
  //       name: 'Unexpected' + pascalCase(model) + 'Error',
  //       initializer: writer => {
  //         writer
  //           .write('createError(')
  //           .quote('UNEXPECTED_' + snakeCase(model).toUpperCase() + '_ERROR')
  //           .write(',')
  //           .quote('Unexpected ' + pascalCase(model) + ' error')
  //           .write(',')
  //           .write('500)');
  //       },
  //     },
  //   ],
  // });

  // if (
  //   payload.operations.findById ||
  //   payload.operations.create ||
  //   payload.operations.update ||
  //   payload.operations.delete
  // ) {
  //   errorsFile.addVariableStatement({
  //     declarationKind: VariableDeclarationKind.Const,
  //     declarations: [
  //       {
  //         name: pascalCase(model) + 'NotFoundError',
  //         initializer: writer => {
  //           writer
  //             .write('createError(')
  //             .quote(snakeCase(model).toUpperCase() + '_NOT_FOUND')
  //             .write(',')
  //             .quote(pascalCase(model) + ' not found')
  //             .write(',')
  //             .write('404)');
  //         },
  //       },
  //     ],
  //   });

  //   if (payload.operations.create || payload.operations.update) {
  //     for (const [fieldName, field] of Object.entries(payload.fields)) {
  //       if ('unique' in field && field.unique) {
  //         errorsFile.addVariableStatement({
  //           declarationKind: VariableDeclarationKind.Const,
  //           declarations: [
  //             {
  //               name: pascalCase(model) + pascalCase(fieldName) + 'NotUnique',
  //               initializer: writer => {
  //                 writer
  //                   .write('createError(')
  //                   .quote(
  //                     snakeCase(model).toUpperCase() +
  //                       '_' +
  //                       snakeCase(fieldName).toUpperCase() +
  //                       '_NOT_UNIQUE'
  //                   )
  //                   .write(',')
  //                   .quote(
  //                     pascalCase(model) +
  //                       ' ' +
  //                       camelCase(fieldName) +
  //                       ' is not unique'
  //                   )
  //                   .write(',')
  //                   .write('400)');
  //               },
  //             },
  //           ],
  //         });
  //       }
  //     }
  //   }
  // }

  // if (
  //   payload.operations.findById ||
  //   payload.operations.create ||
  //   payload.operations.update ||
  //   payload.operations.delete
  // ) {
  //   errorsFile.addFunction({
  //     name: 'formatFind' + pascalCase(model) + 'Error',
  //     parameters: [
  //       {
  //         name: 'error',
  //         type: 'unknown',
  //       },
  //     ],
  //     returnType: 'FastifyError',
  //     isExported: true,
  //     statements: writer => {
  //       writer
  //         .write(
  //           `if (error instanceof Error && error.name === 'NotFoundError')`
  //         )
  //         .block(() => {
  //           writer.write(`return new ${pascalCase(model)}NotFoundError();`);
  //         });

  //       writer.writeLine(
  //         `logger.error('Unexpected error while finding ${pascalCase(
  //           model
  //         )}', error);`
  //       );
  //       writer.writeLine(`return new Unexpected${pascalCase(model)}Error();`);
  //     },
  //   });
  // }

  // if (payload.operations.create || payload.operations.update) {
  //   errorsFile.addFunction({
  //     name: 'formatCreateUpdate' + pascalCase(model) + 'Error',
  //     parameters: [
  //       {
  //         name: 'error',
  //         type: 'unknown',
  //       },
  //     ],
  //     returnType: 'FastifyError',
  //     isExported: true,
  //     statements: writer => {
  //       writer.write(`if (isPrismaError(error))`).block(() => {
  //         writer.writeLine('// No ' + camelCase(model) + ' found');
  //         writer.write(`if (error.code === 'P2025')`).block(() => {
  //           writer.write(`return new ${pascalCase(model)}NotFoundError();`);
  //         });

  //         // TODO- Add consstraint violation
  //       });

  //       writer.writeLine(
  //         `logger.error('Unexpected error while creating/updating ${pascalCase(
  //           model
  //         )}', error);`
  //       );
  //       writer.writeLine(`return new Unexpected${pascalCase(model)}Error();`);
  //     },
  //   });
  // }

  // if (payload.operations.delete) {
  //   errorsFile.addFunction({
  //     name: 'formatDelete' + pascalCase(model) + 'Error',
  //     parameters: [
  //       {
  //         name: 'error',
  //         type: 'unknown',
  //       },
  //     ],
  //     returnType: 'FastifyError',
  //     isExported: true,
  //     statements: writer => {
  //       writer.write(`if (isPrismaError(error))`).block(() => {
  //         writer.writeLine('// No ' + camelCase(model) + ' found');
  //         writer.write(`if (error.code === 'P2025')`).block(() => {
  //           writer.write(`return new ${pascalCase(model)}NotFoundError();`);
  //         });
  //       });

  //       writer.writeLine(
  //         `logger.error('Unexpected error while deleting ${pascalCase(
  //           model
  //         )}', error);`
  //       );
  //       writer.writeLine(`return new Unexpected${pascalCase(model)}Error();`);
  //     },
  //   });
  // }

  // await errorsFile.save();

  console.log('Done');
}

run();
