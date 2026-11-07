import type { Metadata } from "next";
import { requireUser, logoutAction } from "@/modules/auth";
import { Button } from "@/components/shared/Button";

export const metadata: Metadata = {
  title: "Panel Administrasi | Yayasan Nurjaman Bongas Purwakarta",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage() {
  const sessionWithUser = await requireUser();

  return (
    <main className="min-h-screen bg-stone-50 p-6 sm:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Halo, {sessionWithUser.user.name}
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Selamat datang di Panel Manajemen Yayasan Nurjaman Bongas Purwakarta.
            </p>
          </div>

          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Keluar
            </Button>
          </form>
        </header>

        <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-stone-900">Informasi Akun</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded border border-stone-100 bg-stone-50 p-3">
              <dt className="text-xs font-medium text-stone-500">Username</dt>
              <dd className="mt-1 text-sm font-semibold text-stone-800">
                {sessionWithUser.user.username}
              </dd>
            </div>
            <div className="rounded border border-stone-100 bg-stone-50 p-3">
              <dt className="text-xs font-medium text-stone-500">Email</dt>
              <dd className="mt-1 text-sm font-semibold text-stone-800">
                {sessionWithUser.user.email}
              </dd>
            </div>
            <div className="rounded border border-stone-100 bg-stone-50 p-3">
              <dt className="text-xs font-medium text-stone-500">Status Akun</dt>
              <dd className="mt-1 text-sm font-semibold text-emerald-700">
                {sessionWithUser.user.status}
              </dd>
            </div>
            <div className="rounded border border-stone-100 bg-stone-50 p-3">
              <dt className="text-xs font-medium text-stone-500">Sesi Aktif Hingga</dt>
              <dd className="mt-1 text-sm font-semibold text-stone-800">
                {new Date(sessionWithUser.absoluteExpiresAt).toLocaleTimeString("id-ID")}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
