import { Config, Operation, Permission } from '../config.schemas';
import { kebabCase } from '../utils/string.utils';

export function getPermissionRole(
  config: Config,
  permission: Permission,
  operation: Operation
): string {
  if (permission.type !== 'role') {
    throw new Error(`Permission it not a role permission: ${permission.type}`);
  }

  let role = permission.role;
  if (!role) {
    role = `${kebabCase(config.model)}:${kebabCase(operation)}`;
  }
  return role;
}
