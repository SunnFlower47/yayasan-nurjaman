import { execSync } from "node:child_process";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { PASSWORD_MIN_LENGTH } from "../../src/modules/auth/constants";
import { calculateTotpCode, decodeBase32 } from "../../src/modules/auth/helpers/totp";

const prisma = new PrismaClient();
const initialAdminPassword = "KunciAman#2026@YayasanNurjamanPurwakarta";
const newSecurePassword = "SandiBaru#2026@YayasanPurwakarta";

async function resetAdminUser() {
  const passwordHash = await hash(initialAdminPassword, {
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
    algorithm: 2,
  });

  try {
    const admin = await prisma.user.findFirst({ where: { username: "admin" } });
    if (admin) {
      await prisma.twoFactorRecoveryCode.deleteMany({ where: { userId: admin.id } });
      await prisma.twoFactorSecret.deleteMany({ where: { userId: admin.id } });
      await prisma.session.deleteMany({ where: { userId: admin.id } });
      await prisma.user.update({
        where: { id: admin.id },
        data: {
          passwordHash,
          mustChangePassword: true,
          status: "ACTIVE",
          deletedAt: null,
        },
      });
    }
  } catch {
    const sql = `UPDATE users SET password_hash = '${passwordHash}', must_change_password = true, status = 'ACTIVE', deleted_at = NULL WHERE username = 'admin';`;
    execSync(
      `docker exec yayasan_postgres_prod psql -U postgres -d yayasan_db -c "${sql}"`,
      {
        stdio: "pipe",
      }
    );
  }
}

test.describe("E2E Autentikasi Pengurus, Sesi, Ganti Sandi & 2FA TOTP Wajib", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async () => {
    await resetAdminUser();
  });

  test.afterAll(async () => {
    await resetAdminUser();
    await prisma.$disconnect();
  });

  test("1. akses /admin tanpa sesi otomatis diarahkan ke /masuk", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/masuk/);
    await expect(page.locator("h1")).toContainText("Masuk Panel Pengurus");
  });

  test("2. halaman /masuk bebas dari pelanggaran CSP di konsol browser", async ({
    page,
  }) => {
    const cspViolations: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        text.toLowerCase().includes("content security policy") ||
        text.toLowerCase().includes("csp")
      ) {
        cspViolations.push(text);
      }
    });

    await page.goto("/masuk");
    await page.waitForLoadState("networkidle");

    expect(cspViolations).toEqual([]);
    await expect(page.locator("input[name='username']")).toBeVisible();
    await expect(page.locator("input[name='password']")).toBeVisible();
  });

  test("3. login dengan password salah menampilkan pesan kesalahan dan tidak menyetel cookie sesi", async ({
    page,
  }) => {
    await page.goto("/masuk");
    await page.fill("input[name='username']", "admin");
    await page.fill("input[name='password']", "PasswordSalah123!");
    await page.click("button[type='submit']");

    const alertLocator = page.locator("form [role='alert']");
    await expect(alertLocator).toBeVisible();
    await expect(alertLocator).toContainText("Username atau password salah");

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name === "session" || c.name === "__Host-session"
    );
    expect(sessionCookie).toBeUndefined();
  });

  test("4. alur lengkap: login pertama, wajib ganti sandi, enroll 2FA TOTP, login dengan kode, dan jalur recovery code", async ({
    page,
  }) => {
    const cspViolations: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        text.toLowerCase().includes("content security policy") ||
        text.toLowerCase().includes("violated directive")
      ) {
        cspViolations.push(text);
      }
    });

    // 1. Masuk menggunakan akun admin awal (must_change_password = true)
    await page.goto("/masuk");
    await page.fill("input[name='username']", "admin");
    await page.fill("input[name='password']", initialAdminPassword);
    await page.click("button[type='submit']");

    // 2. Diarahkan ke halaman /ganti-password
    await expect(page).toHaveURL(/\/ganti-password/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Perbarui Kata Sandi");

    const newPwdInput = page.locator("input[name='newPassword']");
    await expect(newPwdInput).toHaveAttribute(
      "placeholder",
      `Minimal ${PASSWORD_MIN_LENGTH} karakter aman`
    );

    // 3. Verifikasi atribut keamanan cookie sesi parsial
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name === "session" || c.name === "__Host-session"
    );
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.sameSite).toBe("Lax");
    expect(sessionCookie?.path).toBe("/");
    if (sessionCookie?.name === "__Host-session") {
      expect(sessionCookie.secure).toBe(true);
    }

    // 4. Ubah kata sandi
    await page.fill("input[name='currentPassword']", initialAdminPassword);
    await page.fill("input[name='newPassword']", newSecurePassword);
    await page.fill("input[name='confirmPassword']", newSecurePassword);
    await page.click("button[type='submit']");

    // 5. Setelah ganti kata sandi, otomatis diarahkan ke /2fa/setup karena 2FA belum aktif
    await expect(page).toHaveURL(/\/2fa\/setup/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Penyiapan 2FA TOTP Wajib");

    // 6. Verifikasi QR code tampil sebagai data URL dan kunci manual tersedia
    const qrImage = page.locator("img[alt='Kode QR Autentikator 2FA']");
    await expect(qrImage).toBeVisible();
    const qrSrc = await qrImage.getAttribute("src");
    expect(qrSrc).toMatch(/^data:image\/png;base64,/);

    const secretKeyElem = page.locator("code");
    await expect(secretKeyElem).toBeVisible();
    const secretKey = (await secretKeyElem.innerText()).trim();
    expect(secretKey.length).toBeGreaterThan(15);

    // 7. Hitung kode TOTP yang valid dari secret dan submit form pendaftaran 2FA
    const rawSecret = decodeBase32(secretKey);
    const step = BigInt(Math.floor(Date.now() / 30000));
    const totpCode = calculateTotpCode(rawSecret, step);

    await page.fill("input[name='code']", totpCode);
    await page.click("button[type='submit']");

    // 8. Tampilan 10 kode pemulihan darurat muncul
    await expect(page.locator("text=Simpan Kode Pemulihan Anda!")).toBeVisible({
      timeout: 10000,
    });
    const recoveryCodeElements = page.locator(".grid.grid-cols-2 div");
    const recoveryCodesCount = await recoveryCodeElements.count();
    expect(recoveryCodesCount).toBe(10);

    const firstRecoveryCode = (await recoveryCodeElements.first().innerText()).trim();

    // Checklist konfirmasi penyimpanan kode pemulihan
    await page.check("input[type='checkbox']");
    await page.click("button:has-text('Lanjutkan ke Panel Administrasi')");

    // 9. Masuk ke panel /admin sebagai sesi penuh
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Halo,");

    // 10. Navigasi ke Jejak Audit melalui sidebar
    await expect(page.locator("aside")).toBeVisible();
    await page.click("a:has-text('Jejak Audit')");
    await expect(page).toHaveURL(/\/admin\/audit/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Jejak Audit Sistem");

    // 11. Navigasi ke Keamanan Akun melalui sidebar
    await page.click("a:has-text('Keamanan 2FA')");
    await expect(page).toHaveURL(/\/admin\/keamanan/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Pengaturan Keamanan Akun");
    await expect(page.locator("text=Aktif & Terproteksi")).toBeVisible();

    // 12. Keluar dari akun (logout)
    await page.click("button:has-text('Keluar')");
    await expect(page).toHaveURL(/\/masuk/);

    // 13. Login kedua: username + kata sandi baru -> wajib diarahkan ke /verifikasi-2fa
    await page.fill("input[name='username']", "admin");
    await page.fill("input[name='password']", newSecurePassword);
    await page.click("button[type='submit']");

    await expect(page).toHaveURL(/\/verifikasi-2fa/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Verifikasi Dua Faktor");

    // Masukkan kode TOTP baru (langkah waktu + 1 dalam toleransi ±1 langkah untuk mencegah anti-replay step yang sama)
    const step2 = BigInt(Math.floor(Date.now() / 30000)) + 1n;
    const totpCode2 = calculateTotpCode(rawSecret, step2);
    await page.fill("input[name='code']", totpCode2);
    await page.click("button[type='submit']");

    // Berhasil masuk ke /admin
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Halo,");

    // 14. Uji Jalur Recovery Code: Keluar, login ulang, lalu verifikasi menggunakan kode pemulihan
    await page.click("button:has-text('Keluar')");
    await expect(page).toHaveURL(/\/masuk/);

    await page.fill("input[name='username']", "admin");
    await page.fill("input[name='password']", newSecurePassword);
    await page.click("button[type='submit']");

    await expect(page).toHaveURL(/\/verifikasi-2fa/, { timeout: 10000 });

    // Beralih ke opsi input Recovery Code
    await page.click("button:has-text('Gunakan kode pemulihan')");
    await expect(page.locator("label:has-text('Kode Pemulihan Cadangan')")).toBeVisible();

    await page.fill("input[name='code']", firstRecoveryCode);
    await page.click("button[type='submit']");

    // Berhasil masuk ke /admin via recovery code!
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Halo,");

    // 15. Pastikan tidak ada pelanggaran CSP sepanjang seluruh alur
    expect(cspViolations).toEqual([]);
  });
});
