/**
 * src/modules/auth/helpers/require-permission.ts
 * Pemeriksaan otorisasi server-side otoritatif (ADR-004).
 * Wajib dijalankan di setiap Server Action, Route Handler, dan Page administratif.
 */

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser, type RequireUserOptions } from "./require-user";
import { rbacService } from "../services/rbac.service";
import { securityEventRepository } from "../repositories/security-event.repository";
import { getClientIp } from "./ip";
import { ForbiddenError } from "@/lib/errors";
import type { SystemPermissionCode } from "../permissions";
import type { SessionWithUser } from "../repositories/session.repository";
import type { UserRoleRecord } from "../repositories/rbac.repository";

export interface RequirePermissionOptions extends RequireUserOptions {
  redirectOnForbidden?: string | boolean | undefined;
}

export interface PermissionContext {
  sessionWithUser: SessionWithUser;
  roles: UserRoleRecord[];
  permissions: string[];
}

export const getCachedUserPermissions = cache(
  async (userId: string): Promise<string[]> => {
    return rbacService.getUserPermissions(userId);
  }
);

export const getCachedUserRoles = cache(
  async (userId: string): Promise<UserRoleRecord[]> => {
    return rbacService.getUserRoles(userId);
  }
);

async function recordPermissionDenied(
  userId: string,
  permissionCode: SystemPermissionCode
): Promise<void> {
  try {
    const reqHeaders = await headers();
    const ip = getClientIp(reqHeaders);
    const userAgent = reqHeaders.get("user-agent") ?? undefined;
    await securityEventRepository.record("PERMISSION_DENIED", {
      userId,
      ip,
      userAgent,
      details: { permission: permissionCode },
    });
  } catch {
    // Abaikan jika headers() tidak tersedia di lingkungan unit test
  }
}

/**
 * Memastikan pengguna memiliki sesi aktif dan memiliki izin spesifik.
 * Melempar ForbiddenError (403) atau mengalihkan jika izin tidak mencukupi.
 */
export async function requirePermission(
  permissionCode: SystemPermissionCode,
  options: RequirePermissionOptions = {}
): Promise<PermissionContext> {
  const sessionWithUser = await requireUser(options);
  const userId = sessionWithUser.user.id;

  const permissions = await getCachedUserPermissions(userId);
  const allowed = permissions.includes(permissionCode);

  if (!allowed) {
    await recordPermissionDenied(userId, permissionCode);

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

  const roles = await getCachedUserRoles(userId);
  return { sessionWithUser, roles, permissions };
}

export function can(
  subject: { permissions?: string[] } | string[] | null | undefined,
  permissionCode: SystemPermissionCode
): boolean {
  if (!subject) return false;
  const list = Array.isArray(subject) ? subject : (subject.permissions ?? []);
  return list.includes(permissionCode);
}

export async function hasPermission(
  userId: string,
  permissionCode: string
): Promise<boolean> {
  const perms = await getCachedUserPermissions(userId);
  return perms.includes(permissionCode);
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  return getCachedUserPermissions(userId);
}

export async function getUserRoles(userId: string): Promise<UserRoleRecord[]> {
  return getCachedUserRoles(userId);
}
