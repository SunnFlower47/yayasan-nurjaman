/**
 * src/modules/auth/schemas/login.schema.ts
 * Skema validasi Zod untuk formulir login pengurus.
 */

import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username wajib diisi")
    .max(32, "Username maksimal 32 karakter"),
  password: z
    .string()
    .min(1, "Password wajib diisi")
    .max(128, "Password maksimal 128 karakter"),
  next: z.string().max(2048, "URL tujuan maksimal 2048 karakter").optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
