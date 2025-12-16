/**
 * UserRole Value Object
 *
 * Immutable value object representing user roles and permissions.
 */

export type RoleName = 'maid' | 'sponsor' | 'agency' | 'admin';

type Permission = string;

const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  maid: [
    'profile:read',
    'profile:update',
    'jobs:view',
    'jobs:apply',
    'documents:upload',
  ],
  sponsor: [
    'profile:read',
    'profile:update',
    'jobs:create',
    'jobs:manage',
    'maids:search',
    'maids:contact',
  ],
  agency: [
    'profile:read',
    'profile:update',
    'jobs:create',
    'jobs:manage',
    'maids:manage',
    'roster:manage',
  ],
  admin: [
    '*', // All permissions
  ],
};

export class UserRole {
  private readonly _roleName: RoleName;
  private readonly _permissions: Permission[];

  constructor(roleName: RoleName) {
    if (!ROLE_PERMISSIONS[roleName]) {
      throw new Error(`Invalid role: ${roleName}`);
    }

    this._roleName = roleName;
    this._permissions = ROLE_PERMISSIONS[roleName];
  }

  get name(): RoleName {
    return this._roleName;
  }

  get permissions(): Permission[] {
    return [...this._permissions];
  }

  hasPermission(permission: string): boolean {
    return this._permissions.includes('*') || this._permissions.includes(permission);
  }

  equals(other: UserRole): boolean {
    return other instanceof UserRole && other._roleName === this._roleName;
  }

  toString(): string {
    return this._roleName;
  }

  // Factory methods
  static maid(): UserRole {
    return new UserRole('maid');
  }

  static sponsor(): UserRole {
    return new UserRole('sponsor');
  }

  static agency(): UserRole {
    return new UserRole('agency');
  }

  static admin(): UserRole {
    return new UserRole('admin');
  }

  static fromString(roleName: string): UserRole {
    return new UserRole(roleName as RoleName);
  }
}
