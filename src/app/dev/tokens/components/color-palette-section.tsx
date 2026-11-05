import React from "react";

interface ColorItem {
  name: string;
  hex: string;
  bg: string;
  text: string;
}

interface StatusColor {
  role: string;
  token: string;
  badge: string;
  surface: string;
}

const primaryScale: ColorItem[] = [
  { name: "primary-50", hex: "#eefbf3", bg: "bg-primary-50", text: "text-primary-950" },
  { name: "primary-100", hex: "#d6f6e3", bg: "bg-primary-100", text: "text-primary-950" },
  { name: "primary-200", hex: "#b0eccb", bg: "bg-primary-200", text: "text-primary-950" },
  { name: "primary-300", hex: "#7addad", bg: "bg-primary-300", text: "text-primary-950" },
  { name: "primary-400", hex: "#44c688", bg: "bg-primary-400", text: "text-white" },
  {
    name: "primary-500 (Logo Core)",
    hex: "#29c668",
    bg: "bg-primary-500",
    text: "text-primary-950",
  },
  {
    name: "primary-600 (Accessible)",
    hex: "#1b9b4f",
    bg: "bg-primary-600",
    text: "text-white",
  },
  { name: "primary-700", hex: "#187a41", bg: "bg-primary-700", text: "text-white" },
  { name: "primary-800", hex: "#186036", bg: "bg-primary-800", text: "text-white" },
  { name: "primary-900", hex: "#154f2e", bg: "bg-primary-900", text: "text-white" },
];

const yellowScale: ColorItem[] = [
  { name: "yellow-50", hex: "#fefde8", bg: "bg-yellow-50", text: "text-yellow-900" },
  { name: "yellow-100", hex: "#fffbb5", bg: "bg-yellow-100", text: "text-yellow-900" },
  { name: "yellow-200", hex: "#fff871", bg: "bg-yellow-200", text: "text-yellow-900" },
  { name: "yellow-300", hex: "#fff02d", bg: "bg-yellow-300", text: "text-yellow-900" },
  { name: "yellow-400", hex: "#facc15", bg: "bg-yellow-400", text: "text-yellow-950" },
  {
    name: "yellow-500 (Logo Ring)",
    hex: "#ffff00",
    bg: "bg-yellow-500",
    text: "text-neutral-900",
  },
  { name: "yellow-600", hex: "#ca8a04", bg: "bg-yellow-600", text: "text-white" },
  { name: "yellow-700", hex: "#a16207", bg: "bg-yellow-700", text: "text-white" },
  { name: "yellow-800", hex: "#854d0e", bg: "bg-yellow-800", text: "text-white" },
];

const neutralScale: ColorItem[] = [
  { name: "neutral-50", hex: "#fafaf9", bg: "bg-neutral-50", text: "text-neutral-900" },
  { name: "neutral-100", hex: "#f5f5f4", bg: "bg-neutral-100", text: "text-neutral-900" },
  { name: "neutral-200", hex: "#e7e5e4", bg: "bg-neutral-200", text: "text-neutral-900" },
  { name: "neutral-300", hex: "#d6d3d1", bg: "bg-neutral-300", text: "text-neutral-900" },
  { name: "neutral-500", hex: "#78716c", bg: "bg-neutral-500", text: "text-white" },
  { name: "neutral-700", hex: "#44403c", bg: "bg-neutral-700", text: "text-white" },
  { name: "neutral-900", hex: "#1c1917", bg: "bg-neutral-900", text: "text-white" },
];

const statusColors: StatusColor[] = [
  {
    role: "Sukses (Aktif, Lunas, Diterima)",
    token: "--success",
    badge: "bg-success text-white",
    surface: "bg-success-surface border border-success-border text-emerald-800",
  },
  {
    role: "Peringatan (Draft, Tertunda, Jatuh Tempo)",
    token: "--warning",
    badge: "bg-warning text-white",
    surface: "bg-warning-surface border border-warning-border text-amber-900",
  },
  {
    role: "Bahaya / Destruktif (Void, Ditolak, Hapus)",
    token: "--danger",
    badge: "bg-danger text-white",
    surface: "bg-danger-surface border border-danger-border text-red-900",
  },
  {
    role: "Informasi (Status Sistem, Catatan)",
    token: "--info",
    badge: "bg-info text-white",
    surface: "bg-info-surface border border-info-border text-sky-900",
  },
];

export function ColorPaletteSection() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold text-foreground">
          1. Palet Primer (Hijau Yayasan — Sampling Logo: #29c668)
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 md:grid-cols-10">
          {primaryScale.map((item) => (
            <div
              key={item.name}
              className="overflow-hidden rounded-md border border-border shadow-sm"
            >
              <div className={`h-16 w-full ${item.bg} flex items-end p-2`}>
                <span className={`font-mono text-[10px] font-semibold ${item.text}`}>
                  {item.hex}
                </span>
              </div>
              <div className="bg-card p-2 text-[11px] font-medium text-foreground">
                {item.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold text-foreground">
          2. Palet Aksen (Kuning Yayasan — Sampling Logo: #ffff00)
        </h2>
        <p className="text-xs text-muted-foreground">
          Catatan: Kuning digunakan secara hemat untuk badge dan aksen. Bukan latar untuk
          teks putih.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-9">
          {yellowScale.map((item) => (
            <div
              key={item.name}
              className="overflow-hidden rounded-md border border-border shadow-sm"
            >
              <div className={`h-16 w-full ${item.bg} flex items-end p-2`}>
                <span className={`font-mono text-[10px] font-semibold ${item.text}`}>
                  {item.hex}
                </span>
              </div>
              <div className="bg-card p-2 text-[11px] font-medium text-foreground">
                {item.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold text-foreground">
          3. Netral Hangat (Stone / Slate Permukaan Lembaga)
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
          {neutralScale.map((item) => (
            <div
              key={item.name}
              className="overflow-hidden rounded-md border border-border shadow-sm"
            >
              <div className={`h-16 w-full ${item.bg} flex items-end p-2`}>
                <span className={`font-mono text-[10px] font-semibold ${item.text}`}>
                  {item.hex}
                </span>
              </div>
              <div className="bg-card p-2 text-[11px] font-medium text-foreground">
                {item.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold text-foreground">
          4. Warna Semantik & Status
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statusColors.map((status) => (
            <div
              key={status.role}
              className="space-y-3 rounded-md border border-border bg-card p-4"
            >
              <span
                className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${status.badge}`}
              >
                Badge Status
              </span>
              <div className="text-xs font-semibold text-foreground">{status.role}</div>
              <div className={`rounded p-3 text-xs ${status.surface}`}>
                Kotak pemberitahuan atau alert banner dengan token {status.token}.
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
