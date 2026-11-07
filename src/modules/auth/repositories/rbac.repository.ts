/**
 * src/modules/auth/repositories/rbac.repository.ts
 * Akses basis data untuk peran (Role) dan izin (Permission) pengguna.
 * Seluruh izin dievaluasi murni dari basis data tanpa bypass hardcode.
 */

import { db } from "@/lib/db";

export interface UserRoleRecord {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
}

export class RbacRepository {
  async getUserRoles(userId: string): Promise<UserRoleRecord[]> {
    const userRoles = await db.userRole.findMany({
      where: { userId },
      include: {
        role: {
          select: {
            id: true,
            code: true,
            name: true,
            isSystem: true,
          },
        },
      },
    });

    return userRoles.map((ur) => ur.role);
  }

  async getUserPermissionCodes(userId: string): Promise<string[]> {
    const userRoles = await db.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: {
                  select: { code: true },
                },
              },
            },
          },
        },
      },
    });

    const permissionSet = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionSet.add(rp.permission.code);
      }
    }

    return Array.from(permissionSet);
  }

  async assignRole(
    userId: string,
    roleCode: string,
    assignedBy: string
  ): Promise<boolean> {
    const role = await db.role.findUnique({ where: { code: roleCode } });
    if (!role) return false;

    await db.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId,
        roleId: role.id,
        assignedBy,
      },
    });
    return true;
  }

  async removeRole(userId: string, roleCode: string): Promise<boolean> {
    const role = await db.role.findUnique({ where: { code: roleCode } });
    if (!role) return false;

    await db.userRole.deleteMany({
      where: {
        userId,
        roleId: role.id,
      },
    });
    return true;
  }
}

export const rbacRepository = new RbacRepository();
