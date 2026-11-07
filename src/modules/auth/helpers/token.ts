/**
 * src/modules/auth/helpers/token.ts
 * Utilitas pembuatan dan peng-hash-an token sesi berentropi tinggi.
 */

import { randomBytes, createHash } from "node:crypto";
import { SESSION_TOKEN_BYTES } from "../constants";

/**
 * Menghasilkan token sesi acak berentropi 256-bit (32 byte) berbasis crypto.
 */
export function generateSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("hex");
}

/**
 * Menghasilkan hash SHA-256 dari token mentah untuk disimpan pada basis data.
 * Token mentah tidak pernah disimpan di tabel sessions demi keamanan saat DB bocor.
 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
