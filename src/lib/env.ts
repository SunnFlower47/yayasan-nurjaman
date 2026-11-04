import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Yayasan Nurjaman Bongas Purwakarta"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi untuk koneksi PostgreSQL"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse({
    NODE_ENV: process.env["NODE_ENV"],
    PORT: process.env["PORT"],
    NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"],
    NEXT_PUBLIC_APP_NAME: process.env["NEXT_PUBLIC_APP_NAME"],
    DATABASE_URL: process.env["DATABASE_URL"],
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
