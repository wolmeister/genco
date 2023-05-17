import { Button, Result } from 'antd';
import React, { PropsWithChildren } from 'react';
import { useNavigate } from 'react-router-dom';

import { useJwtPayload } from '../hooks/jwt.hooks';

export type ProtectedRouteProps = PropsWithChildren<{
  permissionRole?: string;
}>;

export function ProtectedRoute({ permissionRole, children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const jwtPayload = useJwtPayload();

  if (jwtPayload === null) {
    return (
      <Result
        // There's no 401 status for the antd page
        status="403"
        title="401"
        subTitle="Sorry, you need to be logged in to access this page."
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Back Home
          </Button>
        }
      />
    );
  }

  if (permissionRole !== undefined) {
    if (jwtPayload.scope.includes(permissionRole) === false) {
      return (
        <Result
          status="403"
          title="403"
          subTitle="Sorry, you are not authorized to access this page."
          extra={
            <Button type="primary" onClick={() => navigate('/')}>
              Back Home
            </Button>
          }
        />
      );
    }
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
}
