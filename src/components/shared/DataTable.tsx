/**
 * src/components/shared/DataTable.tsx
 * Komponen tabel data generik terstandarisasi untuk modul institusional yayasan.
 * Mematuhi panduan UI-UX-RULES (angka rata kanan, state loading/kosong/error).
 */

import React from "react";
import { Alert } from "./Alert";
import { Button } from "./Button";

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right" | undefined;
  className?: string | undefined;
  render?: ((item: T, index: number) => React.ReactNode) | undefined;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange?: ((page: number) => void) | undefined;
  basePath?: string | undefined;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor?: ((item: T, index: number) => string) | undefined;
  loading?: boolean | undefined;
  error?: string | null | undefined;
  emptyMessage?: string | undefined;
  pagination?: PaginationProps | undefined;
}

function TableHeader<T>({ columns }: { columns: ColumnDef<T>[] }) {
  return (
    <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-500">
      <tr>
        {columns.map((col) => {
          const alignClass =
            col.align === "right"
              ? "text-right"
              : col.align === "center"
                ? "text-center"
                : "text-left";
          return (
            <th
              key={col.key}
              scope="col"
              className={`px-4 py-3.5 sm:px-6 ${alignClass} ${col.className ?? ""}`}
            >
              {col.header}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

function TableSkeleton<T>({ columns }: { columns: ColumnDef<T>[] }) {
  return (
    <tbody className="divide-y divide-stone-100 bg-white">
      {Array.from({ length: 5 }).map((_, idx) => (
        <tr key={idx} className="animate-pulse">
          {columns.map((col) => (
            <td key={col.key} className="px-4 py-4 sm:px-6">
              <div className="h-4 w-3/4 rounded bg-stone-100" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

function TablePagination({ pagination }: { pagination: PaginationProps }) {
  const { currentPage, totalPages, totalItems, onPageChange, basePath } = pagination;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-stone-200 bg-stone-50 px-4 py-3 sm:flex-row sm:px-6">
      <p className="text-xs text-stone-500">
        Menampilkan halaman{" "}
        <span className="font-semibold text-stone-900">{currentPage}</span> dari{" "}
        <span className="font-semibold text-stone-900">{totalPages}</span> ({totalItems}{" "}
        total catatan)
      </p>
      <div className="flex items-center gap-2">
        {basePath ? (
          <>
            <a
              href={hasPrev ? `${basePath}?page=${currentPage - 1}` : undefined}
              className={`rounded border px-2.5 py-1 text-xs font-medium ${
                hasPrev
                  ? "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                  : "pointer-events-none border-stone-200 text-stone-300"
              }`}
            >
              Sebelumnya
            </a>
            <a
              href={hasNext ? `${basePath}?page=${currentPage + 1}` : undefined}
              className={`rounded border px-2.5 py-1 text-xs font-medium ${
                hasNext
                  ? "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                  : "pointer-events-none border-stone-200 text-stone-300"
              }`}
            >
              Berikutnya
            </a>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasPrev}
              onClick={() => onPageChange?.(currentPage - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => onPageChange?.(currentPage + 1)}
            >
              Berikutnya
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading,
  error,
  emptyMessage = "Tidak ada data yang tersedia.",
  pagination,
}: DataTableProps<T>) {
  if (error) {
    return (
      <div className="p-4">
        <Alert variant="danger" title="Terjadi Kesalahan">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="shadow-xs overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-stone-600">
          <TableHeader columns={columns} />
          {loading ? (
            <TableSkeleton columns={columns} />
          ) : data.length === 0 ? (
            <tbody className="bg-white">
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-sm text-stone-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="divide-y divide-stone-100 bg-white">
              {data.map((item, rowIdx) => {
                const rowKey = keyExtractor
                  ? keyExtractor(item, rowIdx)
                  : ((item as Record<string, unknown>)["id"] as string) || String(rowIdx);
                return (
                  <tr key={rowKey} className="transition-colors hover:bg-stone-50/70">
                    {columns.map((col) => {
                      const alignClass =
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                            ? "text-center"
                            : "text-left";
                      const val = (item as Record<string, unknown>)[col.key];
                      return (
                        <td
                          key={col.key}
                          className={`px-4 py-3.5 sm:px-6 ${alignClass} ${col.className ?? ""}`}
                        >
                          {col.render
                            ? col.render(item, rowIdx)
                            : val !== null && val !== undefined
                              ? String(val)
                              : "-"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>
      {pagination && <TablePagination pagination={pagination} />}
    </div>
  );
}
