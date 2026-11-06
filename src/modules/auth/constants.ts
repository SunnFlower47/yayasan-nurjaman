/**
 * src/modules/auth/constants.ts
 * Konstanta konfigurasi autentikasi, sesi, dan rate limit.
 * Mengacu pada ADR-004, ADR-011, dan docs/SECURITY.md.
 */

// Konfigurasi Nama dan Atribut Cookie
export const AUTH_COOKIE_NAME_DEV = "session";
export const AUTH_COOKIE_NAME_PROD = "__Host-session";

// Waktu Kedaluwarsa Sesi (dalam milidetik)
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 Menit
export const SESSION_ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 Jam
export const SESSION_ACTIVITY_THROTTLE_MS = 60 * 1000; // Maksimal update 1x per menit

// Ukuran Entropi Token Kriptografis
export const SESSION_TOKEN_BYTES = 32; // 256-bit

// Kebijakan Batas Percobaan Login (Rate Limiting)
export const RATE_LIMIT_MAX_ATTEMPTS = 5; // Maks 5 kegagalan
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // Jendela waktu 15 menit
export const RATE_LIMIT_LOCKOUT_MS = 15 * 60 * 1000; // Terkunci selama 15 menit

// Kebijakan Keamanan Kata Sandi
export const PASSWORD_MIN_LENGTH = 12;

// Pesan Kesalahan Seragam (Pencegahan Enumerasi Pengguna)
export const AUTH_INVALID_CREDENTIALS_MSG = "Username atau password salah";
export const AUTH_ACCOUNT_LOCKED_MSG =
  "Terlalu banyak percobaan masuk yang gagal. Silakan coba lagi beberapa saat lagi.";
