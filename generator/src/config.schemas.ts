import { z } from 'zod';

export const baseFieldSchema = z.object({
  required: z.boolean().default(false),
  unique: z.boolean().default(false),
  immutable: z.boolean().default(false),
});

export const stringFieldSchema = baseFieldSchema.extend({
  type: z.literal('string'),
  format: z.literal('email').optional(),
  default: z.string().optional(),
  validations: z
    .object({
      minLength: z.number().int().min(0).optional(),
      maxLength: z.number().int().min(1).optional(),
    })
    .optional(),
});

export const intFieldSchema = baseFieldSchema.extend({
  type: z.literal('int'),
  default: z.number().int().optional(),
  validations: z
    .object({
      min: z.number().int().optional(),
      max: z.number().int().optional(),
    })
    .optional(),
});

export const doubleFieldSchema = baseFieldSchema.extend({
  type: z.literal('double'),
  default: z.number().optional(),
  validations: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
});

export const booleanFieldSchema = baseFieldSchema.extend({
  type: z.literal('boolean'),
  default: z.boolean().optional(),
});

export const dateFieldSchema = baseFieldSchema.extend({
  type: z.literal('date'),
  default: z.string().datetime().optional(),
  validations: z
    .object({
      minDate: z.string().datetime().optional(),
      maxDate: z.string().datetime().optional(),
    })
    .optional(),
});

export const fieldSchema = z.discriminatedUnion('type', [
  stringFieldSchema,
  intFieldSchema,
  doubleFieldSchema,
  booleanFieldSchema,
  dateFieldSchema,
]);

export type Field = z.infer<typeof fieldSchema>;

export const configSchema = z.object({
  extends: z.string().optional(),
  api: z.object({
    rootPath: z.string(),
    tsconfigFilePath: z.string().default('tsconfig.json'),
    modulesFolderPath: z.string().default('src/modules'),
    appFilePath: z.string().default('src/app'),
    appVariableName: z.string().default('app'),
    prismaFilePath: z.string().default('prisma/schema.prisma'),
    prismaClientFilePath: z.string().default('src/prisma'),
    prismaErrorUtilsFilePath: z.string().default('src/common/prisma-error'),
    typeboxTypesFilePath: z.string().default('src/common/typebox-types'),
    loggerPath: z.string().default('src/logger'),
  }),
  overwrite: z.boolean().default(false),
  model: z.string(),
  operations: z
    .object({
      findMultiple: z.boolean().default(true),
      findById: z.boolean().default(true),
      create: z.boolean().default(true),
      update: z.boolean().default(true),
      delete: z.boolean().default(true),
    })
    .default({}),
  fields: z.record(z.string(), fieldSchema),
});

export type Config = z.infer<typeof configSchema>;
