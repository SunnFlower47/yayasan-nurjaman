/**
 * src/modules/auth/types.ts
 * Definisi tipe data domain modul autentikasi dan manajemen sesi.
 */

import type { UserStatus, SecurityEventType } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  name: string;
  status: UserStatus;
  mustChangePassword: boolean;
  memberId: string | null;
  lastLoginAt: Date | null;
}

export interface UserSession {
  id: string;
  userId: string;
  tokenHash: string;
  ip: string | null;
  userAgent: string | null;
  lastSeenAt: Date;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  reauthAt: Date | null;
  revokedAt: Date | null;
  revokedReason: string | null;
  createdAt: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
  ip?: string | undefined;
  userAgent?: string | undefined;
  next?: string | undefined;
}

export interface LoginResult {
  success: boolean;
  error?: string | undefined;
  user?: AuthenticatedUser | undefined;
  sessionToken?: string | undefined;
  mustChangePassword?: boolean | undefined;
  redirectTo?: string | undefined;
}

export interface ChangePasswordInput {
  userId: string;
  currentSessionId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  userIp?: string | undefined;
  userAgent?: string | undefined;
  requestId?: string | undefined;
}

export interface ChangePasswordResult {
  success: boolean;
  error?: string | undefined;
}

export interface SecurityEventData {
  type: SecurityEventType;
  userId?: string | null | undefined;
  ip?: string | null | undefined;
  userAgent?: string | null | undefined;
  details?: Record<string, unknown> | undefined;
}
