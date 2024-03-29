import { readFile, writeFile } from 'fs/promises';
import path from 'path';

import { Config, Field } from '../config.schemas';
import { pascalCase } from '../utils/string.utils';

type PrismaFieldType = 'String' | 'Int' | 'Decimal' | 'Boolean' | 'DateTime';

const fieldTypeToPrismaType: Record<Field['type'], PrismaFieldType> = {
  string: 'String',
  int: 'Int',
  double: 'Decimal',
  boolean: 'Boolean',
  date: 'DateTime',
};

type PrismaField = {
  name: string;
  type: string;
  required: boolean;
  decorator: string | null;
};

export class PrismaGenerator {
  private readonly pascalCaseModel: string;
  private readonly largestFieldName: number;
  private readonly largestFieldType: number;

  constructor(private config: Config) {
    this.pascalCaseModel = pascalCase(this.config.model);

    // We cannot format the .prisma file easily, so we need to create
    // the model with the right indentation
    this.largestFieldName = Object.keys(this.config.fields)
      .map(n => n.length)
      // createdAt is the largest default field
      .concat('createdAt'.length)
      .sort((a, b) => b - a)[0];
    this.largestFieldType = Object.entries(this.config.fields)
      .map(([fieldName, field]) => {
        let length = fieldTypeToPrismaType[field.type].length;
        if (field.type === 'string' && field.options) {
          // Enum name
          length = Math.max(length, (this.pascalCaseModel + pascalCase(fieldName)).length);
        }
        return length + (field.required ? 0 : 1);
      })
      // DateTime is the largest default field type
      .concat('DateTime'.length)
      .sort((a, b) => b - a)[0];
  }

  async generate(): Promise<void> {
    // Read the prisma schema
    const prismaSchemaPath = path.join(this.config.api.rootPath, this.config.api.prismaFilePath);
    const prismaSchema = await readFile(prismaSchemaPath, 'utf8');
    const prismaSchemaLines = prismaSchema.split('\n');

    // Delete the existing model definition, if any
    const existingModelStartIndex = prismaSchemaLines.findIndex(l =>
      l.includes(`model ${this.pascalCaseModel} {`)
    );
    if (existingModelStartIndex !== -1) {
      const existingModelLines = prismaSchemaLines
        .slice(existingModelStartIndex)
        .findIndex(l => l.includes('}'));
      // We need to remove the empty line too
      prismaSchemaLines.splice(existingModelStartIndex, existingModelLines + 2);
    }

    // Make sure that the file ends with a empty line
    if (prismaSchemaLines[prismaSchemaLines.length - 1] !== '') {
      prismaSchemaLines.push('');
    }

    // Add enums
    for (const [fieldName, field] of Object.entries(this.config.fields)) {
      if (field.type !== 'string' || !field.options) {
        continue;
      }

      const enumName = this.pascalCaseModel + pascalCase(fieldName);

      const existingEnumStartIndex = prismaSchemaLines.findIndex(l =>
        l.includes(`enum ${enumName} {`)
      );
      if (existingEnumStartIndex !== -1) {
        const existingEnumLines = prismaSchemaLines
          .slice(existingEnumStartIndex)
          .findIndex(l => l.includes('}'));
        // We need to remove the empty line too
        prismaSchemaLines.splice(existingEnumStartIndex, existingEnumLines + 2);
      }

      prismaSchemaLines.push(`enum ${enumName} {`);
      for (const option of field.options) {
        prismaSchemaLines.push(`  ${option.value}`);
      }
      prismaSchemaLines.push(`}`);
      prismaSchemaLines.push('');
    }

    // Generate the model, line by line
    prismaSchemaLines.push(`model ${this.pascalCaseModel} {`);
    prismaSchemaLines.push(
      this.serializePrismaField({
        name: 'id',
        type: 'String',
        required: true,
        decorator: '@id @default(cuid())',
      })
    );

    for (const [fieldName, field] of Object.entries(this.config.fields)) {
      let type: string = fieldTypeToPrismaType[field.type];
      if (field.type === 'string' && field.options) {
        type = this.pascalCaseModel + pascalCase(fieldName);
      }

      prismaSchemaLines.push(
        this.serializePrismaField({
          name: fieldName,
          type,
          required: field.required,
          decorator: field.unique ? '@unique' : null,
        })
      );
    }

    prismaSchemaLines.push(
      this.serializePrismaField({
        name: 'createdAt',
        type: 'DateTime',
        required: true,
        decorator: '@default(now())',
      })
    );
    prismaSchemaLines.push(
      this.serializePrismaField({
        name: 'updatedAt',
        type: 'DateTime',
        required: true,
        decorator: '@updatedAt',
      })
    );
    prismaSchemaLines.push('}');
    // Always keep a empty line at the end
    prismaSchemaLines.push('');

    // Save the schema
    await writeFile(prismaSchemaPath, prismaSchemaLines.join('\n'), {
      encoding: 'utf-8',
    });
  }

  private serializePrismaField(prismaField: PrismaField): string {
    const name = prismaField.name.padEnd(this.largestFieldName + 1, ' ');
    let type = prismaField.type + (prismaField.required ? '' : '?');
    if (prismaField.decorator) {
      type = type.padEnd(this.largestFieldType + 1, ' ');
    }
    return `  ${name}${type}${prismaField.decorator ?? ''}`;
  }
}
