/**
 * src/modules/auth/helpers/ip.ts
 * Normalisasi alamat IP (IPv6 /64 dan IPv4) dan deteksi IP klien dari proksi terpercaya.
 */

/**
 * Memperluas notasi ringkas IPv6 (termasuk '::') menjadi 8 hextet standar.
 */
function expandIPv6(ip: string): string[] {
  const parts = ip.split("::");
  const left = parts[0] ? parts[0].split(":") : [];
  const right = parts.length > 1 && parts[1] ? parts[1].split(":") : [];
  const missingCount = 8 - (left.length + right.length);
  const middle = Array<string>(Math.max(0, missingCount)).fill("0");
  const full = [...left, ...middle, ...right];
  return full.map((h) => h.toLowerCase().padStart(4, "0"));
}

/**
 * Menormalisasi alamat IPv6 ke prefiks subnet /64 untuk rate limiting.
 * Alamat IPv4 dikembalikan dalam format standar string bersih.
 */
export function normalizeIp(ip: string): string {
  const trimmed = ip.trim();

  // Tangani IPv4-mapped IPv6 (misal ::ffff:192.168.1.1)
  if (trimmed.startsWith("::ffff:")) {
    return trimmed.slice(7);
  }

  // Alamat IPv4 standar
  if (!trimmed.includes(":")) {
    return trimmed;
  }

  // Alamat IPv6
  try {
    const hextets = expandIPv6(trimmed);
    const prefixHextets = hextets.slice(0, 4);
    // Format standar prefiks 64-bit
    return `${prefixHextets.map((h) => parseInt(h, 16).toString(16)).join(":")}::/64`;
  } catch {
    return trimmed;
  }
}

/**
 * Mengambil IP klien dari header request.
 * Header x-forwarded-for dan x-real-ip HANYA dipercaya bila TRUSTED_PROXY=true di env.
 */
export function getClientIp(headers: Headers): string {
  const isTrustedProxy =
    process.env["TRUSTED_PROXY"] === "true" || process.env["TRUSTED_PROXY"] === "1";

  if (isTrustedProxy) {
    const forwarded = headers.get("x-forwarded-for");
    if (forwarded) {
      const firstIp = forwarded.split(",")[0]?.trim();
      if (firstIp) return normalizeIp(firstIp);
    }
    const realIp = headers.get("x-real-ip");
    if (realIp) return normalizeIp(realIp.trim());
  }

  // Fallback lokal default aman
  return "127.0.0.1";
}
