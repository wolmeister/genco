import path from 'path';
import { SourceFile } from 'ts-morph';

import { Config } from '../config.schemas';
import { kebabCase, pascalCase } from '../utils/string.utils';

export class ApiClientGenerator {
  private readonly kebabCaseModel: string;
  private readonly pascalCaseModel: string;
  private readonly pluralKebabCaseModel: string;
  private readonly pluralPascalCaseModel: string;

  constructor(private config: Config) {
    this.kebabCaseModel = kebabCase(this.config.model);
    this.pascalCaseModel = pascalCase(this.config.model);
    this.pluralKebabCaseModel = kebabCase(this.config.model, true);
    this.pluralPascalCaseModel = pascalCase(this.config.model, true);
  }

  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addFunctions(file);
  }

  private addFunctions(file: SourceFile): void {
    const { operations } = this.config;

    if (operations.findMultiple) {
      this.addFindMultipleFunction(file);
    }
    if (operations.findById) {
      this.addFindByIdFunction(file);
    }
    if (operations.create) {
      this.addCreateFunction(file);
    }
    if (operations.update) {
      this.addUpdateFunction(file);
    }
    if (operations.delete) {
      this.addDeleteFunction(file);
    }
  }

  private addFindMultipleFunction(file: SourceFile): void {
    file.addFunction({
      name: `find${this.pluralPascalCaseModel}`,
      parameters: [
        {
          name: 'filter',
          type: `Find${this.pluralPascalCaseModel}Filter`,
          hasQuestionToken: true,
        },
      ],
      returnType: `Promise<Paginated${this.pascalCaseModel}>`,
      isExported: true,
      statements: writer => {
        writer
          .write(`return apiClient.url(${this.getApiPath()})`)
          .write(`.query(filter ?? {})`)
          .write(`.get().json<Paginated${this.pascalCaseModel}>();`);
      },
    });
  }

  private addFindByIdFunction(file: SourceFile): void {
    file.addFunction({
      name: `find${this.pascalCaseModel}`,
      parameters: [
        {
          name: 'id',
          type: 'string',
        },
      ],
      returnType: `Promise<${this.pascalCaseModel}>`,
      isExported: true,
      statements: writer => {
        writer
          .write(`return apiClient.url(${this.getApiPath('/${id}')})`)
          .write(`.get().json<${this.pascalCaseModel}>();`);
      },
    });
  }

  private addCreateFunction(file: SourceFile): void {
    file.addFunction({
      name: `create${this.pascalCaseModel}`,
      parameters: [
        {
          name: 'data',
          type: `Create${this.pascalCaseModel}Data`,
        },
      ],
      returnType: `Promise<${this.pascalCaseModel}>`,
      isExported: true,
      statements: writer => {
        writer
          .write(`return apiClient.url(${this.getApiPath()})`)
          .write(`.post(data).json<${this.pascalCaseModel}>();`);
      },
    });
  }

  private addUpdateFunction(file: SourceFile): void {
    file.addFunction({
      name: `update${this.pascalCaseModel}`,
      parameters: [
        {
          name: '[id, data]',
          type: `[string, Update${this.pascalCaseModel}Data]`,
        },
      ],
      returnType: `Promise<${this.pascalCaseModel}>`,
      isExported: true,
      statements: writer => {
        writer
          .write(`return apiClient.url(${this.getApiPath('${id}')})`)
          .write(`.patch(data).json<${this.pascalCaseModel}>();`);
      },
    });
  }

  private addDeleteFunction(file: SourceFile): void {
    file.addFunction({
      name: `delete${this.pascalCaseModel}`,
      parameters: [
        {
          name: 'id',
          type: 'string',
        },
      ],
      returnType: `Promise<${this.pascalCaseModel}>`,
      isExported: true,
      statements: writer => {
        writer
          .write(`return apiClient.url(${this.getApiPath('${id}')})`)
          .write(`.delete().json<${this.pascalCaseModel}>();`);
      },
    });
  }

  private getApiPath(subPath?: string): string {
    const parsedSubPath = subPath ? `/${subPath}` : '';
    return `\`/${this.pluralKebabCaseModel}${parsedSubPath}\``;
  }

  private addImports(file: SourceFile): void {
    // Api client import
    const apiClientFilePath = path.join(
      this.config.web.rootPath,
      this.config.web.apiClientFilePath
    );
    const apiClientFileRelativePath = path.relative(
      path.dirname(file.getFilePath()),
      apiClientFilePath
    );

    file.addImportDeclaration({
      moduleSpecifier: apiClientFileRelativePath,
      namedImports: ['apiClient'],
    });

    // Types import
    const typesImportDeclaration = file.addImportDeclaration({
      moduleSpecifier: `./${this.kebabCaseModel}.types`,
      namedImports: [],
    });

    const { operations } = this.config;

    if (operations.findById || operations.create || operations.update || operations.delete) {
      typesImportDeclaration.addNamedImport(this.pascalCaseModel);
    }
    if (operations.findMultiple) {
      typesImportDeclaration.addNamedImport(`Find${this.pluralPascalCaseModel}Filter`);
      typesImportDeclaration.addNamedImport(`Paginated${this.pascalCaseModel}`);
    }
    if (operations.create) {
      typesImportDeclaration.addNamedImport(`Create${this.pascalCaseModel}Data`);
    }
    if (operations.update) {
      typesImportDeclaration.addNamedImport(`Update${this.pascalCaseModel}Data`);
    }
  }
}
