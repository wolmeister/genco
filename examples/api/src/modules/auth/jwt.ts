import nJwt from 'njwt';

import { logger } from '../../logger';

export type JwtPayload = {
  // Basic jwt claims
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;

  // Jwt claims required by the system
  sub: string;
  scope: string[];
};

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.error('Missing JWT_SECRET env variable');
  process.exit(-1);
}

export function signJwt(payload: JwtPayload): string {
  return nJwt.create(payload, JWT_SECRET).compact();
}

export function verifyJwt(token: string): JwtPayload {
  const jwt = nJwt.verify(token, JWT_SECRET);
  if (!jwt) {
    throw new Error('Failed to verify jwt');
  }
  return jwt.body.toJSON() as JwtPayload;
}
