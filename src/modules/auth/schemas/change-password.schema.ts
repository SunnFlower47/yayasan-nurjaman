/**
 * src/modules/auth/schemas/change-password.schema.ts
 * Skema validasi Zod untuk formulir penggantian kata sandi wajib.
 */

import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "../constants";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi"),
    newPassword: z
      .string()
      .min(
        PASSWORD_MIN_LENGTH,
        `Kata sandi baru minimal harus ${PASSWORD_MIN_LENGTH} karakter`
      ),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi baru tidak sesuai",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
