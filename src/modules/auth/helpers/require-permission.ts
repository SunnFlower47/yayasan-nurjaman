/**
 * src/modules/auth/helpers/require-permission.ts
 * Pemeriksaan otorisasi server-side otoritatif (ADR-004).
 * Wajib dijalankan di setiap Server Action, Route Handler, dan Page administratif.
 */

import { redirect } from "next/navigation";
import { requireUser, type RequireUserOptions } from "./require-user";
import { rbacService } from "../services/rbac.service";
import { ForbiddenError } from "@/lib/errors";
import type { SessionWithUser } from "../repositories/session.repository";
import type { UserRoleRecord } from "../repositories/rbac.repository";

export interface RequirePermissionOptions extends RequireUserOptions {
  redirectOnForbidden?: string | boolean;
}

export interface PermissionContext {
  sessionWithUser: SessionWithUser;
  roles: UserRoleRecord[];
  permissions: string[];
}

/**
 * Memastikan pengguna memiliki sesi aktif dan memiliki izin spesifik.
 * Melempar ForbiddenError (403) atau mengalihkan jika izin tidak mencukupi.
 */
export async function requirePermission(
  permissionCode: string,
  options: RequirePermissionOptions = {}
): Promise<PermissionContext> {
  const sessionWithUser = await requireUser(options);
  const userId = sessionWithUser.user.id;

  const allowed = await rbacService.hasPermission(userId, permissionCode);
  if (!allowed) {
    if (options.redirectOnForbidden) {
      const target =
        typeof options.redirectOnForbidden === "string"
          ? options.redirectOnForbidden
          : "/admin?error=forbidden";
      redirect(target);
    }
    throw new ForbiddenError(
      `Akses ditolak: Anda tidak memiliki izin '${permissionCode}'.`
    );
  }

  const [roles, permissions] = await Promise.all([
    rbacService.getUserRoles(userId),
    rbacService.getUserPermissions(userId),
  ]);

  return { sessionWithUser, roles, permissions };
}

export async function hasPermission(
  userId: string,
  permissionCode: string
): Promise<boolean> {
  return rbacService.hasPermission(userId, permissionCode);
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  return rbacService.getUserPermissions(userId);
}

export async function getUserRoles(userId: string): Promise<UserRoleRecord[]> {
  return rbacService.getUserRoles(userId);
}
