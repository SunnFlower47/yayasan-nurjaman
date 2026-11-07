"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  changePasswordAction,
  type ChangePasswordActionResult,
} from "../actions/change-password.action";
import { PASSWORD_MIN_LENGTH } from "../constants";
import { Input } from "@/components/shared/Input";
import { Button } from "@/components/shared/Button";
import { Alert } from "@/components/shared/Alert";

export function ChangePasswordForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<
    ChangePasswordActionResult | null,
    FormData
  >(changePasswordAction, null);

  const isSuccess = Boolean(state?.success);
  const isFormDisabled = isPending || isSuccess;

  useEffect(() => {
    if (!isSuccess) return;
    const dest = state?.redirectTo || "/admin";
    const timer = setTimeout(() => {
      router.push(dest);
    }, 1500);
    return () => clearTimeout(timer);
  }, [isSuccess, router, state?.redirectTo]);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <Alert variant="danger" title="Pembaruan Gagal">
          {state.error}
        </Alert>
      )}

      {isSuccess && (
        <Alert variant="success" title="Kata Sandi Berhasil Diperbarui">
          Kata sandi telah diperbarui. Mengalihkan ke panel administrasi...
        </Alert>
      )}

      <div className="space-y-4">
        <Input
          id="currentPassword"
          name="currentPassword"
          label="Kata Sandi Saat Ini"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••••••"
          disabled={isFormDisabled}
        />

        <Input
          id="newPassword"
          name="newPassword"
          label="Kata Sandi Baru"
          type="password"
          autoComplete="new-password"
          required
          placeholder={`Minimal ${PASSWORD_MIN_LENGTH} karakter aman`}
          helperText={`Minimal ${PASSWORD_MIN_LENGTH} karakter, bukan data pribadi atau kata sandi umum.`}
          disabled={isFormDisabled}
        />

        <Input
          id="confirmPassword"
          name="confirmPassword"
          label="Konfirmasi Kata Sandi Baru"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Ulangi kata sandi baru"
          disabled={isFormDisabled}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={isPending}
        disabled={isSuccess}
        className="w-full"
      >
        {isPending ? "Memproses Pembaruan..." : "Simpan Kata Sandi Baru"}
      </Button>
    </form>
  );
}
