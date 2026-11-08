/**
 * src/modules/auth/schemas/change-password.schema.ts
 * Skema validasi Zod untuk formulir penggantian kata sandi wajib.
 */

import { z } from "zod";
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "../constants";

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Kata sandi saat ini wajib diisi")
      .max(
        PASSWORD_MAX_LENGTH,
        `Kata sandi saat ini maksimal ${PASSWORD_MAX_LENGTH} karakter`
      ),
    newPassword: z
      .string()
      .min(
        PASSWORD_MIN_LENGTH,
        `Kata sandi baru minimal harus ${PASSWORD_MIN_LENGTH} karakter`
      )
      .max(
        PASSWORD_MAX_LENGTH,
        `Kata sandi baru maksimal ${PASSWORD_MAX_LENGTH} karakter`
      ),
    confirmPassword: z
      .string()
      .min(1, "Konfirmasi kata sandi wajib diisi")
      .max(
        PASSWORD_MAX_LENGTH,
        `Konfirmasi kata sandi maksimal ${PASSWORD_MAX_LENGTH} karakter`
      ),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi baru tidak sesuai",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
