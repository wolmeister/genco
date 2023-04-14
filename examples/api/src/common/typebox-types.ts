import { TObject, TSchema, Type } from '@sinclair/typebox';

export interface TDateType extends TSchema {
  $static: Date | string; // allow both Date and string
  type: 'string';
  format: 'date-time';
}

export function DateType(): TDateType {
  return { type: 'string', format: 'date-time' } as never;
}

export interface TBigIntType extends TSchema {
  $static: bigint;
  type: 'integer';
  format: 'int64';
}

export function BigIntType(): TBigIntType {
  return { type: 'integer', format: 'format' } as never;
}

export function createPaginationSchema<T extends TObject>(node: T) {
  return Type.Object({
    edges: Type.Array(
      Type.Object({
        cursor: Type.String(),
        node,
      })
    ),
    totalCount: Type.Integer(),
    pageInfo: Type.Object({
      hasNextPage: Type.Boolean(),
      hasPreviousPage: Type.Boolean(),
      startCursor: Type.Optional(Type.String()),
      endCursor: Type.Optional(Type.String()),
    }),
  });
}
