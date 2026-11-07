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
  password: z.string().min(1, "Password wajib diisi"),
  next: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
