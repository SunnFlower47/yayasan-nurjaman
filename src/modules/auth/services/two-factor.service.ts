/**
 * src/modules/auth/services/two-factor.service.ts
 * Layanan orkestrasi 2FA TOTP, recovery codes, dan pemulihan darurat.
 */

import { encryptColumn, decryptColumn } from "@/lib/crypto";
import { writeAudit } from "@/modules/audit";
import {
  generateTotpSecret,
  encodeBase32,
  verifyTotpCode,
  buildTotpUri,
  generateTotpQrDataUrl,
} from "../helpers/totp";
import {
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode as checkRecoveryCode,
} from "../helpers/recovery-codes";
import { twoFactorRepository } from "../repositories/two-factor.repository";
import { securityEventRepository } from "../repositories/security-event.repository";
import { sessionService } from "./session.service";

export class TwoFactorService {
  async getStatus(userId: string) {
    const secretRow = await twoFactorRepository.findSecretByUserId(userId);
    const remainingCodes = await twoFactorRepository.countUnusedRecoveryCodes(userId);

    return {
      enrolled: Boolean(secretRow && secretRow.confirmedAt !== null),
      confirmedAt: secretRow?.confirmedAt ?? null,
      remainingRecoveryCodes: remainingCodes,
    };
  }

  async initiateSetup(userId: string, username: string) {
    const rawSecret = generateTotpSecret();
    const encryptedSecret = encryptColumn(rawSecret, {
      table: "two_factor_secrets",
      column: "secret",
      rowId: userId,
    });

    await twoFactorRepository.upsertSecret(userId, encryptedSecret);
    const base32Secret = encodeBase32(rawSecret);
    const uri = buildTotpUri(username, base32Secret);
    const qrDataUrl = await generateTotpQrDataUrl(uri);

    return { base32Secret, uri, qrDataUrl };
  }

  async confirmSetup(
    userId: string,
    code: string,
    ip?: string,
    userAgent?: string
  ): Promise<{ success: boolean; recoveryCodes?: string[]; error?: string }> {
    const secretRow = await twoFactorRepository.findSecretByUserId(userId);
    if (!secretRow) {
      return { success: false, error: "Inisialisasi 2FA belum dimulai." };
    }

    const decryptedSecret = decryptColumn(secretRow.secret, {
      table: "two_factor_secrets",
      column: "secret",
      rowId: userId,
    });

    const verification = verifyTotpCode(decryptedSecret, code);
    if (!verification.valid || verification.verifiedStep === undefined) {
      await securityEventRepository.record("MFA_FAILED", {
        userId,
        ip,
        userAgent,
        details: { action: "CONFIRM_SETUP", reason: verification.error },
      });
      return {
        success: false,
        error: verification.error ?? "Kode TOTP tidak valid atau telah kedaluwarsa.",
      };
    }

    await twoFactorRepository.confirmSecret(userId, verification.verifiedStep);

    const recoveryCodes = generateRecoveryCodes(10);
    const codeHashes = recoveryCodes.map(hashRecoveryCode);
    await twoFactorRepository.createRecoveryCodes(userId, codeHashes);

    await securityEventRepository.record("MFA_VERIFIED", {
      userId,
      ip,
      userAgent,
      details: { action: "CONFIRM_SETUP" },
    });
    await securityEventRepository.record("TWO_FACTOR_CHANGED", {
      userId,
      ip,
      userAgent,
      details: { action: "ENROLLED" },
    });
    await writeAudit({
      actorUserId: userId,
      action: "auth.two_factor_enrolled",
      entityType: "two_factor_secrets",
      entityId: userId,
      after: { action: "ENROLLED" },
    });

    return { success: true, recoveryCodes };
  }

  async verifyCode(
    userId: string,
    code: string,
    ip?: string,
    userAgent?: string
  ): Promise<{ valid: boolean; error?: string }> {
    const secretRow = await twoFactorRepository.findSecretByUserId(userId);
    if (!secretRow || !secretRow.confirmedAt) {
      return { valid: false, error: "2FA belum diaktifkan pada akun ini." };
    }

    const decryptedSecret = decryptColumn(secretRow.secret, {
      table: "two_factor_secrets",
      column: "secret",
      rowId: userId,
    });

    const verification = verifyTotpCode(decryptedSecret, code, {
      lastUsedStep: secretRow.lastUsedStep,
    });

    if (!verification.valid || verification.verifiedStep === undefined) {
      await securityEventRepository.record("MFA_FAILED", {
        userId,
        ip,
        userAgent,
        details: { reason: verification.error },
      });
      return {
        valid: false,
        error: verification.error ?? "Kode TOTP tidak valid atau telah kedaluwarsa.",
      };
    }

    await twoFactorRepository.updateLastUsedStep(userId, verification.verifiedStep);
    await securityEventRepository.record("MFA_VERIFIED", {
      userId,
      ip,
      userAgent,
      details: { method: "TOTP" },
    });

    return { valid: true };
  }

  async verifyRecovery(
    userId: string,
    rawCode: string,
    ip?: string,
    userAgent?: string
  ): Promise<{ valid: boolean; remainingCount?: number; error?: string }> {
    const unusedCodes = await twoFactorRepository.findUnusedRecoveryCodes(userId);
    const matched = unusedCodes.find((c) => checkRecoveryCode(rawCode, c.codeHash));

    if (!matched) {
      await securityEventRepository.record("MFA_FAILED", {
        userId,
        ip,
        userAgent,
        details: { method: "RECOVERY_CODE", error: "KODE_TIDAK_COCOK" },
      });
      return { valid: false, error: "Kode pemulihan tidak valid atau sudah digunakan." };
    }

    await twoFactorRepository.markRecoveryCodeUsed(matched.id);
    const remainingCount = unusedCodes.length - 1;

    await securityEventRepository.record("MFA_RECOVERY_USED", {
      userId,
      ip,
      userAgent,
      details: { remainingCodes: remainingCount },
    });
    await securityEventRepository.record("MFA_VERIFIED", {
      userId,
      ip,
      userAgent,
      details: { method: "RECOVERY_CODE" },
    });

    return { valid: true, remainingCount };
  }

  async regenerateRecovery(
    userId: string,
    ip?: string,
    userAgent?: string
  ): Promise<string[]> {
    const recoveryCodes = generateRecoveryCodes(10);
    const codeHashes = recoveryCodes.map(hashRecoveryCode);
    await twoFactorRepository.createRecoveryCodes(userId, codeHashes);

    await securityEventRepository.record("TWO_FACTOR_CHANGED", {
      userId,
      ip,
      userAgent,
      details: { action: "REGENERATE_RECOVERY_CODES" },
    });
    await writeAudit({
      actorUserId: userId,
      action: "auth.two_factor_regenerate_codes",
      entityType: "two_factor_recovery_codes",
      entityId: userId,
      after: { action: "REGENERATE_RECOVERY_CODES" },
    });

    return recoveryCodes;
  }

  async resetTwoFactor(
    targetUserId: string,
    actor: { id: string; ip?: string; userAgent?: string }
  ): Promise<{ success: boolean; error?: string }> {
    await twoFactorRepository.deleteSecret(targetUserId);
    await twoFactorRepository.deleteRecoveryCodes(targetUserId);

    // Cabut seluruh sesi aktif milik akun target
    await sessionService.revokeAllUserSessions(targetUserId, "RESET_2FA_BY_ADMIN");

    await securityEventRepository.record("MFA_RESET", {
      userId: targetUserId,
      ip: actor.ip,
      userAgent: actor.userAgent,
      details: { resetByActorId: actor.id },
    });
    const isCli = actor.id === "cli";
    await writeAudit({
      actorUserId: isCli ? null : actor.id,
      action: "auth.reset_2fa",
      entityType: "two_factor_secrets",
      entityId: targetUserId,
      after: { actor: isCli ? "cli" : actor.id },
    });

    return { success: true };
  }
}

export const twoFactorService = new TwoFactorService();
