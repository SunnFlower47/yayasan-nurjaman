import type { Metadata } from "next";
import { requireUser, twoFactorService, TwoFactorSetupForm } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Penyiapan Autentikasi 2FA | Yayasan Nurjaman Bongas Purwakarta",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TwoFactorSetupPage() {
  const sessionWithUser = await requireUser({
    allowUnverifiedMfa: true,
    allowMustChangePassword: true,
  });

  const status = await twoFactorService.getStatus(sessionWithUser.userId);

  const { base32Secret, qrDataUrl } = !status.enrolled
    ? await twoFactorService.initiateSetup(
        sessionWithUser.userId,
        sessionWithUser.user.username
      )
    : { base32Secret: "", qrDataUrl: "" };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Penyiapan 2FA TOTP Wajib
          </h1>
          <p className="mt-2 text-xs text-stone-600 sm:text-sm">
            Halo, <span className="font-semibold">{sessionWithUser.user.name}</span>.
            Seluruh akun pengurus diwajibkan mengaktifkan autentikasi dua faktor sebelum
            mengakses panel.
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <TwoFactorSetupForm qrDataUrl={qrDataUrl} base32Secret={base32Secret} />
        </div>
      </div>
    </main>
  );
}
