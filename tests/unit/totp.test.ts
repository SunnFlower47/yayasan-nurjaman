import { describe, it, expect } from "vitest";
import {
  calculateTotpCode,
  verifyTotpCode,
  encodeBase32,
  decodeBase32,
  generateTotpSecret,
} from "@/modules/auth/helpers/totp";
import {
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
} from "@/modules/auth/helpers/recovery-codes";

describe("Unit Test: Mesin TOTP RFC 6238 dan Kode Pemulihan Darurat", () => {
  // Vektor Uji Resmi RFC 6238 Appendix B
  const rfcSecret = Buffer.from("12345678901234567890", "ascii");

  it("1. vektor uji RFC 6238: secret ASCII '12345678901234567890' pada time=59s (step=1) menghasilkan '287082'", () => {
    const code = calculateTotpCode(rfcSecret, 1n);
    expect(code).toBe("287082");

    const result = verifyTotpCode(rfcSecret, "287082", { timeInSeconds: 59 });
    expect(result.valid).toBe(true);
    expect(result.verifiedStep).toBe(1n);
  });

  it("2. toleransi waktu ±1 step (30 detik sebelum dan sesudah) diterima", () => {
    // Pada time = 90s, step = 3
    const codePrev = calculateTotpCode(rfcSecret, 2n); // step 2
    const codeCurr = calculateTotpCode(rfcSecret, 3n); // step 3
    const codeNext = calculateTotpCode(rfcSecret, 4n); // step 4
    const codeTooOld = calculateTotpCode(rfcSecret, 1n); // step 1 (2 langkah di belakang)

    expect(verifyTotpCode(rfcSecret, codePrev, { timeInSeconds: 90 }).valid).toBe(true);
    expect(verifyTotpCode(rfcSecret, codeCurr, { timeInSeconds: 90 }).valid).toBe(true);
    expect(verifyTotpCode(rfcSecret, codeNext, { timeInSeconds: 90 }).valid).toBe(true);
    expect(verifyTotpCode(rfcSecret, codeTooOld, { timeInSeconds: 90 }).valid).toBe(
      false
    );
  });

  it("3. replay attack ditolak bila langkah waktu sama atau lebih lama dari lastUsedStep", () => {
    // Pada time = 60s (step = 2)
    const code = calculateTotpCode(rfcSecret, 2n);

    // Pertama kali verifikasi tanpa lastUsedStep
    const firstCheck = verifyTotpCode(rfcSecret, code, { timeInSeconds: 60 });
    expect(firstCheck.valid).toBe(true);
    expect(firstCheck.verifiedStep).toBe(2n);

    // Verifikasi ulang dengan lastUsedStep = 2n ditolak mutlak
    const replayCheck = verifyTotpCode(rfcSecret, code, {
      timeInSeconds: 60,
      lastUsedStep: 2n,
    });
    expect(replayCheck.valid).toBe(false);
    expect(replayCheck.error).toContain("replay");
  });

  it("4. Base32 encode dan decode round-trip mempertahankan 20 byte secret acak", () => {
    const rawSecret = generateTotpSecret();
    expect(rawSecret.length).toBe(20);

    const encoded = encodeBase32(rawSecret);
    expect(encoded).toMatch(/^[A-Z2-7]+$/);

    const decoded = decodeBase32(encoded);
    expect(decoded.equals(rawSecret)).toBe(true);
  });

  it("5. pembuat kode pemulihan menghasilkan 10 kode unik dengan format XXXX-XXXX-XXXX", () => {
    const codes = generateRecoveryCodes(10);
    expect(codes.length).toBe(10);

    const set = new Set(codes);
    expect(set.size).toBe(10);

    for (const code of codes) {
      expect(code).toMatch(
        /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/
      );
    }
  });

  it("6. hash dan verifikasi kode pemulihan berfungsi dengan baik", () => {
    const rawCode = "ABCD-EFGH-JKLM";
    const hash = hashRecoveryCode(rawCode);

    expect(verifyRecoveryCode("abcd-efgh-jklm", hash)).toBe(true);
    expect(verifyRecoveryCode("ABCDEFGHJKLM", hash)).toBe(true);
    expect(verifyRecoveryCode("WRONG-CODE-9999", hash)).toBe(false);
  });
});
