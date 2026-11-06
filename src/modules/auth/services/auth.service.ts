/**
 * src/modules/auth/services/auth.service.ts
 * Orkestrasi alur autentikasi, mitigasi enumerasi pengguna, dan ganti sandi wajib.
 */

import { AUTH_INVALID_CREDENTIALS_MSG, AUTH_ACCOUNT_LOCKED_MSG } from "../constants";
import { userRepository } from "../repositories/user.repository";
import { securityEventRepository } from "../repositories/security-event.repository";
import { passwordService } from "./password.service";
import { rateLimitService } from "./rate-limit.service";
import { sessionService } from "./session.service";
import { validatePasswordPolicy } from "../helpers/password-validator";
import type {
  LoginCredentials,
  LoginResult,
  ChangePasswordInput,
  ChangePasswordResult,
} from "../types";

export class AuthService {
  /**
   * Alur login komprehensif: rate limit, verifikasi Argon2id, timing defense, dan sesi.
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const { username, password, ip = "127.0.0.1", userAgent } = credentials;

    // 1. Periksa batas laju percobaan (rate limit)
    const rateLimit = await rateLimitService.checkLoginRateLimit(username, ip);
    if (rateLimit.blocked) {
      await securityEventRepository.record("LOCKOUT", {
        ip,
        userAgent,
        details: { username, blockedUntil: rateLimit.blockedUntil },
      });
      return { success: false, error: AUTH_ACCOUNT_LOCKED_MSG };
    }

    // 2. Cari pengguna
    const user = await userRepository.findByUsername(username);

    // 3. Mitigasi enumerasi pengguna & timing attack jika pengguna tidak ditemukan atau non-aktif
    if (!user || user.status !== "ACTIVE") {
      await passwordService.verifyDummy(password);
      const lockResult = await rateLimitService.recordLoginFailure(username, ip);
      if (lockResult.lockedOut) {
        await securityEventRepository.record("LOCKOUT", {
          ip,
          userAgent,
          details: { username },
        });
      }
      await securityEventRepository.record("LOGIN_FAILED", {
        ip,
        userAgent,
        details: { username, reason: "INVALID_CREDENTIALS_OR_INACTIVE" },
      });
      return { success: false, error: AUTH_INVALID_CREDENTIALS_MSG };
    }

    // 4. Verifikasi kata sandi asli
    const passwordValid = await passwordService.verify(password, user.passwordHash);
    if (!passwordValid) {
      const lockResult = await rateLimitService.recordLoginFailure(username, ip);
      if (lockResult.lockedOut) {
        await securityEventRepository.record("LOCKOUT", {
          userId: user.id,
          ip,
          userAgent,
          details: { username },
        });
      }
      await securityEventRepository.record("LOGIN_FAILED", {
        userId: user.id,
        ip,
        userAgent,
        details: { username, reason: "INVALID_PASSWORD" },
      });
      return { success: false, error: AUTH_INVALID_CREDENTIALS_MSG };
    }

    // 5. Berhasil masuk: bersihkan rate limit counter dan perbarui last login
    await rateLimitService.recordLoginSuccess(username, ip);
    await userRepository.updateLastLogin(user.id);

    // 6. Terbitkan sesi baru
    const { rawToken, session } = await sessionService.createSession(
      user.id,
      ip,
      userAgent
    );

    // 7. Catat audit keamanan
    await securityEventRepository.record("LOGIN_SUCCESS", {
      userId: user.id,
      ip,
      userAgent,
      details: { username, sessionId: session.id },
    });

    return {
      success: true,
      sessionToken: rawToken,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
        memberId: user.memberId,
        lastLoginAt: user.lastLoginAt,
      },
    };
  }

  /**
   * Alur penggantian kata sandi wajib maupun berkala.
   */
  async changePassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
    const user = await userRepository.findById(input.userId);
    if (!user) {
      return { success: false, error: "Pengguna tidak ditemukan." };
    }

    // Verifikasi kata sandi saat ini
    const currentValid = await passwordService.verify(
      input.currentPassword,
      user.passwordHash
    );
    if (!currentValid) {
      return { success: false, error: "Kata sandi saat ini tidak tepat." };
    }

    // Validasi kebijakan keamanan kata sandi baru
    const policy = validatePasswordPolicy(input.newPassword, {
      username: user.username,
      email: user.email,
    });
    if (!policy.valid) {
      return {
        success: false,
        error: policy.error || "Kata sandi tidak memenuhi kebijakan keamanan.",
      };
    }

    // Hash kata sandi baru dan perbarui di DB
    const newHash = await passwordService.hash(input.newPassword);
    await userRepository.updatePassword(user.id, newHash);

    // Cabut seluruh sesi aktif lainnya untuk akun ini
    await sessionService.revokeOtherSessions(
      user.id,
      input.currentSessionId,
      "PASSWORD_CHANGED"
    );

    await securityEventRepository.record("SESSION_REVOKED", {
      userId: user.id,
      ip: input.userIp,
      userAgent: input.userAgent,
      details: { reason: "PASSWORD_CHANGED_REVOKE_OTHERS" },
    });

    return { success: true };
  }
}

export const authService = new AuthService();
