import { z } from "zod";

function validateKeyRing(
  data: { ENCRYPTION_KEYS: string; ENCRYPTION_KEY_ACTIVE_ID: string },
  ctx: z.RefinementCtx
): void {
  const rawKeys = data.ENCRYPTION_KEYS.trim();
  if (!rawKeys) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ENCRYPTION_KEYS"],
      message: "ENCRYPTION_KEYS tidak boleh kosong.",
    });
    return;
  }

  const keyRing = new Map<string, Buffer>();
  const pairs = rawKeys
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  for (const pair of pairs) {
    const colonIdx = pair.indexOf(":");
    if (colonIdx <= 0 || colonIdx === pair.length - 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ENCRYPTION_KEYS"],
        message: `Format entri kunci "${pair}" tidak valid. Format wajib "id:base64".`,
      });
      return;
    }

    const id = pair.slice(0, colonIdx).trim();
    const base64Key = pair.slice(colonIdx + 1).trim();
    const keyBuf = Buffer.from(base64Key, "base64");

    if (keyBuf.length !== 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ENCRYPTION_KEYS"],
        message: `Kunci "${id}" harus tepat berukuran 32 byte (256-bit AES).`,
      });
      return;
    }

    keyRing.set(id, keyBuf);
  }

  if (!keyRing.has(data.ENCRYPTION_KEY_ACTIVE_ID)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ENCRYPTION_KEY_ACTIVE_ID"],
      message: `ENCRYPTION_KEY_ACTIVE_ID "${data.ENCRYPTION_KEY_ACTIVE_ID}" tidak ditemukan dalam ENCRYPTION_KEYS.`,
    });
  }
}

export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3000),
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Yayasan Nurjaman Bongas Purwakarta"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi untuk koneksi PostgreSQL"),
    ENCRYPTION_KEY_ACTIVE_ID: z
      .string()
      .min(1, "ENCRYPTION_KEY_ACTIVE_ID wajib diisi untuk enkripsi kolom"),
    ENCRYPTION_KEYS: z
      .string()
      .min(1, "ENCRYPTION_KEYS wajib diisi untuk enkripsi kolom"),
  })
  .superRefine(validateKeyRing);

export type Env = z.infer<typeof envSchema>;

export function validateEnv(customEnv?: Record<string, string | undefined>): Env {
  const source = customEnv ?? process.env;
  const parsed = envSchema.safeParse({
    NODE_ENV: source["NODE_ENV"],
    PORT: source["PORT"],
    NEXT_PUBLIC_APP_URL: source["NEXT_PUBLIC_APP_URL"],
    NEXT_PUBLIC_APP_NAME: source["NEXT_PUBLIC_APP_NAME"],
    DATABASE_URL: source["DATABASE_URL"],
    ENCRYPTION_KEY_ACTIVE_ID: source["ENCRYPTION_KEY_ACTIVE_ID"],
    ENCRYPTION_KEYS: source["ENCRYPTION_KEYS"],
  });

  if (!parsed.success) {
    console.error(
      "❌ Konfigurasi Environment Variables Tidak Valid:\n",
      JSON.stringify(parsed.error.format(), null, 2)
    );
    throw new Error("Gagal memuat konfigurasi aplikasi. Harap periksa file .env Anda.");
  }

  return parsed.data;
}

export const env = validateEnv();
