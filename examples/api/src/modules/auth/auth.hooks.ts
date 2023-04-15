import { FastifyReply, FastifyRequest } from 'fastify';

import { NotAuthenticatedError, UnauthorizedError } from './auth.errors';
import { Permission } from './auth.types';
import { JwtPayload, verifyJwt } from './jwt';

type FastifyHook = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

export function checkPermission(permission: Permission): FastifyHook {
  return async request => {
    // We don't need to check anything when the endpoint is public
    if (permission.type === 'public') {
      return;
    }

    // If it's authenticated or role, we need to validate the jwt
    const { authorization } = request.headers;
    if (!authorization) {
      throw new NotAuthenticatedError();
    }

    let jwt: JwtPayload | null = null;

    try {
      jwt = verifyJwt(authorization.substring('Bearer '.length));
    } catch {
      throw new UnauthorizedError();
    }

    // The user is logged in, he can acess the authenticatd endpoint
    if (permission.type === 'authenticated') {
      return;
    }

    // Validate the role in the jwt
    if (jwt.scope.includes(permission.role) === false) {
      throw new UnauthorizedError();
    }
  };
}
