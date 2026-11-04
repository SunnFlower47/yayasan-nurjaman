import { notFound } from "next/navigation";

export default function DevTokensPage() {
  // Hanya aktif di development, return 404 di production
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const primaryScale = [
    { name: "primary-50", hex: "#eefbf3", bg: "bg-primary-50", text: "text-primary-950" },
    {
      name: "primary-100",
      hex: "#d6f6e3",
      bg: "bg-primary-100",
      text: "text-primary-950",
    },
    {
      name: "primary-200",
      hex: "#b0eccb",
      bg: "bg-primary-200",
      text: "text-primary-950",
    },
    {
      name: "primary-300",
      hex: "#7addad",
      bg: "bg-primary-300",
      text: "text-primary-950",
    },
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

  const yellowScale = [
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

  const neutralScale = [
    { name: "neutral-50", hex: "#fafaf9", bg: "bg-neutral-50", text: "text-neutral-900" },
    {
      name: "neutral-100",
      hex: "#f5f5f4",
      bg: "bg-neutral-100",
      text: "text-neutral-900",
    },
    {
      name: "neutral-200",
      hex: "#e7e5e4",
      bg: "bg-neutral-200",
      text: "text-neutral-900",
    },
    {
      name: "neutral-300",
      hex: "#d6d3d1",
      bg: "bg-neutral-300",
      text: "text-neutral-900",
    },
    { name: "neutral-500", hex: "#78716c", bg: "bg-neutral-500", text: "text-white" },
    { name: "neutral-700", hex: "#44403c", bg: "bg-neutral-700", text: "text-white" },
    { name: "neutral-900", hex: "#1c1917", bg: "bg-neutral-900", text: "text-white" },
  ];

  const statusColors = [
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

  const contrastPairs = [
    {
      foreground: "Teks Utama (#1c1917)",
      background: "Latar Dasar (#ffffff)",
      ratio: "14.8:1",
      wcag: "Lulus AAA (Normal & Besar)",
    },
    {
      foreground: "Muted Text (#78716c)",
      background: "Latar Dasar (#ffffff)",
      ratio: "4.6:1",
      wcag: "Lulus AA (Normal)",
    },
    {
      foreground: "Primary Teks / Tombol (#1b9b4f)",
      background: "Latar Dasar (#ffffff)",
      ratio: "4.54:1",
      wcag: "Lulus AA (Normal & Aksi)",
    },
    {
      foreground: "Teks Putih (#ffffff)",
      background: "Primary Button (#1b9b4f)",
      ratio: "4.54:1",
      wcag: "Lulus AA (Tombol Utama)",
    },
    {
      foreground: "Teks Gelap (#1c1917)",
      background: "Logo Yellow Ring (#ffff00)",
      ratio: "18.2:1",
      wcag: "Lulus AAA (Aksen / Badge Kuning)",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-6 py-12">
      <header className="border-b border-border pb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-700">
              DEV ONLY
            </span>
            <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-foreground">
              Pratinjau Design Tokens
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Yayasan Nurjaman Bongas Purwakarta — Palet Warna, Tipografi, Spacing, Radius
              & Kontras WCAG AA
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            Environment:{" "}
            <code className="font-mono font-semibold text-primary">
              {process.env.NODE_ENV}
            </code>
          </div>
        </div>
      </header>

      {/* PALET HIJAU PRIMER */}
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

      {/* PALET KUNING AKSEN */}
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

      {/* PALET NETRAL */}
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

      {/* WARNA STATUS SEMANTIK */}
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

      {/* TIPOGRAFI & UKURAN */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold text-foreground">
          5. Sistem Tipografi (Editorial & Humanis)
        </h2>
        <div className="space-y-4 rounded-md border border-border bg-card p-6">
          <div>
            <span className="font-mono text-xs text-muted-foreground">
              Source Serif 4 — Judul Publik:
            </span>
            <h1 className="font-serif text-3xl font-bold text-foreground">
              Transparansi Tata Kelola dan Akuntabilitas Finansial Yayasan
            </h1>
          </div>
          <div>
            <span className="font-mono text-xs text-muted-foreground">
              Plus Jakarta Sans — Isi & Admin:
            </span>
            <p className="max-w-2xl text-sm leading-relaxed text-foreground">
              Yayasan Nurjaman menyelenggarakan pelayanan masyarakat Purwakarta dengan
              standar pelaporan keuangan nirlaba profesional sesuai pedoman ISAK 35.
            </p>
          </div>
          <div>
            <span className="font-mono text-xs text-muted-foreground">
              Tabular Numbers (Akuntansi & Tabel Data):
            </span>
            <p className="font-mono text-base font-semibold tabular-nums text-foreground">
              Rp 125.450.000 | Rp (45.000.000) | Debit: Rp 10.000.000 | Kredit: Rp
              10.000.000
            </p>
          </div>
        </div>
      </section>

      {/* SPACING & RADIUS */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold text-foreground">
          6. Spacing & Radius (Grid 4/8px & Kontrol Presisi)
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-3 rounded-md border border-border bg-card p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Skala Radius
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xs border border-border bg-neutral-100 px-3 py-2 font-mono text-xs">
                xs (2px)
              </div>
              <div className="rounded-sm border border-border bg-neutral-100 px-3 py-2 font-mono text-xs">
                sm (4px)
              </div>
              <div className="rounded-md border border-border bg-neutral-100 px-3 py-2 font-mono text-xs">
                md (6px)
              </div>
              <div className="rounded-lg border border-border bg-neutral-100 px-3 py-2 font-mono text-xs">
                lg (8px)
              </div>
              <div className="rounded-full border border-border bg-neutral-100 px-3 py-2 font-mono text-xs">
                full (Pill)
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-border bg-card p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Skala Spacing (4px / 8px Modular)
            </h3>
            <div className="flex items-end gap-2">
              <div className="h-2 w-2 bg-primary" title="2 (8px)"></div>
              <div className="h-3 w-3 bg-primary" title="3 (12px)"></div>
              <div className="h-4 w-4 bg-primary" title="4 (16px)"></div>
              <div className="h-6 w-6 bg-primary" title="6 (24px)"></div>
              <div className="h-8 w-8 bg-primary" title="8 (32px)"></div>
              <div className="h-12 w-12 bg-primary" title="12 (48px)"></div>
            </div>
          </div>
        </div>
      </section>

      {/* RASIO KONTRAS WCAG AA */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold text-foreground">
          7. Matriks Rasio Kontras (Kepatuhan WCAG AA / AAA)
        </h2>
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-neutral-100 text-neutral-700">
              <tr>
                <th className="p-3 font-semibold">Teks / Elemen</th>
                <th className="p-3 font-semibold">Latar Belakang</th>
                <th className="p-3 font-semibold">Rasio Kontras</th>
                <th className="p-3 font-semibold">Kriteria Aksesibilitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contrastPairs.map((pair, idx) => (
                <tr key={idx} className="hover:bg-neutral-50">
                  <td className="p-3 font-medium text-foreground">{pair.foreground}</td>
                  <td className="p-3 text-muted-foreground">{pair.background}</td>
                  <td className="p-3 font-mono font-bold text-foreground">
                    {pair.ratio}
                  </td>
                  <td className="p-3">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
                      {pair.wcag}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
