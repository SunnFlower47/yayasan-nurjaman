import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  authService,
  sessionService,
  passwordService,
  sanitizeRedirectPath,
  PASSWORD_MIN_LENGTH,
  AUTH_INVALID_CREDENTIALS_MSG,
  AUTH_ACCOUNT_LOCKED_MSG,
} from "@/modules/auth";

describe("Integrasi Alur Autentikasi dan Manajemen Sesi (PostgreSQL Asli)", () => {
  let prisma: PrismaClient;
  let testUserId: string;
  let disabledUserId: string;
  let lockoutUserId: string;
  let pwdChangeUserId: string;

  const validPassword = "Password123!Secure@Yayasan";
  const newValidPassword = "PasswordBaru2026!SangatAman@Purwakarta";

  beforeAll(async () => {
    prisma = new PrismaClient();
    const hash = await passwordService.hash(validPassword);

    async function ensureUser(
      username: string,
      email: string,
      name: string,
      status: "ACTIVE" | "DISABLED" = "ACTIVE",
      mustChangePassword = false
    ): Promise<string> {
      const existing = await prisma.user.findFirst({ where: { username } });
      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { passwordHash: hash, status, mustChangePassword, deletedAt: null },
        });
        return existing.id;
      }
      const created = await prisma.user.create({
        data: { username, email, name, passwordHash: hash, status, mustChangePassword },
      });
      return created.id;
    }

    testUserId = await ensureUser(
      "auth_test_user",
      "auth_test@yayasan.org",
      "Uji Auth",
      "ACTIVE",
      true
    );
    disabledUserId = await ensureUser(
      "auth_disabled_user",
      "auth_dis@yayasan.org",
      "Uji Nonaktif",
      "DISABLED"
    );
    lockoutUserId = await ensureUser(
      "auth_lockout_user",
      "auth_lock@yayasan.org",
      "Uji Lockout",
      "ACTIVE"
    );
    pwdChangeUserId = await ensureUser(
      "auth_pwd_user",
      "auth_pwd@yayasan.org",
      "Uji Ganti Sandi",
      "ACTIVE",
      true
    );
  });

  beforeEach(async () => {
    await prisma.rateLimitCounter.deleteMany();
  });

  afterAll(async () => {
    const userIds = [testUserId, disabledUserId, lockoutUserId, pwdChangeUserId].filter(
      Boolean
    );
    if (userIds.length > 0) {
      await prisma.securityEvent.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });

  it("1. login berhasil membuat baris sessions dengan hash SHA-256 (bukan token mentah)", async () => {
    const result = await authService.login({
      username: "auth_test_user",
      password: validPassword,
      ip: "127.0.0.1",
      userAgent: "Vitest-Agent/1.0",
    });

    expect(result.success).toBe(true);
    expect(result.sessionToken).toBeDefined();
    expect(result.sessionToken).toHaveLength(64);

    // Ambil dari basis data langsung
    const dbSession = await prisma.session.findFirst({
      where: { userId: testUserId, revokedAt: null },
      orderBy: { createdAt: "desc" },
    });

    expect(dbSession).not.toBeNull();
    expect(dbSession?.tokenHash).toHaveLength(64);
    // Bukti absolut: token mentah TIDAK SAMA dengan token_hash yang tersimpan di DB
    expect(dbSession?.tokenHash).not.toBe(result.sessionToken);
  });

  it("2. salah password dan username tak dikenal menghasilkan pesan dan status identik", async () => {
    const testIp = "192.168.222.1";
    await prisma.rateLimitCounter.deleteMany({
      where: { key: `auth:login:ip:${testIp}` },
    });

    // Percobaan kata sandi salah pada pengguna yang ada
    const wrongPassResult = await authService.login({
      username: "auth_test_user",
      password: "SalahPassword123!",
      ip: testIp,
    });

    // Percobaan pada pengguna yang tidak terdaftar sama sekali
    const unknownUserResult = await authService.login({
      username: "non_existent_user",
      password: "SalahPassword123!",
      ip: testIp,
    });

    expect(wrongPassResult.success).toBe(false);
    expect(unknownUserResult.success).toBe(false);
    expect(wrongPassResult.error).toBe(AUTH_INVALID_CREDENTIALS_MSG);
    expect(unknownUserResult.error).toBe(AUTH_INVALID_CREDENTIALS_MSG);
  });

  it("3. lockout progresif terjadi setelah 5 kali percobaan gagal berturut-turut", async () => {
    const testIp = "10.10.10.10";

    // 5 kali percobaan gagal berturut-turut
    for (let i = 0; i < 5; i++) {
      await authService.login({
        username: "auth_lockout_user",
        password: "WrongPassword!",
        ip: testIp,
      });
    }

    // Percobaan ke-6 WAJIB ditolak oleh sanksi lockout rate limit
    const lockedResult = await authService.login({
      username: "auth_lockout_user",
      password: validPassword,
      ip: testIp,
    });

    expect(lockedResult.success).toBe(false);
    expect(lockedResult.error).toBe(AUTH_ACCOUNT_LOCKED_MSG);

    // Verifikasi bahwa security_events mencatat kejadian LOCKOUT
    const lockoutEvent = await prisma.securityEvent.findFirst({
      where: {
        type: "LOCKOUT",
      },
      orderBy: { occurredAt: "desc" },
    });
    expect(lockoutEvent).not.toBeNull();
  });

  it("4. akun berstatus DISABLED ditolak masuk dengan pesan kesalahan generik", async () => {
    const result = await authService.login({
      username: "auth_disabled_user",
      password: validPassword,
      ip: "127.0.0.1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe(AUTH_INVALID_CREDENTIALS_MSG);
  });

  it("5. sesi idle dan absolut yang melewati batas waktu dianggap kedaluwarsa", async () => {
    // Buat sesi buatan dengan idleExpiresAt di masa lalu
    const { rawToken: idleToken, session: idleSession } =
      await sessionService.createSession(testUserId, "127.0.0.1");

    await prisma.session.update({
      where: { id: idleSession.id },
      data: {
        idleExpiresAt: new Date(Date.now() - 1000 * 60), // 1 menit yang lalu
      },
    });

    const validatedIdle = await sessionService.validateSession(idleToken);
    expect(validatedIdle).toBeNull();

    // Buat sesi buatan dengan absoluteExpiresAt di masa lalu
    const { rawToken: absToken, session: absSession } =
      await sessionService.createSession(testUserId, "127.0.0.1");

    await prisma.session.update({
      where: { id: absSession.id },
      data: {
        absoluteExpiresAt: new Date(Date.now() - 1000 * 60), // 1 menit yang lalu
      },
    });

    const validatedAbs = await sessionService.validateSession(absToken);
    expect(validatedAbs).toBeNull();
  });

  it("6. ganti kata sandi wajib mencabut seluruh sesi lain pengguna", async () => {
    // Buat 2 sesi aktif untuk pengguna ini
    const { rawToken: token1, session: s1 } = await sessionService.createSession(
      pwdChangeUserId,
      "127.0.0.1"
    );
    const { rawToken: token2 } = await sessionService.createSession(
      pwdChangeUserId,
      "127.0.0.1"
    );

    // 6a. Password baru kurang dari PASSWORD_MIN_LENGTH ditolak
    const shortResult = await authService.changePassword({
      userId: pwdChangeUserId,
      currentSessionId: s1.id,
      currentPassword: validPassword,
      newPassword: "x".repeat(PASSWORD_MIN_LENGTH - 1),
      confirmPassword: "x".repeat(PASSWORD_MIN_LENGTH - 1),
      userIp: "127.0.0.1",
    });
    expect(shortResult.success).toBe(false);
    expect(shortResult.error).toContain(String(PASSWORD_MIN_LENGTH));

    // Eksekusi ganti kata sandi valid menggunakan sesi 1
    const changeResult = await authService.changePassword({
      userId: pwdChangeUserId,
      currentSessionId: s1.id,
      currentPassword: validPassword,
      newPassword: newValidPassword,
      confirmPassword: newValidPassword,
      userIp: "127.0.0.1",
    });

    expect(changeResult.success).toBe(true);

    // Sesi 1 (sesi aktif saat ini) harus tetap valid
    const validated1 = await sessionService.validateSession(token1);
    expect(validated1).not.toBeNull();

    // Sesi 2 (sesi di perangkat lain) WAJIB telah dicabut
    const validated2 = await sessionService.validateSession(token2);
    expect(validated2).toBeNull();

    // Status mustChangePassword pengguna berubah menjadi false
    const updatedUser = await prisma.user.findUnique({
      where: { id: pwdChangeUserId },
    });
    expect(updatedUser?.mustChangePassword).toBe(false);
  });

  it("7. pengalihan URL eksternal berbahaya ditolak dan diarahkan ke path aman", () => {
    expect(sanitizeRedirectPath("https://hacker.com/malicious")).toBe("/admin");
    expect(sanitizeRedirectPath("//phishing.org")).toBe("/admin");
    expect(sanitizeRedirectPath("/\\phishing.org")).toBe("/admin");
    expect(sanitizeRedirectPath("/admin/transaksi")).toBe("/admin/transaksi");
  });
});
