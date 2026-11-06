/**
 * src/modules/auth/services/rate-limit.service.ts
 * Layanan pelindung brute-force dan pembatasan laju percobaan login.
 */

import {
  RATE_LIMIT_MAX_ATTEMPTS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_LOCKOUT_MS,
} from "../constants";
import { rateLimitRepository } from "../repositories/rate-limit.repository";
import { normalizeIp } from "../helpers/ip";

export interface RateLimitCheckResult {
  blocked: boolean;
  blockedUntil?: Date;
}

export class RateLimitService {
  private getUserKey(username: string): string {
    return `auth:login:user:${username.trim().toLowerCase()}`;
  }

  private getIpKey(ip: string): string {
    return `auth:login:ip:${normalizeIp(ip)}`;
  }

  private getCurrentWindowStart(): Date {
    const now = Date.now();
    return new Date(Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS);
  }

  /**
   * Memeriksa apakah username atau IP saat ini sedang terkena sanksi lockout.
   */
  async checkLoginRateLimit(username: string, ip: string): Promise<RateLimitCheckResult> {
    const userBlocked = await rateLimitRepository.findActiveBlocked(
      this.getUserKey(username)
    );
    if (userBlocked?.blockedUntil) {
      return { blocked: true, blockedUntil: userBlocked.blockedUntil };
    }

    const ipBlocked = await rateLimitRepository.findActiveBlocked(this.getIpKey(ip));
    if (ipBlocked?.blockedUntil) {
      return { blocked: true, blockedUntil: ipBlocked.blockedUntil };
    }

    return { blocked: false };
  }

  /**
   * Mencatat kegagalan login dan memberlakukan penguncian progresif jika ambang batas terlampaui.
   */
  async recordLoginFailure(
    username: string,
    ip: string
  ): Promise<{ lockedOut: boolean; blockedUntil?: Date }> {
    const windowStart = this.getCurrentWindowStart();
    const userKey = this.getUserKey(username);
    const ipKey = this.getIpKey(ip);

    // Hitung percobaan akun
    const userCounter = await rateLimitRepository.increment(userKey, windowStart);
    let blockedUntil: Date | null = null;

    if (userCounter.hitCount >= RATE_LIMIT_MAX_ATTEMPTS) {
      blockedUntil = new Date(Date.now() + RATE_LIMIT_LOCKOUT_MS);
      await rateLimitRepository.increment(userKey, windowStart, blockedUntil);
    }

    // Hitung percobaan IP
    const ipCounter = await rateLimitRepository.increment(ipKey, windowStart);
    if (ipCounter.hitCount >= RATE_LIMIT_MAX_ATTEMPTS) {
      blockedUntil = new Date(Date.now() + RATE_LIMIT_LOCKOUT_MS);
      await rateLimitRepository.increment(ipKey, windowStart, blockedUntil);
    }

    if (blockedUntil) {
      return { lockedOut: true, blockedUntil };
    }

    return { lockedOut: false };
  }

  /**
   * Menghapus riwayat kegagalan percobaan setelah login berhasil.
   */
  async recordLoginSuccess(username: string, ip: string): Promise<void> {
    await rateLimitRepository.reset(this.getUserKey(username));
    await rateLimitRepository.reset(this.getIpKey(ip));
  }
}

export const rateLimitService = new RateLimitService();
