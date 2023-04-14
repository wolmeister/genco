import { camelize, pluralize, underscore } from 'inflection';

export function pascalCase(value: string, plural = false): string {
  return camelize(plural ? pluralize(value) : value, false);
}

export function camelCase(value: string, plural = false): string {
  return camelize(plural ? pluralize(value) : value, true);
}

export function kebabCase(value: string, plural = false): string {
  return underscore(camelCase(value, plural)).replace('_', '-');
}

export function quote(value: string): string {
  return `'${value}'`;
}
