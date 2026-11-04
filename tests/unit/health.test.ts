import { describe, it, expect } from "vitest";
import { formatRupiah, formatTanggal } from "@/lib/format";

describe("Format Utilities", () => {
  it("memformat rupiah positif dengan benar", () => {
    expect(formatRupiah(1250000)).toBe("Rp 1.250.000");
    expect(formatRupiah(0)).toBe("Rp 0");
  });

  it("memformat rupiah negatif dengan gaya standar dan akuntansi", () => {
    expect(formatRupiah(-500000)).toBe("-Rp 500.000");
    expect(formatRupiah(-500000, { accountingStyle: true })).toBe("(Rp 500.000)");
  });

  it("memformat tanggal standar Indonesia", () => {
    const date = new Date("2026-11-04T06:00:00Z");
    const formatted = formatTanggal(date, { format: "long" });
    expect(formatted).toContain("November");
    expect(formatted).toContain("2026");
  });
});
