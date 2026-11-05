import React from "react";

export function TypographySection() {
  return (
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
  );
}
