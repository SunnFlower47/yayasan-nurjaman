/**
 * tests/e2e/mfa-http-enforcement.spec.ts
 * Pengujian tingkat HTTP murni untuk penegakan batas keamanan 2FA:
 * Pengguna dengan sesi parsial (mfa_verified_at = null) DILARANG mengakses
 * rute admin atau mengeksekusi Server Action admin.
 */

import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import {
  generateSessionToken,
  hashSessionToken,
} from "../../src/modules/auth/helpers/token";
import { encryptColumn } from "../../src/lib/crypto";

const prisma = new PrismaClient();

const testPassword = "KunciAman#2026@YayasanPurwakarta";
const userUnenrolledName = `http_mfa_none_${Date.now()}`;
const userEnrolledName = `http_mfa_done_${Date.now()}`;

let unEnrolledSessionToken: string;
let enrolledPartialSessionToken: string;
let unEnrolledUserId: string;
let enrolledUserId: string;

test.describe("Penegakan 2FA Tingkat HTTP pada Seluruh Rute Admin", () => {
  test.beforeAll(async () => {
    const passwordHash = await hash(testPassword, {
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
      algorithm: 2,
    });

    const superAdminRole = await prisma.role.findUnique({
      where: { code: "SUPER_ADMIN" },
    });
    if (!superAdminRole) {
      throw new Error("Peran SUPER_ADMIN wajib ada dari seed database.");
    }

    // 1. Pengguna A: Belum enroll 2FA
    const userA = await prisma.user.create({
      data: {
        username: userUnenrolledName,
        email: `${userUnenrolledName}@yayasan-nurjaman.org`,
        name: "HTTP Tester Unenrolled",
        passwordHash,
        mustChangePassword: false,
        status: "ACTIVE",
      },
    });
    unEnrolledUserId = userA.id;
    await prisma.userRole.create({
      data: { userId: userA.id, roleId: superAdminRole.id, assignedBy: userA.id },
    });

    unEnrolledSessionToken = generateSessionToken();
    const tokenHashA = hashSessionToken(unEnrolledSessionToken);
    const now = Date.now();
    await prisma.session.create({
      data: {
        userId: userA.id,
        tokenHash: tokenHashA,
        mfaVerifiedAt: null, // Sesi parsial tanpa 2FA
        idleExpiresAt: new Date(now + 3600000),
        absoluteExpiresAt: new Date(now + 28800000),
      },
    });

    // 2. Pengguna B: Sudah enroll 2FA, tetapi sesi belum menyelesaikan tantangan 2FA
    const userB = await prisma.user.create({
      data: {
        username: userEnrolledName,
        email: `${userEnrolledName}@yayasan-nurjaman.org`,
        name: "HTTP Tester Enrolled Partial",
        passwordHash,
        mustChangePassword: false,
        status: "ACTIVE",
      },
    });
    enrolledUserId = userB.id;
    await prisma.userRole.create({
      data: { userId: userB.id, roleId: superAdminRole.id, assignedBy: userB.id },
    });

    const encryptedSecret = encryptColumn(Buffer.from("12345678901234567890"), {
      table: "two_factor_secrets",
      column: "secret",
      rowId: userB.id,
    });
    await prisma.twoFactorSecret.create({
      data: {
        userId: userB.id,
        secret: new Uint8Array(encryptedSecret),
        confirmedAt: new Date(),
      },
    });

    enrolledPartialSessionToken = generateSessionToken();
    const tokenHashB = hashSessionToken(enrolledPartialSessionToken);
    await prisma.session.create({
      data: {
        userId: userB.id,
        tokenHash: tokenHashB,
        mfaVerifiedAt: null, // Sesi parsial
        idleExpiresAt: new Date(now + 3600000),
        absoluteExpiresAt: new Date(now + 28800000),
      },
    });
  });

  test.afterAll(async () => {
    if (unEnrolledUserId) {
      await prisma.session.deleteMany({ where: { userId: unEnrolledUserId } });
      await prisma.userRole.deleteMany({ where: { userId: unEnrolledUserId } });
      await prisma.user.deleteMany({ where: { id: unEnrolledUserId } });
    }
    if (enrolledUserId) {
      await prisma.twoFactorSecret.deleteMany({ where: { userId: enrolledUserId } });
      await prisma.session.deleteMany({ where: { userId: enrolledUserId } });
      await prisma.userRole.deleteMany({ where: { userId: enrolledUserId } });
      await prisma.user.deleteMany({ where: { id: enrolledUserId } });
    }
    await prisma.$disconnect();
  });

  const adminRoutes = ["/admin", "/admin/audit", "/admin/keamanan"];

  for (const route of adminRoutes) {
    test(`GET ${route} dengan sesi tanpa 2FA (unenrolled) dialihkan ke /2fa/setup`, async ({
      request,
    }) => {
      const response = await request.get(route, {
        headers: {
          Cookie: `session=${unEnrolledSessionToken}; __Host-session=${unEnrolledSessionToken}`,
        },
        maxRedirects: 0,
      });

      // Next.js redirect mengeluarkan status 307
      expect([302, 307]).toContain(response.status());
      const location = response.headers()["location"];
      expect(location).toContain("/2fa/setup");
    });

    test(`GET ${route} dengan sesi parsial (enrolled tapi belum verifikasi 2FA) dialihkan ke /verifikasi-2fa`, async ({
      request,
    }) => {
      const response = await request.get(route, {
        headers: {
          Cookie: `session=${enrolledPartialSessionToken}; __Host-session=${enrolledPartialSessionToken}`,
        },
        maxRedirects: 0,
      });

      expect([302, 307]).toContain(response.status());
      const location = response.headers()["location"];
      expect(location).toContain("/verifikasi-2fa");
    });
  }

  test("Akses browser dengan sesi parsial ditolak dan dialihkan ke penyiapan 2FA", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: "session",
        value: unEnrolledSessionToken,
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/admin/keamanan");
    await expect(page).toHaveURL(/\/2fa\/setup/);
    await expect(page.locator("h1")).toContainText("Penyiapan 2FA TOTP Wajib");
  });
});
