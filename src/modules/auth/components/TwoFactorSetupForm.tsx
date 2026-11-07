"use client";

/**
 * src/modules/auth/components/TwoFactorSetupForm.tsx
 * Komponen pendaftaran awal 2FA TOTP dan penayangan kode pemulihan darurat.
 */

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  confirm2FaSetupAction,
  type Setup2FaActionResult,
} from "../actions/setup-2fa.action";
import { Input } from "@/components/shared/Input";
import { Button } from "@/components/shared/Button";
import { Alert } from "@/components/shared/Alert";

interface Props {
  qrDataUrl: string;
  base32Secret: string;
}

export function TwoFactorSetupForm({ qrDataUrl, base32Secret }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [state, formAction, isPending] = useActionState<
    Setup2FaActionResult | null,
    FormData
  >(confirm2FaSetupAction, null);

  const recoveryCodes = state?.recoveryCodes;

  const handleCopyCodes = () => {
    if (!recoveryCodes) return;
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = () => {
    router.push("/admin");
    router.refresh();
  };

  if (recoveryCodes && recoveryCodes.length > 0) {
    return (
      <div className="space-y-6">
        <Alert variant="warning" title="Simpan Kode Pemulihan Anda!">
          Kode-kode ini hanya ditampilkan SATU KALI. Jika Anda kehilangan akses ke
          aplikasi autentikator, kode ini adalah satu-satunya cara untuk masuk ke panel.
        </Alert>

        <div className="grid grid-cols-2 gap-2 rounded-lg border border-stone-200 bg-stone-50 p-4 font-mono text-xs text-stone-800">
          {recoveryCodes.map((code) => (
            <div
              key={code}
              className="shadow-xs rounded bg-white px-2 py-1.5 text-center"
            >
              {code}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" size="sm" onClick={handleCopyCodes}>
            {copied ? "Tersalin ke Clipboard!" : "Salin Seluruh Kode"}
          </Button>
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-xs text-stone-700">
          <input
            type="checkbox"
            className="mt-0.5 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          <span>
            Saya telah mencatat dan menyimpan 10 kode pemulihan ini di tempat yang aman.
          </span>
        </label>

        <Button
          type="button"
          variant="primary"
          className="w-full"
          disabled={!acknowledged}
          onClick={handleFinish}
        >
          Lanjutkan ke Panel Administrasi
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <Alert variant="danger" title="Verifikasi Gagal">
          {state.error}
        </Alert>
      )}

      <div className="flex flex-col items-center justify-center rounded-lg border border-stone-200 bg-stone-50 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="Kode QR Autentikator 2FA"
          className="shadow-xs h-48 w-48 rounded border border-stone-100"
        />
        <p className="mt-3 text-center text-xs text-stone-500">
          Pindai kode QR di atas menggunakan Google Authenticator atau aplikasi sejenis.
        </p>
      </div>

      <div className="rounded border border-stone-200 bg-stone-50 p-3">
        <span className="block text-xs text-stone-500">Kunci Penyiapan Manual:</span>
        <code className="break-all font-mono text-xs font-bold tracking-wider text-stone-800">
          {base32Secret}
        </code>
      </div>

      <div className="space-y-2">
        <Input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          label="Kode Verifikasi 6 Digit"
          placeholder="Contoh: 123456"
          required
          disabled={isPending}
        />
      </div>

      <Button type="submit" variant="primary" className="w-full" disabled={isPending}>
        {isPending ? "Memverifikasi..." : "Aktifkan 2FA & Tampilkan Kode Pemulihan"}
      </Button>
    </form>
  );
}
