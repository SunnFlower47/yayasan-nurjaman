/**
 * Utilitas pemformatan mata uang dan tanggal standar Indonesia
 * Sesuai aturan UI-UX-RULES.md dan WORKING-RULES.md
 */

/**
 * Format angka integer rupiah menjadi string standar Indonesia.
 * Contoh: 1250000 -> "Rp 1.250.000"
 * Nilai negatif: -1250000 -> "-Rp 1.250.000" atau "(Rp 1.250.000)" sesuai opsi
 */
export function formatRupiah(
  amount: number | bigint,
  options?: { accountingStyle?: boolean; includeSymbol?: boolean }
): string {
  const isNegative = amount < 0n || amount < 0;
  const absAmount =
    typeof amount === "bigint" ? (isNegative ? -amount : amount) : Math.abs(amount);

  const formattedNumber = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(absAmount);

  const symbol = options?.includeSymbol !== false ? "Rp " : "";

  if (isNegative) {
    if (options?.accountingStyle) {
      return `(${symbol}${formattedNumber})`;
    }
    return `-${symbol}${formattedNumber}`;
  }

  return `${symbol}${formattedNumber}`;
}

/**
 * Format tanggal standar Indonesia
 * Contoh: Date -> "4 November 2026"
 */
export function formatTanggal(
  date: Date | string | number,
  options?: { includeTime?: boolean; format?: "long" | "short" | "numeric" }
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return "-";
  }

  if (options?.format === "numeric") {
    // 04/11/2026
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: options?.format === "short" ? "short" : "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  };

  if (options?.includeTime) {
    dateOptions.hour = "2-digit";
    dateOptions.minute = "2-digit";
  }

  return new Intl.DateTimeFormat("id-ID", dateOptions).format(d);
}

// dummy edit for precommit test
