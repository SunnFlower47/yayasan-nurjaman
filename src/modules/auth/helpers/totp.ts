/**
 * src/modules/auth/helpers/totp.ts
 * Implementasi TOTP RFC 6238 (HMAC-SHA1, 6 digit, 30 detik) dan pembangkit QR lokal.
 */

import { randomBytes, createHmac } from "crypto";
import QRCode from "qrcode";

const STEP_SECONDS = 30;
const DIGITS = 6;
const MODULO = 10 ** DIGITS;

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function encodeBase32(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i] ?? 0;
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function decodeBase32(str: string): Buffer {
  const cleanStr = str.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanStr.length; i++) {
    const char = cleanStr[i] ?? "";
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function generateTotpSecret(): Buffer {
  // 20 byte (160-bit) acak kriptografis sesuai rekomendasi RFC 6238
  return randomBytes(20);
}

export function calculateTotpCode(secret: Buffer, step: bigint): string {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(step);

  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = (hmac[19] ?? 0) & 0x0f;

  const binary =
    (((hmac[offset] ?? 0) & 0x7f) << 24) |
    (((hmac[offset + 1] ?? 0) & 0xff) << 16) |
    (((hmac[offset + 2] ?? 0) & 0xff) << 8) |
    ((hmac[offset + 3] ?? 0) & 0xff);

  const codeNum = binary % MODULO;
  return codeNum.toString().padStart(DIGITS, "0");
}

export function verifyTotpCode(
  secret: Buffer,
  code: string,
  options?: {
    timeInSeconds?: number;
    lastUsedStep?: bigint | null;
  }
): { valid: boolean; verifiedStep?: bigint; error?: string } {
  const cleanCode = code.trim().replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleanCode)) {
    return { valid: false, error: "Kode harus berupa 6 digit angka." };
  }

  const currentSec = options?.timeInSeconds ?? Math.floor(Date.now() / 1000);
  const currentStep = BigInt(Math.floor(currentSec / STEP_SECONDS));
  const lastUsed = options?.lastUsedStep ?? null;

  // Toleransi ±1 step (30 detik sebelum dan sesudah)
  const stepsToTest = [currentStep, currentStep - 1n, currentStep + 1n];

  for (const step of stepsToTest) {
    const candidateCode = calculateTotpCode(secret, step);
    if (candidateCode === cleanCode) {
      if (lastUsed !== null && step <= lastUsed) {
        return {
          valid: false,
          error: "Kode TOTP sudah pernah digunakan sebelumnya (pencegahan replay).",
        };
      }
      return { valid: true, verifiedStep: step };
    }
  }

  return {
    valid: false,
    error: "Kode verifikasi 2FA tidak valid atau sudah kedaluwarsa.",
  };
}

export function buildTotpUri(
  username: string,
  base32Secret: string,
  issuer = "Yayasan Nurjaman"
): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(username)}`;
  return `otpauth://totp/${label}?secret=${base32Secret}&issuer=${encodeURIComponent(
    issuer
  )}&algorithm=SHA1&digits=6&period=30`;
}

export async function generateTotpQrDataUrl(totpUri: string): Promise<string> {
  return QRCode.toDataURL(totpUri, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 240,
    color: {
      dark: "#065f46", // Emerald 800 sesuai identitas UI-UX yayasan
      light: "#ffffff",
    },
  });
}
