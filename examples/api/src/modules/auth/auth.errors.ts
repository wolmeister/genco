import createError from '@fastify/error';

export const NotAuthenticatedError = createError('NOT_AUTHENTICATED', 'Not authenticated', 401);
export const UnauthorizedError = createError('NOT_UNAUTHORIZED', 'Not authorized', 403);
