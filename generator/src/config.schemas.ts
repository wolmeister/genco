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
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .min(2)
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

export const publicPermissionSchema = z.object({
  type: z.literal('public'),
});

export const authenticatedPermissionSchema = z.object({
  type: z.literal('authenticated'),
});

export const rolePermissionSchema = z.object({
  type: z.literal('role'),
  role: z.string().optional(),
});

export const permissionSchema = z
  .discriminatedUnion('type', [
    publicPermissionSchema,
    authenticatedPermissionSchema,
    rolePermissionSchema,
  ])
  .default({ type: 'public' });

export type Permission = z.infer<typeof permissionSchema>;

export const configSchema = z.object({
  extends: z.string().optional(),
  api: z.object({
    rootPath: z.string(),
    tsconfigFilePath: z.string().default('tsconfig.json'),
    modulesFolderPath: z.string().default('src/modules'),
    appFilePath: z.string().default('src/app.ts'),
    appVariableName: z.string().default('app'),
    prismaFilePath: z.string().default('prisma/schema.prisma'),
    prismaClientFilePath: z.string().default('src/prisma'),
    prismaErrorUtilsFilePath: z.string().default('src/common/prisma-error'),
    typeboxTypesFilePath: z.string().default('src/common/typebox-types'),
    checkPermissionFilePath: z.string().default('src/modules/auth'),
    loggerFilePath: z.string().default('src/logger'),
  }),
  web: z.object({
    rootPath: z.string(),
    tsconfigFilePath: z.string().default('tsconfig.json'),
    modulesFolderPath: z.string().default('src/modules'),
    paginatedFilePath: z.string().default('src/modules/common/api/common.types'),
    apiClientFilePath: z.string().default('src/modules/common/api/api.client'),
    apiErrorsFilePath: z.string().default('./src/modules/common/api/api.errors'),
    routerFilePath: z.string().default('./src/router.ts'),
    routerVariableName: z.string().default('router'),
    skeletonComponentFilePath: z.string().default('antd'),
    buttonComponentFilePath: z.string().default('antd'),
    resultComponentFilePath: z.string().default('antd'),
    formComponentFilePath: z.string().default('antd'),
    inputComponentFilePath: z.string().default('antd'),
    inputNumberComponentFilePath: z.string().default('antd'),
    checkboxComponentFilePath: z.string().default('antd'),
    datePickerComponentFilePath: z.string().default('antd'),
    selectComponentFilePath: z.string().default('antd'),
    tableComponentFilePath: z.string().default('antd'),
    modalFilePath: z.string().default('antd'),
    messageFilePath: z.string().default('antd'),
    protectedRouteFilePath: z
      .string()
      .default('./src/modules/common/auth/components/ProtectedRoute'),
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
  permissions: z
    .object({
      findMultiple: permissionSchema,
      findById: permissionSchema,
      create: permissionSchema,
      update: permissionSchema,
      delete: permissionSchema,
    })
    .default({}),
  fields: z.record(z.string(), fieldSchema),
});

export type Config = z.infer<typeof configSchema>;

export type Operation = keyof Config['operations'];
