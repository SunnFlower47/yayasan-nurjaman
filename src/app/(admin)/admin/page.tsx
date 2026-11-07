import type { Metadata } from "next";
import { requireUser, getUserRoles, getUserPermissions } from "@/modules/auth";
import { Shield, Key, History, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Panel Administrasi | Yayasan Nurjaman Bongas Purwakarta",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage() {
  const sessionWithUser = await requireUser();
  const [roles, permissions] = await Promise.all([
    getUserRoles(sessionWithUser.user.id),
    getUserPermissions(sessionWithUser.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Halo, {sessionWithUser.user.name}
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Selamat datang di Panel Manajemen Yayasan Nurjaman Bongas Purwakarta.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Sesi Terautentikasi
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Peran Aktif
            </span>
            <Shield className="h-5 w-5 text-emerald-700" />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {roles.map((r) => (
              <span
                key={r.code}
                className="inline-flex items-center rounded bg-stone-100 px-2 py-1 text-xs font-medium text-stone-800"
              >
                {r.name}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Hak Akses Izin
            </span>
            <Key className="h-5 w-5 text-emerald-700" />
          </div>
          <p className="mt-2 text-2xl font-bold text-stone-900">
            {permissions.length} Izin
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Diberikan via peran penugasan resmi
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Masa Aktif Sesi
            </span>
            <History className="h-5 w-5 text-emerald-700" />
          </div>
          <p className="mt-2 text-lg font-bold text-stone-900">
            Hingga{" "}
            {new Date(sessionWithUser.absoluteExpiresAt).toLocaleTimeString("id-ID")}
          </p>
          <p className="mt-1 text-xs text-stone-500">Batas mutlak 8 jam sesi internal</p>
        </div>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-stone-900">
          Akses Cepat Pengurus
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/admin/audit"
            className="flex items-center gap-4 rounded-lg border border-stone-200 p-4 transition hover:border-emerald-500 hover:bg-emerald-50/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">
                Jejak Audit Aktivitas
              </p>
              <p className="text-xs text-stone-500">
                Periksa riwayat log aktivitas dan perubahan data sistem
              </p>
            </div>
          </Link>

          <Link
            href="/ganti-password"
            className="flex items-center gap-4 rounded-lg border border-stone-200 p-4 transition hover:border-emerald-500 hover:bg-emerald-50/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-800">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">Pembaruan Kata Sandi</p>
              <p className="text-xs text-stone-500">
                Perbarui kredensial sandi akun secara berkala
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
