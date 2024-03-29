import path from 'path';
import { CodeBlockWriter, SourceFile } from 'ts-morph';

import { getPermissionRole } from '../common/roles';
import { Config, Operation } from '../config.schemas';
import { camelCase, kebabCase, pascalCase, quote } from '../utils/string.utils';
import { objectToString, WritableObject, writeObject } from '../utils/writer.utils';

export class RoutesGenerator {
  private readonly pascalCaseModel: string;
  private readonly kebabCaseModel: string;
  private readonly camelCaseModel: string;
  private readonly pluralPascalCaseModel: string;
  private readonly pluralKebabCaseModel: string;
  private readonly pluralCamelCaseModel: string;

  constructor(private config: Config) {
    this.pascalCaseModel = pascalCase(this.config.model);
    this.kebabCaseModel = kebabCase(this.config.model);
    this.camelCaseModel = camelCase(this.config.model);
    this.pluralPascalCaseModel = pascalCase(this.pascalCaseModel, true);
    this.pluralKebabCaseModel = kebabCase(this.kebabCaseModel, true);
    this.pluralCamelCaseModel = camelCase(this.config.model, true);
  }

  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addRoutes(file);
  }

  private addRoutes(file: SourceFile): void {
    file.addFunction({
      isExported: true,
      name: `get${this.pascalCaseModel}Routes`,
      parameters: [
        {
          name: `${this.camelCaseModel}Service`,
          type: `${this.pascalCaseModel}Service`,
        },
      ],
      returnType: 'FastifyPluginAsync',
      statements: writer => {
        writer.write('return async server =>').block(() => {
          if (this.config.operations.findMultiple) {
            this.addFindMultipleRoute(writer);
          }

          if (this.config.operations.findById) {
            this.addFindByIdRoute(writer);
          }

          if (this.config.operations.create) {
            this.addCreateRoute(writer);
          }

          if (this.config.operations.update) {
            this.addUpdateRoute(writer);
          }

          if (this.config.operations.delete) {
            this.addDeleteRoute(writer);
          }
        });
      },
    });
  }

  private addFindMultipleRoute(writer: CodeBlockWriter): void {
    writer.write('server.get<');
    writeObject(writer, {
      Querystring: `Find${this.pluralPascalCaseModel}Query`,
      Reply: `Find${this.pluralPascalCaseModel}Response`,
    });
    writer.write('>(').quote(`/${this.pluralKebabCaseModel}`).write(',');
    writeObject(writer, {
      schema: {
        tags: `['${this.pascalCaseModel}']`,
        querystring: `Find${this.pluralPascalCaseModel}QuerySchema`,
        response: {
          200: `Find${this.pluralPascalCaseModel}ResponseSchema`,
        },
      },
      onRequest: `checkPermission(${this.serializePermission('findMultiple')})`,
    });
    writer
      .write(',')
      .write('async (request, reply) =>')
      .block(() => {
        writer
          .write('const ')
          .write(this.pluralCamelCaseModel)
          .write(' = await ')
          .write(`${this.camelCaseModel}Service`)
          .write('.find')
          .write(this.pluralPascalCaseModel)
          .write('(request.query);')
          .newLine();
        writer.write('return reply.status(200).send(').write(this.pluralCamelCaseModel).write(');');
      })
      .writeLine(');')
      .newLine();
  }

  private addFindByIdRoute(writer: CodeBlockWriter): void {
    writer.write('server.get<');
    writeObject(writer, {
      Params: `${this.pascalCaseModel}IdParams`,
      Reply: `${this.pascalCaseModel}Response`,
    });
    writer.write('>(').quote(`/${this.pluralKebabCaseModel}/:id`).write(',');
    writeObject(writer, {
      schema: {
        tags: `['${this.pascalCaseModel}']`,
        params: `${this.pascalCaseModel}IdParamsSchema`,
        response: {
          200: `${this.pascalCaseModel}ResponseSchema`,
        },
      },
      onRequest: `checkPermission(${this.serializePermission('findById')})`,
    });
    writer
      .write(',')
      .write('async (request, reply) =>')
      .block(() => {
        writer
          .write('const ')
          .write(this.camelCaseModel)
          .write(' = await ')
          .write(`${this.camelCaseModel}Service`)
          .write('.find')
          .write(this.pascalCaseModel)
          .write('ById(request.params.id);')
          .newLine();
        writer.write('return reply.status(200).send(').write(this.camelCaseModel).write(');');
      })
      .writeLine(');')
      .newLine();
  }

  private addCreateRoute(writer: CodeBlockWriter): void {
    writer.write('server.post<');
    writeObject(writer, {
      Body: `Create${this.pascalCaseModel}`,
      Reply: `${this.pascalCaseModel}Response`,
    });
    writer.write('>(').quote(`/${this.pluralKebabCaseModel}`).write(',');
    writeObject(writer, {
      schema: {
        tags: `['${this.pascalCaseModel}']`,
        body: `Create${this.pascalCaseModel}Schema`,
        response: {
          '201': `${this.pascalCaseModel}ResponseSchema`,
        },
      },
      onRequest: `checkPermission(${this.serializePermission('create')})`,
    });
    writer
      .write(',')
      .write('async (request, reply) =>')
      .block(() => {
        writer
          .write('const ')
          .write(this.camelCaseModel)
          .write(' = await ')
          .write(`${this.camelCaseModel}Service`)
          .write('.create')
          .write(this.pascalCaseModel)
          .write('(request.body);')
          .newLine();
        writer.write('return reply.status(201).send(').write(this.camelCaseModel).write(');');
      })
      .writeLine(');')
      .newLine();
  }

  private addUpdateRoute(writer: CodeBlockWriter): void {
    writer.write('server.patch<');
    writeObject(writer, {
      Body: `Update${this.pascalCaseModel}`,
      Params: `${this.pascalCaseModel}IdParams`,
      Reply: `${this.pascalCaseModel}Response`,
    });
    writer.write('>(').quote(`/${this.pluralKebabCaseModel}/:id`).write(',');
    writeObject(writer, {
      schema: {
        tags: `['${this.pascalCaseModel}']`,
        body: `Update${this.pascalCaseModel}Schema`,
        params: `${this.pascalCaseModel}IdParamsSchema`,
        response: {
          '200': `${this.pascalCaseModel}ResponseSchema`,
        },
      },
      onRequest: `checkPermission(${this.serializePermission('update')})`,
    });
    writer
      .write(',')
      .write('async (request, reply) =>')
      .block(() => {
        writer
          .write('const ')
          .write(this.camelCaseModel)
          .write(' = await ')
          .write(`${this.camelCaseModel}Service`)
          .write('.update')
          .write(this.pascalCaseModel)
          .write('(request.params.id, request.body);')
          .newLine();
        writer.write('return reply.status(200).send(').write(this.camelCaseModel).write(');');
      })
      .writeLine(');')
      .newLine();
  }

  private addDeleteRoute(writer: CodeBlockWriter): void {
    writer.write('server.delete<');
    writeObject(writer, {
      Params: `${this.pascalCaseModel}IdParams`,
      Reply: `${this.pascalCaseModel}Response`,
    });
    writer.write('>(').quote(`/${this.pluralKebabCaseModel}/:id`).write(',');
    writeObject(writer, {
      schema: {
        tags: `['${this.pascalCaseModel}']`,
        params: `${this.pascalCaseModel}IdParamsSchema`,
        response: {
          '200': `${this.pascalCaseModel}ResponseSchema`,
        },
      },
      onRequest: `checkPermission(${this.serializePermission('delete')})`,
    });
    writer
      .write(',')
      .write('async (request, reply) =>')
      .block(() => {
        writer
          .write('const ')
          .write(this.camelCaseModel)
          .write(' = await ')
          .write(`${this.camelCaseModel}Service`)
          .write('.delete')
          .write(this.pascalCaseModel)
          .write('(request.params.id);')
          .newLine();
        writer.write('return reply.status(200).send(').write(this.camelCaseModel).write(');');
      })
      .writeLine(');')
      .newLine();
  }

  private addImports(file: SourceFile): void {
    file.addImportDeclaration({
      moduleSpecifier: 'fastify',
      namedImports: ['FastifyPluginAsync'],
    });
    file.addImportDeclaration({
      moduleSpecifier: `./${this.kebabCaseModel}.service`,
      namedImports: [`${this.pascalCaseModel}Service`],
    });

    const checkPermissionPath = path.join(
      this.config.api.rootPath,
      this.config.api.checkPermissionFilePath
    );
    const checkPermissionRelativePath = path.relative(
      path.dirname(file.getFilePath()),
      checkPermissionPath
    );

    file.addImportDeclaration({
      moduleSpecifier: checkPermissionRelativePath,
      namedImports: ['checkPermission'],
    });

    const schemaImportDeclaration = file.addImportDeclaration({
      moduleSpecifier: `./${this.kebabCaseModel}.schemas`,
      namedImports: [],
    });

    schemaImportDeclaration.addNamedImports([
      `${this.pascalCaseModel}Response`,
      `${this.pascalCaseModel}ResponseSchema`,
    ]);

    const { operations } = this.config;

    if (operations.findById || operations.update || operations.delete) {
      schemaImportDeclaration.addNamedImports([
        `${this.pascalCaseModel}IdParams`,
        `${this.pascalCaseModel}IdParamsSchema`,
      ]);
    }

    if (operations.findMultiple) {
      schemaImportDeclaration.addNamedImports([
        `Find${this.pluralPascalCaseModel}Query`,
        `Find${this.pluralPascalCaseModel}QuerySchema`,
        `Find${this.pluralPascalCaseModel}Response`,
        `Find${this.pluralPascalCaseModel}ResponseSchema`,
      ]);
    }

    if (operations.create) {
      schemaImportDeclaration.addNamedImports([
        `Create${this.pascalCaseModel}`,
        `Create${this.pascalCaseModel}Schema`,
      ]);
    }

    if (operations.update) {
      schemaImportDeclaration.addNamedImports([
        `Update${this.pascalCaseModel}`,
        `Update${this.pascalCaseModel}Schema`,
      ]);
    }
  }

  private serializePermission(operation: Operation): string {
    const permission = this.config.permissions[operation];
    const permissionObject: WritableObject = {
      type: quote(permission.type),
    };

    if (permission.type === 'role') {
      permissionObject.role = quote(getPermissionRole(this.config, permission, operation));
    }

    return objectToString(permissionObject);
  }
}
