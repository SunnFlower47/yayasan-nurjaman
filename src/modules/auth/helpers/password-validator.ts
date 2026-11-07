/**
 * src/modules/auth/helpers/password-validator.ts
 * Validasi kebijakan keamanan kata sandi sesuai docs/SECURITY.md.
 */

import fs from "node:fs";
import path from "node:path";
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "../constants";

let cachedCommonPasswords: Set<string> | null = null;

function getCommonPasswordsSet(): Set<string> {
  if (cachedCommonPasswords) {
    return cachedCommonPasswords;
  }

  try {
    const filePath = path.join(
      process.cwd(),
      "src",
      "modules",
      "auth",
      "data",
      "common-passwords.txt"
    );
    const content = fs.readFileSync(filePath, "utf-8");
    cachedCommonPasswords = new Set(
      content
        .split("\n")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );
  } catch {
    cachedCommonPasswords = new Set();
  }

  return cachedCommonPasswords;
}

export interface PasswordValidationResult {
  valid: boolean;
  error?: string | undefined;
}

function hasUsernameCollision(password: string, username?: string): boolean {
  if (!username) return false;
  const lowerUser = username.toLowerCase();
  return password === lowerUser || password.includes(lowerUser);
}

function hasEmailCollision(password: string, email?: string): boolean {
  if (!email) return false;
  const lowerEmail = email.toLowerCase();
  const prefix = lowerEmail.split("@")[0] || "";
  return password === lowerEmail || (prefix.length >= 3 && password.includes(prefix));
}

/**
 * Memvalidasi apakah kata sandi baru memenuhi standar keamanan yayasan:
 * 1. Minimal 8 karakter, maksimal 128 karakter (passphrase panjang didukung).
 * 2. Tidak boleh sama atau memuat username.
 * 3. Tidak boleh sama atau memuat alamat email.
 * 4. Tidak boleh terdapat dalam daftar ~10.000 kata sandi pasaran lokal.
 */
export function validatePasswordPolicy(
  password: string,
  userContext?: { username?: string; email?: string }
): PasswordValidationResult {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `Kata sandi harus terdiri dari minimal ${PASSWORD_MIN_LENGTH} karakter.`,
    };
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      valid: false,
      error: `Kata sandi tidak boleh melebihi ${PASSWORD_MAX_LENGTH} karakter.`,
    };
  }

  const lowerPassword = password.toLowerCase();

  if (hasUsernameCollision(lowerPassword, userContext?.username)) {
    return {
      valid: false,
      error: "Kata sandi tidak boleh memuat atau sama dengan username.",
    };
  }

  if (hasEmailCollision(lowerPassword, userContext?.email)) {
    return {
      valid: false,
      error: "Kata sandi tidak boleh memuat atau sama dengan alamat email.",
    };
  }

  const commonSet = getCommonPasswordsSet();
  if (commonSet.has(lowerPassword)) {
    return {
      valid: false,
      error:
        "Kata sandi terlalu umum dan mudah ditebak. Silakan gunakan kombinasi yang lebih unik.",
    };
  }

  return { valid: true };
}
