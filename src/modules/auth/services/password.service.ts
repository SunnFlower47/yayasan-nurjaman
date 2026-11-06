/**
 * src/modules/auth/services/password.service.ts
 * Layanan hashing dan verifikasi kata sandi berbasis Argon2id.
 * Memuat mitigasi timing attack via hash dummy (docs/SECURITY.md & ADR-011).
 */

import { hash, verify } from "@node-rs/argon2";

// Hash dummy Argon2id prekomputasi untuk mitigasi serangan timing attack
const DUMMY_ARGON2_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$dwW7FnIGuciyiePX1QlF0Q$WUoQcxnMOX79fk2/DfLbOvJWWxOR7An8g0RsNrDL5So";

const ARGON2_CONFIG = {
  memoryCost: 65536, // 64 MB
  timeCost: 3, // 3 iterasi
  parallelism: 4, // 4 thread
  algorithm: 2, // Argon2id
};

export class PasswordService {
  /**
   * Meng-hash kata sandi baru menggunakan standar Argon2id yayasan.
   */
  async hash(password: string): Promise<string> {
    return hash(password, ARGON2_CONFIG);
  }

  /**
   * Memverifikasi kecocokan kata sandi terhadap hash tersimpan.
   */
  async verify(password: string, storedHash: string): Promise<boolean> {
    try {
      return await verify(storedHash, password);
    } catch {
      return false;
    }
  }

  /**
   * Menjalankan verifikasi palsu terhadap hash dummy.
   * Dipanggil saat username tidak ditemukan atau akun disabled agar
   * durasi respons komputasi identik dan tidak membocorkan keberadaan akun.
   */
  async verifyDummy(password: string): Promise<boolean> {
    try {
      await verify(DUMMY_ARGON2_HASH, password);
    } catch {
      // Selalu gagal
    }
    return false;
  }
}

export const passwordService = new PasswordService();
