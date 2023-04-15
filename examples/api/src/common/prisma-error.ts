import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

export function isPrismaError(error: unknown): error is PrismaClientKnownRequestError {
  if (typeof error === 'object') {
    const maybePrismaError = error as { clientVersion?: string; code?: string };
    if (maybePrismaError.code && maybePrismaError.clientVersion) {
      return true;
    }
  }
  return false;
}
