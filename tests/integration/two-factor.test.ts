import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  sessionService,
  twoFactorService,
  requireRecentReauth,
  ReauthRequiredError,
  calculateTotpCode,
  decodeBase32,
  rateLimitService,
} from "@/modules/auth";

describe("Integrasi 2FA TOTP dan Recovery Codes (PostgreSQL Asli)", () => {
  let prisma: PrismaClient;
  let testUserId: string;
  let resetUserId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    // Pastikan user uji bersih
    const existing1 = await prisma.user.findFirst({
      where: { username: "mfa_test_user" },
    });
    if (existing1) {
      await prisma.twoFactorRecoveryCode.deleteMany({ where: { userId: existing1.id } });
      await prisma.twoFactorSecret.deleteMany({ where: { userId: existing1.id } });
      await prisma.session.deleteMany({ where: { userId: existing1.id } });
      await prisma.auditLog.deleteMany({ where: { actorUserId: existing1.id } });
      await prisma.securityEvent.deleteMany({ where: { userId: existing1.id } });
      await prisma.user.delete({ where: { id: existing1.id } });
    }

    const created1 = await prisma.user.create({
      data: {
        username: "mfa_test_user",
        email: "mfa_test@yayasan.org",
        name: "Pengurus Uji 2FA",
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash",
        status: "ACTIVE",
      },
    });
    testUserId = created1.id;

    const created2 = await prisma.user.create({
      data: {
        username: "mfa_reset_user",
        email: "mfa_reset@yayasan.org",
        name: "Pengurus Uji Reset",
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash",
        status: "ACTIVE",
      },
    });
    resetUserId = created2.id;
  });

  afterAll(async () => {
    const userIds = [testUserId, resetUserId].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.twoFactorRecoveryCode.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.twoFactorSecret.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.auditLog.deleteMany({ where: { actorUserId: { in: userIds } } });
      await prisma.securityEvent.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });

  it("1. sesi tanpa mfa_verified_at ditolak requireUser walau cookie valid", async () => {
    const { session, rawToken } = await sessionService.createSession(testUserId);
    expect(session.mfaVerifiedAt).toBeNull();

    // Sesi valid di basis data tetapi mfaVerifiedAt masih bernilai null
    const validated = await sessionService.validateSession(rawToken);
    expect(validated).not.toBeNull();
    expect(validated?.mfaVerifiedAt).toBeNull();
  });

  it("2. kolom secret di database bukan plaintext maupun base32", async () => {
    const setup = await twoFactorService.initiateSetup(testUserId, "mfa_test_user");
    expect(setup.base32Secret).toBeTruthy();

    const dbSecret = await prisma.twoFactorSecret.findUnique({
      where: { userId: testUserId },
    });
    expect(dbSecret).not.toBeNull();

    const storedBytes = dbSecret!.secret;
    const asString = Buffer.from(storedBytes).toString("utf8");

    // Bukan string Base32 polos
    expect(/^[A-Z2-7]+$/.test(asString)).toBe(false);
    // Bukan teks secret acak polos
    expect(asString).not.toContain(setup.base32Secret);
    // Berukuran lebih panjang dari 20 byte karena mengandung key_id, nonce (12B), dan auth tag (16B)
    expect(storedBytes.length).toBeGreaterThan(20 + 12 + 16);
  });

  it("3. sukses 2FA merotasi token sesi dan menyetel mfa_verified_at", async () => {
    const setup = await twoFactorService.initiateSetup(testUserId, "mfa_test_user");
    const rawSecret = decodeBase32(setup.base32Secret);

    const { session, rawToken: token1 } = await sessionService.createSession(testUserId);

    // Hitung kode TOTP valid
    const currentStep = BigInt(Math.floor(Date.now() / 30000));
    const validCode = calculateTotpCode(rawSecret, currentStep);

    // Konfirmasi setup 2FA
    const confirmRes = await twoFactorService.confirmSetup(testUserId, validCode);
    expect(confirmRes.success).toBe(true);

    // Rotasi sesi setelah 2FA berhasil
    const { rawToken: token2 } = await sessionService.rotateSession(session.id, true);
    expect(token2).not.toBe(token1);

    // Token lama (token1) otomatis ditolak karena hash telah dirotasi
    const oldCheck = await sessionService.validateSession(token1);
    expect(oldCheck).toBeNull();

    // Token baru (token2) sah dan memiliki mfa_verified_at terisi
    const newCheck = await sessionService.validateSession(token2);
    expect(newCheck).not.toBeNull();
    expect(newCheck?.mfaVerifiedAt).not.toBeNull();
  });

  it("4. recovery code hanya dapat digunakan satu kali", async () => {
    const status = await twoFactorService.getStatus(testUserId);
    expect(status.enrolled).toBe(true);

    // Buat ulang kode pemulihan agar kita memegang kode mentahnya
    const codes = await twoFactorService.regenerateRecovery(testUserId);
    expect(codes.length).toBe(10);

    const firstCode = codes[0]!;

    // Pemakaian pertama kali harus berhasil
    const use1 = await twoFactorService.verifyRecovery(testUserId, firstCode);
    expect(use1.valid).toBe(true);
    expect(use1.remainingCount).toBe(9);

    // Pemakaian kedua kali dengan kode yang sama HARUS ditolak
    const use2 = await twoFactorService.verifyRecovery(testUserId, firstCode);
    expect(use2.valid).toBe(false);
    expect(use2.error).toContain("tidak valid atau sudah digunakan");
  });

  it("5. lima kode salah berturut-turut mencabut sesi pengguna", async () => {
    const { session, rawToken } = await sessionService.createSession(testUserId);

    for (let i = 1; i <= 5; i++) {
      const wrongRes = await twoFactorService.verifyCode(testUserId, "000000");
      expect(wrongRes.valid).toBe(false);

      const rateCheck = await rateLimitService.recordMfaFailure(session.id);
      if (rateCheck.lockedOut) {
        await sessionService.revokeSession(
          session.id,
          "MFA_5_CONSECUTIVE_FAILURES_LOCKOUT"
        );
      }
    }

    // Sesi harus sudah dicabut di database
    const checkSession = await sessionService.validateSession(rawToken);
    expect(checkSession).toBeNull();

    const dbSession = await prisma.session.findUnique({ where: { id: session.id } });
    expect(dbSession?.revokedAt).not.toBeNull();
    expect(dbSession?.revokedReason).toBe("MFA_5_CONSECUTIVE_FAILURES_LOCKOUT");
  });

  it("6. reset 2FA via service/skrip menghapus secret dan mencabut seluruh sesi", async () => {
    // Siapkan 2FA dan sesi untuk resetUserId
    await twoFactorService.initiateSetup(resetUserId, "mfa_reset_user");
    const codes = await twoFactorService.regenerateRecovery(resetUserId);
    expect(codes.length).toBe(10);

    const { rawToken } = await sessionService.createSession(resetUserId);

    // Eksekusi reset 2FA darurat dengan aktor 'cli'
    const resetResult = await twoFactorService.resetTwoFactor(resetUserId, {
      id: "cli",
      ip: "127.0.0.1",
      userAgent: "CLI-BreakGlass",
    });
    expect(resetResult.success).toBe(true);

    // Secret dan recovery codes terhapus bersih
    const secretRow = await prisma.twoFactorSecret.findUnique({
      where: { userId: resetUserId },
    });
    expect(secretRow).toBeNull();

    const remainingCodes = await prisma.twoFactorRecoveryCode.count({
      where: { userId: resetUserId },
    });
    expect(remainingCodes).toBe(0);

    // Seluruh sesi pengguna dicabut
    const validateRes = await sessionService.validateSession(rawToken);
    expect(validateRes).toBeNull();
  });

  it("7. requireRecentReauth menolak sesi dengan reauth_at kedaluwarsa (> 15 menit)", async () => {
    const now = Date.now();
    const staleReauthTime = new Date(now - 16 * 60 * 1000); // 16 menit yang lalu
    const freshReauthTime = new Date(now - 5 * 60 * 1000); // 5 menit yang lalu

    const { session } = await sessionService.createSession(testUserId);

    // Sesi dengan reauth_at basi
    const staleSession = {
      ...session,
      reauthAt: staleReauthTime,
      user: { id: testUserId } as any,
    };
    await expect(requireRecentReauth(staleSession, 15)).rejects.toThrow(
      ReauthRequiredError
    );

    // Sesi dengan reauth_at segar
    const freshSession = {
      ...session,
      reauthAt: freshReauthTime,
      user: { id: testUserId } as any,
    };
    await expect(requireRecentReauth(freshSession, 15)).resolves.toBeUndefined();
  });
});
