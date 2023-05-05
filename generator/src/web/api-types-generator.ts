import path from 'path';
import { SourceFile } from 'ts-morph';

import { Config, Field } from '../config.schemas';
import { pascalCase } from '../utils/string.utils';
import { WritableObject, writeObject } from '../utils/writer.utils';

export class ApiTypesGenerator {
  private readonly pascalCaseModel: string;
  private readonly pluralPascalCaseModel: string;

  constructor(private config: Config) {
    this.pascalCaseModel = pascalCase(this.config.model);
    this.pluralPascalCaseModel = pascalCase(this.pascalCaseModel, true);
  }

  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addTypes(file);
  }

  private addTypes(file: SourceFile): void {
    const { operations } = this.config;
    this.addCommonTypes(file);

    if (operations.findMultiple) {
      this.addFindMultipleTypes(file);
    }
    if (operations.create) {
      this.addCreateTypes(file);
    }
    if (operations.update) {
      this.addUpdateTypes(file);
    }
  }

  private addCommonTypes(file: SourceFile): void {
    file.addTypeAlias({
      isExported: true,
      leadingTrivia: '// Common',
      name: this.pascalCaseModel,
      type: writer => {
        const objectToWrite: WritableObject = {
          id: 'string',
        };
        for (const [fieldName, field] of Object.entries(this.config.fields)) {
          const [typeFieldName, type] = this.getFieldNameAndType(fieldName, field, true);
          objectToWrite[typeFieldName] = type;
        }
        writeObject(writer, {
          ...objectToWrite,
          createdAt: 'string',
          updatedAt: 'string',
        });
      },
    });
  }

  private addFindMultipleTypes(file: SourceFile): void {
    file.addTypeAlias({
      isExported: true,
      leadingTrivia: `\n\n// Find ${this.pluralPascalCaseModel}`,
      name: `Find${this.pluralPascalCaseModel}Filter`,
      type: writer => {
        writeObject(writer, {
          'ids?': 'string[]',
          'after?': 'string',
          'first?': 'number',
        });
      },
    });

    file.addTypeAlias({
      isExported: true,
      leadingTrivia: '\n\n',
      name: `Paginated${this.pascalCaseModel}`,
      type: `Paginated<${this.pascalCaseModel}>`,
    });
  }

  private addCreateTypes(file: SourceFile): void {
    file.addTypeAlias({
      isExported: true,
      leadingTrivia: `\n\n// Create ${this.pascalCaseModel}`,
      name: `Create${this.pascalCaseModel}Data`,
      type: writer => {
        const objectToWrite: WritableObject = {};
        for (const [fieldName, field] of Object.entries(this.config.fields)) {
          const [typeFieldName, type] = this.getFieldNameAndType(fieldName, field, false);
          objectToWrite[typeFieldName] = type;
        }
        writeObject(writer, objectToWrite);
      },
    });
  }

  private addUpdateTypes(file: SourceFile): void {
    file.addTypeAlias({
      isExported: true,
      leadingTrivia: `\n\n// Update ${this.pascalCaseModel}`,
      name: `Update${this.pascalCaseModel}Data`,
      type: writer => {
        const objectToWrite: WritableObject = {};
        for (const [fieldName, field] of Object.entries(this.config.fields)) {
          if (field.immutable) {
            continue;
          }
          const [typeFieldName, type] = this.getFieldNameAndType(fieldName, field, false);
          objectToWrite[typeFieldName] = type;
        }
        writeObject(writer, objectToWrite);
      },
    });
  }

  private getFieldNameAndType(
    fieldName: string,
    field: Field,
    responseSchema: boolean
  ): [string, string] {
    let typeFieldName = fieldName;
    let type: string;

    switch (field.type) {
      case 'date':
      case 'string':
        type = 'string';
        break;
      case 'int':
      case 'double':
        type = 'number';
        break;
      case 'boolean':
        type = 'boolean';
        break;
      default:
        throw new Error('Field type not implemented');
    }

    if (field.required === false) {
      type += ' | null';

      if (responseSchema === false) {
        typeFieldName += '?';
      }
    }

    return [typeFieldName, type];
  }

  private addImports(file: SourceFile): void {
    const paginatedFilePath = path.join(
      this.config.web.rootPath,
      this.config.web.paginatedFilePath
    );
    const paginatedFileRelativePath = path.relative(
      path.dirname(file.getFilePath()),
      paginatedFilePath
    );

    if (this.config.operations.findMultiple) {
      file.addImportDeclaration({
        moduleSpecifier: paginatedFileRelativePath,
        namedImports: ['Paginated'],
      });
    }
  }
}
