import type { Metadata } from "next";
import { requireUser, twoFactorService, SecuritySettingsView } from "@/modules/auth";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Keamanan Akun | Yayasan Nurjaman Bongas Purwakarta",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminKeamananPage() {
  const sessionWithUser = await requireUser();
  const status = await twoFactorService.getStatus(sessionWithUser.userId);

  return (
    <div className="space-y-6">
      <div className="shadow-xs rounded-xl border border-stone-200 bg-white p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Pengaturan Keamanan Akun
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Kelola status autentikasi dua faktor (2FA TOTP), kode pemulihan cadangan,
              dan kredensial akses.
            </p>
          </div>
        </div>
      </div>

      <SecuritySettingsView
        enrolled={status.enrolled}
        remainingCodes={status.remainingRecoveryCodes}
      />
    </div>
  );
}
