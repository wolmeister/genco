import { useEffect, useMemo, useState } from 'react';

import { getJwt, JwtPayload, observeJwt, parseJwtPayload } from '../jwt';

export function useJwt(): string | null {
  const [jwt, setJwt] = useState(getJwt());

  useEffect(() => {
    return observeJwt(setJwt);
  }, []);

  return jwt;
}

export function useJwtPayload(): JwtPayload | null {
  const jwt = useJwt();
  return useMemo(() => parseJwtPayload(jwt), [jwt]);
}
