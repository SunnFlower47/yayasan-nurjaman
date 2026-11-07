import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePartialSession, TwoFactorVerifyForm, logoutAction } from "@/modules/auth";
import { Button } from "@/components/shared/Button";

export const metadata: Metadata = {
  title: "Verifikasi Dua Faktor (2FA) | Yayasan Nurjaman Bongas Purwakarta",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Verifikasi2FaPage() {
  const sessionWithUser = await requirePartialSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Verifikasi Dua Faktor
          </h1>
          <p className="mt-2 text-xs text-stone-600 sm:text-sm">
            Halo, <span className="font-semibold">{sessionWithUser.user.name}</span>.
            Silakan lakukan verifikasi langkah kedua untuk memastikan keamanan akses.
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <Suspense
            fallback={<div className="text-center text-sm text-stone-500">Memuat...</div>}
          >
            <TwoFactorVerifyForm />
          </Suspense>
        </div>

        <div className="text-center">
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Batalkan dan Keluar
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
