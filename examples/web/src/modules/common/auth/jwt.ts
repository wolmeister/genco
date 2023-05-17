import {
  observableLocalStorage,
  ObserveCallback,
  ObserveCleanup,
} from '../utils/observable-local-storage';

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

const JWT_KEY = '@genco-web-example/jwt';

export function getJwt(): string | null {
  return observableLocalStorage.getItem(JWT_KEY);
}

export function setJwt(jwt: string | null): void {
  if (jwt !== null) {
    observableLocalStorage.setItem(JWT_KEY, jwt);
  } else {
    observableLocalStorage.removeItem(JWT_KEY);
  }
}

export function observeJwt(callback: ObserveCallback): ObserveCleanup {
  return observableLocalStorage.observeItem(JWT_KEY, callback);
}

export function parseJwtPayload(jwt: string | null): JwtPayload | null {
  if (jwt === null) {
    return null;
  }

  const base64 = jwt.split('.')[1];
  const jsonPayload = decodeURIComponent(atob(base64));
  return JSON.parse(jsonPayload);
}
