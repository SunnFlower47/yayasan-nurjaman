"use client";

/**
 * src/modules/auth/components/TwoFactorVerifyForm.tsx
 * Formulir verifikasi 2FA dengan opsi kode TOTP 6-digit atau Recovery Code cadangan.
 */

import { useState, useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  verify2FaAction,
  type Verify2FaActionResult,
} from "../actions/verify-2fa.action";
import { Input } from "@/components/shared/Input";
import { Button } from "@/components/shared/Button";
import { Alert } from "@/components/shared/Alert";

function TotpCodeField({ disabled }: { disabled: boolean }) {
  return (
    <div className="space-y-2">
      <Input
        id="code"
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        label="Kode Autentikator 6 Digit"
        placeholder="Contoh: 123456"
        required
        disabled={disabled}
      />
      <p className="text-xs text-stone-500">
        Buka aplikasi autentikator Anda dan masukkan kode 6 angka yang tertera.
      </p>
    </div>
  );
}

function RecoveryCodeField({ disabled }: { disabled: boolean }) {
  return (
    <div className="space-y-2">
      <Input
        id="recoveryCode"
        name="code"
        type="text"
        autoComplete="off"
        label="Kode Pemulihan Cadangan (Recovery Code)"
        placeholder="Contoh: 2ABC-4DEF-6GHK"
        required
        disabled={disabled}
      />
      <p className="text-xs text-stone-500">
        Masukkan salah satu dari 10 kode cadangan sekali pakai yang Anda simpan.
      </p>
    </div>
  );
}

function ToggleRecoveryButton({
  useRecovery,
  onToggle,
  disabled,
}: {
  useRecovery: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <div className="pt-2 text-center">
      <button
        type="button"
        onClick={onToggle}
        className="focus:outline-hidden text-xs font-medium text-emerald-800 underline hover:text-emerald-900"
        disabled={disabled}
      >
        {useRecovery
          ? "Kembali gunakan kode aplikasi autentikator"
          : "Tidak dapat mengakses aplikasi? Gunakan kode pemulihan"}
      </button>
    </div>
  );
}

export function TwoFactorVerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? undefined;

  const [useRecovery, setUseRecovery] = useState(false);
  const [state, formAction, isPending] = useActionState<
    Verify2FaActionResult | null,
    FormData
  >(verify2FaAction, null);

  const isSuccess = Boolean(state?.success);
  const isFormDisabled = isPending || isSuccess;

  useEffect(() => {
    if (!isSuccess) return;
    const dest = state?.redirectTo ?? "/admin";
    router.push(dest);
    router.refresh();
  }, [isSuccess, router, state?.redirectTo]);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <Alert variant="danger" title="Verifikasi Gagal">
          {state.error}
        </Alert>
      )}

      {nextPath && <input type="hidden" name="next" value={nextPath} />}
      <input type="hidden" name="useRecovery" value={String(useRecovery)} />

      {useRecovery ? (
        <RecoveryCodeField disabled={isFormDisabled} />
      ) : (
        <TotpCodeField disabled={isFormDisabled} />
      )}

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={isFormDisabled}
      >
        {isPending ? "Memverifikasi..." : "Verifikasi Masuk"}
      </Button>

      <ToggleRecoveryButton
        useRecovery={useRecovery}
        onToggle={() => setUseRecovery((prev) => !prev)}
        disabled={isPending}
      />
    </form>
  );
}
