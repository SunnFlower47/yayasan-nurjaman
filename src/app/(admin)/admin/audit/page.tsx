import type { Metadata } from "next";
import { requirePermission } from "@/modules/auth";
import { auditService } from "@/modules/audit";
import { History, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Jejak Audit | Yayasan Nurjaman Bongas Purwakarta",
  robots: { index: false, follow: false },
};

export default async function AuditLogPage() {
  // Evaluasi otorisasi server-side otoritatif
  await requirePermission("audit.view", {
    redirectOnForbidden: "/admin?error=forbidden",
  });

  const { data: auditLogs, total } = await auditService.getAuditLogs({
    page: 1,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-800 text-white">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Jejak Audit Sistem
            </h1>
            <p className="mt-0.5 text-xs text-stone-500">
              Log aktivitas terpusat, append-only, dan tidak dapat diubah (Total {total}{" "}
              catatan)
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase text-stone-500">
              <tr>
                <th scope="col" className="px-6 py-3.5">
                  Waktu
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Aktor
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Aksi
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Entitas
                </th>
                <th scope="col" className="px-6 py-3.5">
                  ID Target
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-stone-400">
                    <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-stone-300" />
                    Belum ada riwayat aktivitas yang dicatat.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-stone-50/60">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-stone-500">
                      {new Date(log.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-stone-900">
                      {log.actor?.name ?? "Sistem"}
                      {log.actor?.username && (
                        <span className="block font-mono text-xs text-stone-400">
                          @{log.actor.username}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center rounded bg-stone-100 px-2 py-0.5 font-mono text-xs font-medium text-stone-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-stone-600">
                      {log.entityType}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-stone-400">
                      {log.entityId ? log.entityId.slice(0, 8) + "..." : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
