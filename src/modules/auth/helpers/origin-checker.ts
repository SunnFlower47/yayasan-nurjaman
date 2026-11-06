/**
 * src/modules/auth/helpers/origin-checker.ts
 * Verifikasi Origin pada Server Actions dan sanitasi parameter pengalihan internal (next).
 */

/**
 * Memvalidasi apakah header Origin atau Referer sesuai dengan daftar domain yang diizinkan.
 */
export function verifyActionOrigin(headers: Headers): boolean {
  if (process.env["NODE_ENV"] === "test") {
    return true; // Bypass terisolasi murni pengujian unit
  }

  const originHeader = headers.get("origin") || headers.get("referer");
  if (!originHeader) {
    return false;
  }

  try {
    const parsedOrigin = new URL(originHeader).origin;
    const allowedEnv = process.env["ALLOWED_ORIGINS"] || "";
    const allowedList = allowedEnv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const defaultOrigin = new URL(
      process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"
    ).origin;
    allowedList.push(defaultOrigin);

    return allowedList.some((allowed) => {
      try {
        return new URL(allowed).origin === parsedOrigin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Memvalidasi path pengalihan (parameter 'next').
 * HANYA mengizinkan path relatif internal (misal: /admin).
 * Menolak keras URL eksternal absolut (http://), skema ganda (//), dan escape karakter.
 */
export function sanitizeRedirectPath(nextPath?: string | null): string {
  if (!nextPath || typeof nextPath !== "string") {
    return "/admin";
  }

  const trimmed = nextPath.trim();

  // Wajib diawali '/' tunggal, dilarang '//', '/\', atau yang mengandung '://'
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.includes("://") ||
    trimmed.includes("\\")
  ) {
    return "/admin";
  }

  return trimmed;
}
