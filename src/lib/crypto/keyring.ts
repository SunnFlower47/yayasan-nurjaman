/**
 * src/lib/crypto/keyring.ts
 * Parser dan pengelola key ring rotasi kunci AES-256-GCM.
 */

import type { KeyRing } from "./types";

function parseSingleKeyEntry(pair: string): [string, Buffer] {
  const colonIdx = pair.indexOf(":");
  if (colonIdx <= 0 || colonIdx === pair.length - 1) {
    throw new Error(
      `Format entri kunci tidak valid: "${pair}". Format wajib "id:base64".`
    );
  }

  const id = pair.slice(0, colonIdx).trim();
  const base64Key = pair.slice(colonIdx + 1).trim();

  if (!id || !base64Key) {
    throw new Error(`Entri kunci tidak lengkap: "${pair}".`);
  }

  const keyBuf = Buffer.from(base64Key, "base64");
  if (keyBuf.length !== 32) {
    throw new Error(
      `Kunci "${id}" harus tepat berukuran 32 byte (256-bit AES), aktual: ${keyBuf.length} byte.`
    );
  }

  return [id, keyBuf];
}

export function parseKeyRing(rawKeys: string): KeyRing {
  if (!rawKeys || typeof rawKeys !== "string" || !rawKeys.trim()) {
    throw new Error("ENCRYPTION_KEYS tidak boleh kosong.");
  }

  const pairs = rawKeys
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (pairs.length === 0) {
    throw new Error("ENCRYPTION_KEYS tidak memuat pasangan kunci yang valid.");
  }

  const keyRing: KeyRing = new Map();
  for (const pair of pairs) {
    const [id, keyBuf] = parseSingleKeyEntry(pair);
    keyRing.set(id, keyBuf);
  }

  return keyRing;
}
