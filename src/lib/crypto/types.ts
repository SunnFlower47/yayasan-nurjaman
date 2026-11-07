/**
 * src/lib/crypto/types.ts
 * Tipe data untuk modul kriptografi enkripsi kolom AES-256-GCM.
 */

export interface EncryptionContext {
  table: string;
  column: string;
  rowId: string;
}

export type KeyRing = Map<string, Buffer>;
