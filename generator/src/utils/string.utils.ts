import { camelize, humanize as inflectionHumanize, pluralize, underscore } from 'inflection';

export function pascalCase(value: string, plural = false): string {
  return camelize(plural ? pluralize(value) : value, false);
}

export function camelCase(value: string, plural = false): string {
  return camelize(plural ? pluralize(value) : value, true);
}

export function snakeCase(value: string, plural = false): string {
  return underscore(camelCase(value, plural));
}

export function kebabCase(value: string, plural = false): string {
  return snakeCase(value, plural).replace('_', '-');
}

export function quote(value: string): string {
  return `'${value}'`;
}

export function humanize(value: string, lowFirstLetter = false, plural = false): string {
  return inflectionHumanize(snakeCase(value, plural), lowFirstLetter);
}
