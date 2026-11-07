import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { PASSWORD_MIN_LENGTH } from "../../src/modules/auth/constants";

const prisma = new PrismaClient();
const initialAdminPassword = "KunciAman#2026@YayasanNurjamanPurwakarta";

async function resetAdminPassword() {
  const passwordHash = await hash(initialAdminPassword, {
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
    algorithm: 2,
  });

  await prisma.user.updateMany({
    where: { username: "admin" },
    data: {
      passwordHash,
      mustChangePassword: true,
      status: "ACTIVE",
      deletedAt: null,
    },
  });
}

test.describe("E2E Autentikasi Pengurus, Sesi & Ganti Sandi Wajib", () => {
  test.beforeEach(async () => {
    await resetAdminPassword();
  });

  test.afterAll(async () => {
    await resetAdminPassword();
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

    // Pesan kesalahan ramah dan generik
    const alertLocator = page.locator("form [role='alert']");
    await expect(alertLocator).toBeVisible();
    await expect(alertLocator).toContainText("Username atau password salah");

    // Cookie sesi tidak boleh terpasang
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name === "session" || c.name === "__Host-session"
    );
    expect(sessionCookie).toBeUndefined();
  });

  test("4. alur lengkap: login awal, verifikasi atribut cookie, wajib ganti sandi, hingga masuk /admin", async ({
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

    // 2. Wajib diarahkan ke halaman /ganti-password
    await expect(page).toHaveURL(/\/ganti-password/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Perbarui Kata Sandi");

    // Verifikasi pesan antarmuka formulir konsisten dengan nilai PASSWORD_MIN_LENGTH
    const newPwdInput = page.locator("input[name='newPassword']");
    await expect(newPwdInput).toHaveAttribute(
      "placeholder",
      `Minimal ${PASSWORD_MIN_LENGTH} karakter aman`
    );

    // 3. Verifikasi atribut keamanan cookie sesi
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name === "session" || c.name === "__Host-session"
    );
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.sameSite).toBe("Lax");
    expect(sessionCookie?.path).toBe("/");

    // 4. Isi formulir ganti kata sandi dengan kombinasi baru yang aman
    const newSecurePassword = "SandiBaru#2026@YayasanPurwakarta";
    await page.fill("input[name='currentPassword']", initialAdminPassword);
    await page.fill("input[name='newPassword']", newSecurePassword);
    await page.fill("input[name='confirmPassword']", newSecurePassword);
    await page.click("button[type='submit']");

    // 5. Setelah berhasil, otomatis diarahkan ke /admin
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Halo,");

    // 5b. Navigasi melalui layout sidebar admin ke halaman Jejak Audit
    await expect(page.locator("aside")).toBeVisible();
    await page.click("a:has-text('Jejak Audit')");
    await expect(page).toHaveURL(/\/admin\/audit/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Jejak Audit Sistem");

    // 6. Tombol keluar mencabut sesi dan mengembalikan pengguna ke /masuk
    await page.click("button:has-text('Keluar')");
    await expect(page).toHaveURL(/\/masuk/);

    // 7. Sesi telah dicabut, akses ke /admin kembali ditolak
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/masuk/);

    // 8. Pastikan nol pelanggaran CSP sepanjang alur navigasi
    expect(cspViolations).toEqual([]);
  });
});
