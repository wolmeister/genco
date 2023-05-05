import { SourceFile } from 'ts-morph';

import { Config } from '../config.schemas';
import { camelCase, kebabCase, pascalCase } from '../utils/string.utils';
import { writeObject } from '../utils/writer.utils';

export class ApiHooksGenerator {
  private readonly kebabCaseModel: string;
  private readonly pascalCaseModel: string;
  private readonly camelCaseModel: string;
  private readonly pluralKebabCaseModel: string;
  private readonly pluralPascalCaseModel: string;

  constructor(private config: Config) {
    this.kebabCaseModel = kebabCase(this.config.model);
    this.pascalCaseModel = pascalCase(this.config.model);
    this.camelCaseModel = camelCase(this.config.model);
    this.pluralKebabCaseModel = kebabCase(this.config.model, true);
    this.pluralPascalCaseModel = pascalCase(this.config.model, true);
  }

  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addHooks(file);
  }

  private addHooks(file: SourceFile): void {
    const { operations } = this.config;

    if (operations.findMultiple) {
      this.addFindMultipleHook(file);
    }
    if (operations.findById) {
      this.addFindByIdHook(file);
    }
    if (operations.create) {
      this.addCreateHook(file);
    }
    if (operations.update) {
      this.addUpdateHook(file);
    }
    if (operations.delete) {
      this.addDeleteHook(file);
    }
  }

  private addFindMultipleHook(file: SourceFile): void {
    file.addFunction({
      name: `use${this.pluralPascalCaseModel}`,
      parameters: [
        {
          name: 'filter',
          type: `Find${this.pluralPascalCaseModel}Filter`,
          hasQuestionToken: true,
        },
      ],
      isExported: true,
      statements: writer => {
        writer
          .write(`return useQuery<Paginated${this.pascalCaseModel}>`)
          .write(`(['${this.pluralKebabCaseModel}', filter], `)
          .write(`() => find${this.pluralPascalCaseModel}(filter));`);
      },
    });
  }

  private addFindByIdHook(file: SourceFile): void {
    file.addFunction({
      name: `use${this.pascalCaseModel}`,
      parameters: [
        {
          name: 'id',
          type: 'string',
        },
      ],
      isExported: true,
      statements: writer => {
        writer
          .write(`return useQuery<${this.pascalCaseModel}>`)
          .write(`(['${this.pluralKebabCaseModel}', id], `)
          .write(`() => find${this.pascalCaseModel}(id));`);
      },
    });
  }

  private addCreateHook(file: SourceFile): void {
    file.addFunction({
      name: `useCreate${this.pascalCaseModel}Mutation`,
      isExported: true,
      statements: writer => {
        writer.writeLine('const queryClient = useQueryClient()');
        writer.writeLine('');
        writer.write('return useMutation(');
        writeObject(writer, {
          mutationFn: `create${this.pascalCaseModel}`,
          onSuccess: `() => {
                queryClient.invalidateQueries({ queryKey: ['${this.pluralKebabCaseModel}'] });
              }`,
        });
        writer.write(');');
      },
    });
  }

  private addUpdateHook(file: SourceFile): void {
    file.addFunction({
      name: `useUpdate${this.pascalCaseModel}Mutation`,
      isExported: true,
      statements: writer => {
        writer.writeLine('const queryClient = useQueryClient()');
        writer.writeLine('');
        writer.write('return useMutation(');
        writeObject(writer, {
          mutationFn: `update${this.pascalCaseModel}`,
          onSuccess: `(${this.camelCaseModel}) => {
            queryClient.invalidateQueries({ 
              queryKey: ['${this.pluralKebabCaseModel}', ${this.camelCaseModel}.id] 
            });
          }`,
        });
        writer.write(');');
      },
    });
  }

  private addDeleteHook(file: SourceFile): void {
    file.addFunction({
      name: `useDelete${this.pascalCaseModel}Mutation`,
      isExported: true,
      statements: writer => {
        writer.writeLine('const queryClient = useQueryClient()');
        writer.writeLine('');
        writer.write('return useMutation(');
        writeObject(writer, {
          mutationFn: `delete${this.pascalCaseModel}`,
          onSuccess: `(${this.camelCaseModel}) => {
            queryClient.invalidateQueries({ 
              queryKey: ['${this.pluralKebabCaseModel}', ${this.camelCaseModel}.id] 
            });
          }`,
        });
        writer.write(');');
      },
    });
  }

  private addImports(file: SourceFile): void {
    const { operations } = this.config;

    // React query imports
    const reactQueryImportDeclaration = file.addImportDeclaration({
      moduleSpecifier: 'react-query',
    });

    if (operations.findMultiple || operations.findMultiple) {
      reactQueryImportDeclaration.addNamedImport('useQuery');
    }

    if (operations.create || operations.update || operations.delete) {
      reactQueryImportDeclaration.addNamedImports(['useMutation', 'useQueryClient']);
    }

    // Api client and types import
    const clientImportDeclaration = file.addImportDeclaration({
      moduleSpecifier: `./${this.kebabCaseModel}.client`,
    });
    const typesImportDeclaration = file.addImportDeclaration({
      moduleSpecifier: `./${this.kebabCaseModel}.types`,
    });

    if (operations.findMultiple) {
      clientImportDeclaration.addNamedImport(`find${this.pluralPascalCaseModel}`);
      typesImportDeclaration.addNamedImports([
        `Find${this.pluralPascalCaseModel}Filter`,
        `Paginated${this.pascalCaseModel}`,
      ]);
    }
    if (operations.findById) {
      clientImportDeclaration.addNamedImport(`find${this.pascalCaseModel}`);
      typesImportDeclaration.addNamedImport(this.pascalCaseModel);
    }
    if (operations.create) {
      clientImportDeclaration.addNamedImport(`create${this.pascalCaseModel}`);
    }
    if (operations.update) {
      clientImportDeclaration.addNamedImport(`update${this.pascalCaseModel}`);
    }
    if (operations.delete) {
      clientImportDeclaration.addNamedImport(`delete${this.pascalCaseModel}`);
    }
  }
}
