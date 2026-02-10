import { UserRole } from '../types/enums';

export const ROLE_HIERARCHY: Record<string, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.OPERATIONS_MANAGER]: 80,
  [UserRole.STAFF]: 60,
  [UserRole.SELLER]: 40,
  [UserRole.INVESTOR]: 20,
};

export const SELF_REGISTRABLE_ROLES = [UserRole.INVESTOR, UserRole.SELLER];

export const ADMIN_ROLES = [UserRole.ADMIN, UserRole.OPERATIONS_MANAGER];

export const STAFF_ROLES = [
  UserRole.ADMIN,
  UserRole.OPERATIONS_MANAGER,
  UserRole.STAFF,
];

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const PASSWORD_MIN_LENGTH = 8;

export const CURRENCY = 'PKR';
