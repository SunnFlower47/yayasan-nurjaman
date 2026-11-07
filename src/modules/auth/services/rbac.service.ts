/**
 * src/modules/auth/services/rbac.service.ts
 * Layanan logika bisnis evaluasi peran dan izin (RBAC).
 * Tidak ada bypass hardcode: Super Admin wajib memiliki izin resmi di basis data.
 */

import { rbacRepository, type UserRoleRecord } from "../repositories/rbac.repository";

export class RbacService {
  async getUserRoles(userId: string): Promise<UserRoleRecord[]> {
    return rbacRepository.getUserRoles(userId);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    return rbacRepository.getUserPermissionCodes(userId);
  }

  async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const permissions = await rbacRepository.getUserPermissionCodes(userId);
    return permissions.includes(permissionCode);
  }

  async hasAnyRole(userId: string, roleCodes: string[]): Promise<boolean> {
    const roles = await rbacRepository.getUserRoles(userId);
    return roles.some((r) => roleCodes.includes(r.code));
  }

  async assignRole(
    userId: string,
    roleCode: string,
    assignedBy: string
  ): Promise<boolean> {
    return rbacRepository.assignRole(userId, roleCode, assignedBy);
  }

  async removeRole(userId: string, roleCode: string): Promise<boolean> {
    return rbacRepository.removeRole(userId, roleCode);
  }
}

export const rbacService = new RbacService();
