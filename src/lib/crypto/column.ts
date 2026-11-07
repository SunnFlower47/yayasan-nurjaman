/**
 * src/lib/crypto/column.ts
 * Enkripsi dan dekripsi tingkat kolom menggunakan AES-256-GCM terotasi.
 */

import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { env } from "@/lib/env";
import { parseKeyRing } from "./keyring";
import type { EncryptionContext, KeyRing } from "./types";

const NONCE_LEN = 12;
const TAG_LEN = 16;

let defaultKeyRing: KeyRing | null = null;

function getDefaultKeyRing(): KeyRing {
  if (!defaultKeyRing) {
    defaultKeyRing = parseKeyRing(env.ENCRYPTION_KEYS);
  }
  return defaultKeyRing;
}

function buildAad(context: EncryptionContext): Buffer {
  return Buffer.from(`${context.table}:${context.column}:${context.rowId}`, "utf8");
}

export function encryptColumn(
  plaintext: Buffer | string,
  context: EncryptionContext,
  customKeyRing?: KeyRing,
  customActiveId?: string
): Buffer {
  const activeId = customActiveId ?? env.ENCRYPTION_KEY_ACTIVE_ID;
  const keyRing = customKeyRing ?? getDefaultKeyRing();

  const key = keyRing.get(activeId);
  if (!key) {
    throw new Error(`Kunci aktif "${activeId}" tidak ditemukan dalam key ring.`);
  }

  const nonce = randomBytes(NONCE_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(buildAad(context));

  const plaintextBuf = Buffer.isBuffer(plaintext)
    ? plaintext
    : Buffer.from(plaintext, "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintextBuf), cipher.final()]);
  const tag = cipher.getAuthTag();

  const keyIdBuf = Buffer.from(activeId, "utf8");
  if (keyIdBuf.length > 255) {
    throw new Error("Panjang key_id tidak boleh melebihi 255 byte.");
  }

  const lenBuf = Buffer.from([keyIdBuf.length]);
  return Buffer.concat([lenBuf, keyIdBuf, nonce, ciphertext, tag]);
}

export function decryptColumn(
  payload: Buffer | Uint8Array,
  context: EncryptionContext,
  customKeyRing?: KeyRing
): Buffer {
  const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  if (buf.length < 1 + NONCE_LEN + TAG_LEN) {
    throw new Error("Payload ciphertext korup atau tidak lengkap.");
  }

  const keyIdLen = buf.readUInt8(0);
  const minRequiredLen = 1 + keyIdLen + NONCE_LEN + TAG_LEN;
  if (buf.length < minRequiredLen) {
    throw new Error("Payload ciphertext korup: ukuran lebih pendek dari header wajib.");
  }

  const keyId = buf.subarray(1, 1 + keyIdLen).toString("utf8");
  const nonceStart = 1 + keyIdLen;
  const nonce = buf.subarray(nonceStart, nonceStart + NONCE_LEN);
  const ciphertext = buf.subarray(nonceStart + NONCE_LEN, buf.length - TAG_LEN);
  const tag = buf.subarray(buf.length - TAG_LEN);

  const keyRing = customKeyRing ?? getDefaultKeyRing();
  const key = keyRing.get(keyId);
  if (!key) {
    throw new Error(
      `Kunci dekripsi dengan id "${keyId}" tidak ditemukan dalam key ring.`
    );
  }

  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAAD(buildAad(context));
  decipher.setAuthTag(tag);

  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new Error("Gagal mendekripsi kolom: integritas data atau AAD tidak valid.");
  }
}
