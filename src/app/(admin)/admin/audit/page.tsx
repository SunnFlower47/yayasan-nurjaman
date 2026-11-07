import type { Metadata } from "next";
import { requirePermission } from "@/modules/auth";
import { auditService } from "@/modules/audit";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import type { AuditLogRecord } from "@/modules/audit";
import { History, Filter } from "lucide-react";
import { Button } from "@/components/shared/Button";

export const metadata: Metadata = {
  title: "Jejak Audit | Yayasan Nurjaman Bongas Purwakarta",
  robots: { index: false, follow: false },
};

interface SearchParams {
  page?: string | undefined;
  action?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(date));
}

function renderDetails(item: AuditLogRecord) {
  const beforeStr = item.before ? JSON.stringify(item.before) : null;
  const afterStr = item.after ? JSON.stringify(item.after) : null;
  if (!beforeStr && !afterStr) return <span className="text-xs text-stone-400">-</span>;
  return (
    <div className="max-w-xs truncate font-mono text-[11px] text-stone-600">
      {afterStr ? <span>{afterStr}</span> : <span>{beforeStr}</span>}
    </div>
  );
}

const columns: ColumnDef<AuditLogRecord>[] = [
  {
    key: "createdAt",
    header: "Waktu (WIB)",
    render: (item) => (
      <span className="whitespace-nowrap font-mono text-xs text-stone-700">
        {formatDate(item.createdAt)}
      </span>
    ),
  },
  {
    key: "actor",
    header: "Aktor",
    render: (item) => (
      <div>
        <p className="text-xs font-medium text-stone-900">
          {item.actor?.name ?? "Sistem"}
        </p>
        <p className="font-mono text-[11px] text-stone-500">
          @{item.actor?.username ?? item.actorUserId?.slice(0, 8) ?? "system"}
        </p>
      </div>
    ),
  },
  {
    key: "action",
    header: "Aksi",
    render: (item) => (
      <span className="inline-flex rounded-sm border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-800">
        {item.action}
      </span>
    ),
  },
  {
    key: "entityType",
    header: "Entitas",
    render: (item) => (
      <span className="text-xs text-stone-700">
        <span className="font-medium">{item.entityType}</span>
        {item.entityId && (
          <span className="block max-w-[120px] truncate font-mono text-[11px] text-stone-400">
            {item.entityId}
          </span>
        )}
      </span>
    ),
  },
  {
    key: "details",
    header: "Perubahan",
    render: renderDetails,
  },
  {
    key: "requestId",
    header: "Request ID / IP",
    render: (item) => (
      <div className="font-mono text-[11px] text-stone-500">
        <p>{item.ip ?? "127.0.0.1"}</p>
        {item.requestId && (
          <p className="max-w-[100px] truncate text-[10px] text-stone-400">
            {item.requestId}
          </p>
        )}
      </div>
    ),
  },
];

function parseAuditFilter(params: SearchParams) {
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const action = params.action?.trim() || undefined;
  const startDate = params.startDate ? new Date(params.startDate) : undefined;
  const endDate = params.endDate ? new Date(params.endDate) : undefined;
  const hasFilter = Boolean(action || params.startDate || params.endDate);
  return { page, action, startDate, endDate, hasFilter };
}

function AuditFilterForm({
  action,
  startDate,
  endDate,
  hasFilter,
}: {
  action?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  hasFilter: boolean;
}) {
  return (
    <form
      method="GET"
      className="shadow-xs flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4"
    >
      <div className="min-w-[180px] flex-1">
        <label htmlFor="action" className="mb-1 block text-xs font-medium text-stone-700">
          Filter Aksi
        </label>
        <input
          type="text"
          id="action"
          name="action"
          defaultValue={action ?? ""}
          placeholder="Contoh: auth.change_password"
          className="focus:outline-hidden w-full rounded-md border border-stone-300 px-3 py-1.5 text-xs text-stone-900 focus:border-emerald-600"
        />
      </div>

      <div className="w-36">
        <label
          htmlFor="startDate"
          className="mb-1 block text-xs font-medium text-stone-700"
        >
          Dari Tanggal
        </label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          defaultValue={startDate ?? ""}
          className="focus:outline-hidden w-full rounded-md border border-stone-300 px-3 py-1.5 text-xs text-stone-900 focus:border-emerald-600"
        />
      </div>

      <div className="w-36">
        <label
          htmlFor="endDate"
          className="mb-1 block text-xs font-medium text-stone-700"
        >
          Sampai Tanggal
        </label>
        <input
          type="date"
          id="endDate"
          name="endDate"
          defaultValue={endDate ?? ""}
          className="focus:outline-hidden w-full rounded-md border border-stone-300 px-3 py-1.5 text-xs text-stone-900 focus:border-emerald-600"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" size="sm">
          <Filter className="mr-1.5 h-3.5 w-3.5" />
          Saring
        </Button>
        {hasFilter && (
          <a
            href="/admin/audit"
            className="ml-1 text-xs text-stone-500 underline hover:text-stone-800"
          >
            Reset
          </a>
        )}
      </div>
    </form>
  );
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission("audit.view", {
    redirectOnForbidden: "/admin?error=forbidden",
  });

  const resolved = await searchParams;
  const filter = parseAuditFilter(resolved);

  const paginated = await auditService.getAuditLogs({
    page: filter.page,
    pageSize: 15,
    action: filter.action,
    startDate: filter.startDate,
    endDate: filter.endDate,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jejak Audit Sistem"
        description="Riwayat aktivitas terpusat, append-only, dan nirubah sesuai standar kepatuhan regulasi."
        icon={<History className="h-5 w-5" />}
      />

      <AuditFilterForm
        action={filter.action}
        startDate={resolved.startDate}
        endDate={resolved.endDate}
        hasFilter={filter.hasFilter}
      />

      <DataTable
        columns={columns}
        data={paginated.data}
        keyExtractor={(item) => item.id}
        emptyMessage="Belum ada riwayat aktivitas yang tercatat untuk filter ini."
        pagination={{
          currentPage: paginated.page,
          totalPages: paginated.totalPages,
          totalItems: paginated.total,
          pageSize: paginated.pageSize,
          basePath: "/admin/audit",
        }}
      />
    </div>
  );
}
