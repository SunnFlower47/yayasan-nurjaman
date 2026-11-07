/**
 * src/modules/auth/helpers/recovery-codes.ts
 * Pembangkitan dan validasi kode pemulihan darurat 2FA (Recovery Codes).
 */

import { randomBytes, createHash } from "crypto";

const SAFE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 32 karakter bebas ambiguitas (tanpa 0, 1, I, O)
const CODE_COUNT = 10;

export function normalizeRecoveryCode(rawCode: string): string {
  return rawCode.toUpperCase().replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/g, "");
}

export function generateRecoveryCodes(count = CODE_COUNT): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(12);
    let codeStr = "";
    for (let b = 0; b < 12; b++) {
      const byteVal = bytes[b] ?? 0;
      codeStr += SAFE_CHARS[byteVal % SAFE_CHARS.length];
    }
    // Format terbaca manusia: XXXX-XXXX-XXXX
    const formatted = `${codeStr.slice(0, 4)}-${codeStr.slice(4, 8)}-${codeStr.slice(8, 12)}`;
    codes.push(formatted);
  }

  return codes;
}

export function hashRecoveryCode(code: string): string {
  const normalized = normalizeRecoveryCode(code);
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function verifyRecoveryCode(inputCode: string, storedHash: string): boolean {
  const normalized = normalizeRecoveryCode(inputCode);
  const inputHash = createHash("sha256").update(normalized, "utf8").digest("hex");
  return inputHash === storedHash;
}
