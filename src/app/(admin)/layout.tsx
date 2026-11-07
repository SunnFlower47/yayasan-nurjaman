import type { ReactNode } from "react";
import { requireUser, getUserRoles } from "@/modules/auth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const sessionWithUser = await requireUser({
    allowMustChangePassword: true,
    allowUnverifiedMfa: true,
  });

  // Jika akun diwajibkan ganti kata sandi, tampilkan fokus halaman tanpa navigasi luar
  if (sessionWithUser.user.mustChangePassword) {
    return <div className="min-h-screen bg-stone-50">{children}</div>;
  }

  // Jika akun belum menyelesaikan verifikasi 2FA, wajibkan verifikasi 2FA terlebih dahulu
  if (!sessionWithUser.mfaVerifiedAt) {
    await requireUser();
  }

  const roles = await getUserRoles(sessionWithUser.user.id);

  return (
    <div className="flex min-h-screen bg-stone-50 text-stone-900">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader user={sessionWithUser.user} roles={roles} />
        <main className="mx-auto w-full max-w-7xl flex-1 p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
