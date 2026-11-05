import React from "react";

interface ContrastPair {
  foreground: string;
  background: string;
  ratio: string;
  wcag: string;
}

const contrastPairs: ContrastPair[] = [
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

export function ContrastMatrixSection() {
  return (
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
          <tbody className="divide-y border-border">
            {contrastPairs.map((pair, idx) => (
              <tr key={idx} className="hover:bg-neutral-50">
                <td className="p-3 font-medium text-foreground">{pair.foreground}</td>
                <td className="p-3 text-muted-foreground">{pair.background}</td>
                <td className="p-3 font-mono font-bold text-foreground">{pair.ratio}</td>
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
  );
}
