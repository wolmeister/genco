import { Config } from '../config.schemas';
import { camelCase, kebabCase, pascalCase, snakeCase } from '../utils/string.utils';

export abstract class BaseGenerator {
  protected readonly camelCaseModel: string;
  protected readonly kebabCaseModel: string;
  protected readonly pascalCaseModel: string;
  protected readonly snakeCaseModel: string;
  protected readonly pluralCamelCaseModel: string;
  protected readonly pluralKebabCaseModel: string;
  protected readonly pluralPascalCaseModel: string;
  protected readonly pluralSnakeCaseModel: string;

  constructor(protected config: Config) {
    this.camelCaseModel = camelCase(config.model);
    this.kebabCaseModel = kebabCase(config.model);
    this.pascalCaseModel = pascalCase(config.model);
    this.snakeCaseModel = snakeCase(config.model);
    this.pluralCamelCaseModel = camelCase(config.model, true);
    this.pluralKebabCaseModel = kebabCase(config.model, true);
    this.pluralPascalCaseModel = pascalCase(config.model, true);
    this.pluralSnakeCaseModel = snakeCase(config.model, true);
  }
}
