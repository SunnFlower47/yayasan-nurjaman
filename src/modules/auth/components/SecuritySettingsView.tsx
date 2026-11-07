"use client";

/**
 * src/modules/auth/components/SecuritySettingsView.tsx
 * Tampilan status keamanan akun, sisa recovery codes, pembuatan ulang, dan tautan ganti sandi.
 */

import { useState } from "react";
import Link from "next/link";
import { regenerateRecoveryAction } from "../actions/regenerate-recovery.action";
import { Button } from "@/components/shared/Button";
import { Alert } from "@/components/shared/Alert";
import { ShieldCheck, KeyRound, RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  enrolled: boolean;
  remainingCodes: number;
}

export function SecuritySettingsView({ enrolled, remainingCodes: initialCodes }: Props) {
  const [remainingCodes, setRemainingCodes] = useState(initialCodes);
  const [newCodes, setNewCodes] = useState<string[] | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRegenerate = async () => {
    setIsPending(true);
    setError(null);
    try {
      const res = await regenerateRecoveryAction();
      if (!res.success || !res.recoveryCodes) {
        setError(res.error || "Gagal membuat ulang kode.");
      } else {
        setNewCodes(res.recoveryCodes);
        setRemainingCodes(10);
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setIsPending(false);
    }
  };

  const handleCopyCodes = () => {
    if (!newCodes) return;
    navigator.clipboard.writeText(newCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="danger" title="Aksi Gagal">
          {error}
        </Alert>
      )}

      {remainingCodes < 3 && !newCodes && (
        <Alert variant="warning" title="Perhatian: Sisa Kode Pemulihan Sedikit">
          Anda hanya memiliki {remainingCodes} kode pemulihan tersisa. Segera buat ulang
          rangkaian kode cadangan baru untuk mencegah risiko terkunci dari sistem.
        </Alert>
      )}

      {/* Kartu Status 2FA */}
      <div className="shadow-xs rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Autentikasi Dua Faktor (2FA TOTP)
              </h3>
              <p className="text-xs text-stone-500">
                Wajib untuk seluruh akun pengurus sesuai standar institusional yayasan.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            {enrolled ? "Aktif & Terproteksi" : "Belum Aktif"}
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-800">
              Sisa Kode Cadangan Pemulihan:{" "}
              <span
                className={
                  remainingCodes < 3 ? "font-bold text-amber-700" : "text-emerald-800"
                }
              >
                {remainingCodes} dari 10 kode
              </span>
            </p>
            <p className="text-xs text-stone-500">
              Kode cadangan digunakan jika Anda tidak membawa atau kehilangan ponsel.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isPending}
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            {isPending ? "Memproses..." : "Buat Ulang 10 Kode"}
          </Button>
        </div>
      </div>

      {/* Tampilan Kode Baru Jika Berhasil Dibuat Ulang */}
      {newCodes && (
        <div className="shadow-xs space-y-4 rounded-xl border border-amber-300 bg-amber-50/50 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <span>Rangkaian 10 Kode Cadangan Baru Telah Dibuat</span>
          </div>
          <p className="text-xs text-stone-600">
            Kode-kode lama sudah tidak berlaku. Salin dan simpan 10 kode baru ini di
            tempat yang aman.
          </p>

          <div className="grid grid-cols-2 gap-2 rounded-lg border border-stone-200 bg-white p-4 font-mono text-xs text-stone-800">
            {newCodes.map((c) => (
              <div key={c} className="rounded bg-stone-50 px-2 py-1.5 text-center">
                {c}
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={handleCopyCodes}>
            {copied ? "Tersalin ke Clipboard!" : "Salin Seluruh Kode Baru"}
          </Button>
        </div>
      )}

      {/* Kartu Kata Sandi */}
      <div className="shadow-xs flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-800">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">Kata Sandi Akun</h3>
            <p className="text-xs text-stone-500">
              Perbarui kata sandi secara berkala dengan minimal 8 karakter aman.
            </p>
          </div>
        </div>

        <Link href="/ganti-password">
          <Button variant="outline" size="sm">
            Perbarui Kata Sandi
          </Button>
        </Link>
      </div>
    </div>
  );
}
