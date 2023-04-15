export type PublicPermission = {
  type: 'public';
};

export type AuthenticatedPermission = {
  type: 'authenticated';
};

export type RolePermission = {
  type: 'role';
  role: string;
};

export type Permission = PublicPermission | AuthenticatedPermission | RolePermission;
