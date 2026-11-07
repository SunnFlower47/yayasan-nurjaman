import { Suspense } from "react";
import Image from "next/image";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm, getCurrentUser, twoFactorService } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Masuk ke Panel Pengurus | Yayasan Nurjaman Bongas Purwakarta",
  description: "Portal masuk resmi untuk pengurus Yayasan Nurjaman Bongas Purwakarta.",
};

export default async function MasukPage() {
  const sessionWithUser = await getCurrentUser();
  if (sessionWithUser) {
    if (sessionWithUser.user.mustChangePassword) {
      redirect("/ganti-password");
    }
    if (!sessionWithUser.mfaVerifiedAt) {
      const status = await twoFactorService.getStatus(sessionWithUser.userId);
      redirect(status.enrolled ? "/verifikasi-2fa" : "/2fa/setup");
    }
    redirect("/admin");
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3 h-20 w-20">
            <Image
              src="/brand/logo-yayasan-nurjaman.png"
              alt="Logo Yayasan Nurjaman Bongas Purwakarta"
              fill
              sizes="80px"
              priority
              className="object-contain"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
            Masuk Panel Pengurus
          </h1>
          <p className="mt-1 text-xs text-stone-600 sm:text-sm">
            Yayasan Nurjaman Bongas Purwakarta
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <Suspense
            fallback={<div className="h-48 animate-pulse rounded bg-stone-100" />}
          >
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-stone-500">
          Sistem Informasi Internal &copy; {new Date().getFullYear()} Yayasan Nurjaman
          Bongas Purwakarta
        </p>
      </div>
    </main>
  );
}
