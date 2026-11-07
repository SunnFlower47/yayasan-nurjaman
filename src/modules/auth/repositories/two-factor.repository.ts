/**
 * src/modules/auth/repositories/two-factor.repository.ts
 * Akses basis data untuk secret TOTP dan recovery code.
 */

import { db } from "@/lib/db";

export class TwoFactorRepository {
  async findSecretByUserId(userId: string) {
    return db.twoFactorSecret.findUnique({
      where: { userId },
    });
  }

  async upsertSecret(userId: string, encryptedSecret: Buffer) {
    const secretBytes = new Uint8Array(encryptedSecret);
    return db.twoFactorSecret.upsert({
      where: { userId },
      create: {
        userId,
        secret: secretBytes,
        confirmedAt: null,
        lastUsedStep: null,
      },
      update: {
        secret: secretBytes,
        confirmedAt: null,
        lastUsedStep: null,
      },
    });
  }

  async confirmSecret(userId: string, step: bigint) {
    return db.twoFactorSecret.update({
      where: { userId },
      data: {
        confirmedAt: new Date(),
        lastUsedStep: step,
      },
    });
  }

  async updateLastUsedStep(userId: string, step: bigint) {
    return db.twoFactorSecret.update({
      where: { userId },
      data: {
        lastUsedStep: step,
      },
    });
  }

  async deleteSecret(userId: string) {
    return db.twoFactorSecret.deleteMany({
      where: { userId },
    });
  }

  async createRecoveryCodes(userId: string, codeHashes: string[]) {
    // Hapus kode lama sebelum menambahkan rangkaian baru
    await db.twoFactorRecoveryCode.deleteMany({ where: { userId } });

    await db.twoFactorRecoveryCode.createMany({
      data: codeHashes.map((codeHash) => ({
        userId,
        codeHash,
      })),
    });
  }

  async findUnusedRecoveryCodes(userId: string) {
    return db.twoFactorRecoveryCode.findMany({
      where: {
        userId,
        usedAt: null,
      },
    });
  }

  async countUnusedRecoveryCodes(userId: string): Promise<number> {
    return db.twoFactorRecoveryCode.count({
      where: {
        userId,
        usedAt: null,
      },
    });
  }

  async markRecoveryCodeUsed(id: string) {
    return db.twoFactorRecoveryCode.update({
      where: { id },
      data: {
        usedAt: new Date(),
      },
    });
  }

  async deleteRecoveryCodes(userId: string) {
    return db.twoFactorRecoveryCode.deleteMany({
      where: { userId },
    });
  }
}

export const twoFactorRepository = new TwoFactorRepository();
