import { describe, it, expect } from "vitest";
import { encryptColumn, decryptColumn, parseKeyRing } from "@/lib/crypto";
import { validateEnv } from "@/lib/env";

describe("Unit Test: Enkripsi Kolom AES-256-GCM dengan Key Ring Terotasi", () => {
  const k1 = "XSH9aj9tlmpITmISXrRFOd1yQB3H+DjEr/ZIFO9m3uc=";
  const k2 = "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI="; // 32 bytes in base64
  const keyRing = parseKeyRing(`k1:${k1},k2:${k2}`);

  const sampleContext = {
    table: "two_factor_secrets",
    column: "secret",
    rowId: "123e4567-e89b-12d3-a456-426614174000",
  };

  it("1. round trip enkripsi dan dekripsi menghasilkan plaintext yang sama", () => {
    const secretText = "JBSWY3DPEHPK3PXP";
    const encrypted = encryptColumn(secretText, sampleContext, keyRing, "k1");
    expect(Buffer.isBuffer(encrypted)).toBe(true);

    const decrypted = decryptColumn(encrypted, sampleContext, keyRing);
    expect(decrypted.toString("utf8")).toBe(secretText);
  });

  it("2. ciphertext diubah (tamper) menyebabkan dekripsi gagal", () => {
    const encrypted = encryptColumn("rahasia-sensitif", sampleContext, keyRing, "k1");
    // Modifikasi satu byte di area ciphertext
    const tampered = Buffer.from(encrypted);
    tampered[15] = (tampered[15] ?? 0) ^ 0xff;

    expect(() => decryptColumn(tampered, sampleContext, keyRing)).toThrow(
      "Gagal mendekripsi kolom: integritas data atau AAD tidak valid."
    );
  });

  it("3. AAD salah (tabel/kolom/rowId berbeda) menyebabkan dekripsi ditolak", () => {
    const encrypted = encryptColumn("rahasia-sensitif", sampleContext, keyRing, "k1");

    const wrongRowContext = {
      ...sampleContext,
      rowId: "999e4567-e89b-12d3-a456-426614174999",
    };
    expect(() => decryptColumn(encrypted, wrongRowContext, keyRing)).toThrow(
      "Gagal mendekripsi kolom: integritas data atau AAD tidak valid."
    );

    const wrongColContext = {
      ...sampleContext,
      column: "other_secret",
    };
    expect(() => decryptColumn(encrypted, wrongColContext, keyRing)).toThrow(
      "Gagal mendekripsi kolom: integritas data atau AAD tidak valid."
    );
  });

  it("4. key ID tidak terdaftar dalam key ring menyebabkan dekripsi gagal", () => {
    const encrypted = encryptColumn("data", sampleContext, keyRing, "k1");
    // Key ring yang hanya memuat k2 tanpa k1
    const singleKeyRing = parseKeyRing(`k2:${k2}`);

    expect(() => decryptColumn(encrypted, sampleContext, singleKeyRing)).toThrow(
      'Kunci dekripsi dengan id "k1" tidak ditemukan dalam key ring.'
    );
  });

  it("5. rotasi kunci: data lama terenkripsi k1 tetap didekripsi, enkripsi baru memakai k2", () => {
    const oldSecret = "kunci-lama-sebelum-rotasi";
    const oldEncrypted = encryptColumn(oldSecret, sampleContext, keyRing, "k1");

    const newSecret = "kunci-baru-setelah-rotasi";
    const newEncrypted = encryptColumn(newSecret, sampleContext, keyRing, "k2");

    // Dekripsi keduanya menggunakan key ring gabungan berhasil
    expect(decryptColumn(oldEncrypted, sampleContext, keyRing).toString("utf8")).toBe(
      oldSecret
    );
    expect(decryptColumn(newEncrypted, sampleContext, keyRing).toString("utf8")).toBe(
      newSecret
    );
  });

  it("6. aplikasi gagal start bila ENCRYPTION_KEYS kosong atau tidak valid", () => {
    expect(() =>
      validateEnv({
        NODE_ENV: "test",
        DATABASE_URL: "postgresql://localhost:5432/db",
        ENCRYPTION_KEY_ACTIVE_ID: "k1",
        ENCRYPTION_KEYS: "",
      })
    ).toThrow();

    expect(() =>
      validateEnv({
        NODE_ENV: "test",
        DATABASE_URL: "postgresql://localhost:5432/db",
        ENCRYPTION_KEY_ACTIVE_ID: "k_non_existent",
        ENCRYPTION_KEYS: `k1:${k1}`,
      })
    ).toThrow();
  });
});
