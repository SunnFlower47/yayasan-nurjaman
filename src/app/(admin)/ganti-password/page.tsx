import type { Metadata } from "next";
import { requireUser, ChangePasswordForm } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Ganti Kata Sandi | Yayasan Nurjaman Bongas Purwakarta",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function GantiPasswordPage() {
  const sessionWithUser = await requireUser({
    allowMustChangePassword: true,
    allowUnverifiedMfa: true,
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Perbarui Kata Sandi
          </h1>
          <p className="mt-2 text-xs text-stone-600 sm:text-sm">
            Halo, <span className="font-semibold">{sessionWithUser.user.name}</span>.
            {sessionWithUser.user.mustChangePassword
              ? " Demi keamanan, Anda wajib memperbarui kata sandi akun sebelum mengakses fitur panel."
              : " Silakan masukkan kata sandi baru untuk mengamankan akun Anda."}
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}
