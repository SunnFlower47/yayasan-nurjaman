import { describe, it, expect } from "vitest";
import {
  normalizeIp,
  generateSessionToken,
  hashSessionToken,
  validatePasswordPolicy,
  sanitizeRedirectPath,
  PASSWORD_MIN_LENGTH,
} from "@/modules/auth";

describe("Unit Tests: Utilitas Modul Autentikasi dan Keamanan", () => {
  describe("Normalisasi Alamat IP (IPv6 /64 dan IPv4)", () => {
    it("menormalisasi IPv6 lengkap ke prefiks subnet /64", () => {
      const ip = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
      const normalized = normalizeIp(ip);
      expect(normalized).toBe("2001:db8:85a3:0::/64");
    });

    it("menormalisasi IPv6 terkompresi (::) ke prefiks subnet /64", () => {
      const ip = "2001:db8::1";
      const normalized = normalizeIp(ip);
      expect(normalized).toBe("2001:db8:0:0::/64");
    });

    it("menormalisasi IPv6 localhost (::1) ke prefiks subnet /64", () => {
      const ip = "::1";
      const normalized = normalizeIp(ip);
      expect(normalized).toBe("0:0:0:0::/64");
    });

    it("menormalisasi IPv4-mapped IPv6 ke format IPv4 murni", () => {
      const ip = "::ffff:192.168.1.100";
      const normalized = normalizeIp(ip);
      expect(normalized).toBe("192.168.1.100");
    });

    it("mempertahankan format IPv4 standar", () => {
      const ip = "10.0.0.1";
      const normalized = normalizeIp(ip);
      expect(normalized).toBe("10.0.0.1");
    });
  });

  describe("Token Sesi Kriptografis", () => {
    it("menghasilkan token acak 256-bit (64 karakter heksadesimal)", () => {
      const token = generateSessionToken();
      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
    });

    it("menghasilkan hash SHA-256 yang konsisten dan deterministik", () => {
      const token = "a".repeat(64);
      const hash1 = hashSessionToken(token);
      const hash2 = hashSessionToken(token);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash1).not.toBe(token);
    });
  });

  describe("Validasi Kebijakan Kata Sandi", () => {
    it("menolak kata sandi kurang dari batas minimum 12 karakter", () => {
      const result = validatePasswordPolicy("Pendek123!");
      expect(result.valid).toBe(false);
      expect(result.error).toContain(String(PASSWORD_MIN_LENGTH));
    });

    it("menolak kata sandi yang memuat username", () => {
      const result = validatePasswordPolicy("SuperAdminSecret2026!", {
        username: "admin",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("username");
    });

    it("menolak kata sandi yang memuat prefix email", () => {
      const result = validatePasswordPolicy("sekretarisYayasan2026!", {
        email: "sekretaris@yayasan-nurjaman.org",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("email");
    });

    it("menolak kata sandi pasaran yang ada di daftar lokal", () => {
      const result = validatePasswordPolicy("password123456");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("umum");
    });

    it("menerima kata sandi yang kuat dan unik", () => {
      const result = validatePasswordPolicy("Kunci#Aman@Nurjaman2026Purwakarta", {
        username: "budi",
        email: "budi@yayasan-nurjaman.org",
      });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("Sanitasi Path Pengalihan (next)", () => {
    it("menerima path internal relatif", () => {
      expect(sanitizeRedirectPath("/admin")).toBe("/admin");
      expect(sanitizeRedirectPath("/admin/pengaturan")).toBe("/admin/pengaturan");
    });

    it("menolak URL absolut dan open redirect", () => {
      expect(sanitizeRedirectPath("https://evil.com")).toBe("/admin");
      expect(sanitizeRedirectPath("http://attacker.org/admin")).toBe("/admin");
      expect(sanitizeRedirectPath("//evil.com")).toBe("/admin");
      expect(sanitizeRedirectPath("/\\evil.com")).toBe("/admin");
      expect(sanitizeRedirectPath(null)).toBe("/admin");
    });
  });
});
