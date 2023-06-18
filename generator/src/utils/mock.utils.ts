import { SourceFile, VariableDeclarationKind } from 'ts-morph';

import { Config, Field } from '../config.schemas';
import { pascalCase, quote } from './string.utils';
import { WritableObject, writeObject } from './writer.utils';

function getRandomNumber(min: number | null, max: number | null, isDouble: boolean): number {
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

function getFieldMock(fieldName: string, field: Field, serializeDates: boolean): string {
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
        getRandomNumber(field.validations?.min ?? null, field.validations?.max ?? null, false)
      );
    }
    case 'double': {
      return getRandomNumber(
        field.validations?.min ?? null,
        field.validations?.max ?? null,
        false
      ).toFixed(2);
    }
    case 'boolean': {
      return 'true';
    }
    case 'date': {
      return `new Date(${Date.now()})${serializeDates ? '.toISOString()' : ''}`;
    }
    default: {
      throw new Error('Field type not implemented');
    }
  }
}

export function generateModelMock(
  name: string,
  serializeDates: boolean,
  config: Config,
  file: SourceFile
): void {
  file.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name,
        type: pascalCase(config.model),
        initializer: writer => {
          const now = Date.now();

          const mock: WritableObject = {};
          for (const [fieldName, field] of Object.entries(config.fields)) {
            mock[fieldName] = getFieldMock(fieldName, field, serializeDates);
          }

          writeObject(writer, {
            id: quote('id'),
            ...mock,
            createdAt: `new Date(${now})${serializeDates ? '.toISOString()' : ''}`,
            updatedAt: `new Date(${now})${serializeDates ? '.toISOString()' : ''}`,
          });
        },
      },
    ],
  });
}
