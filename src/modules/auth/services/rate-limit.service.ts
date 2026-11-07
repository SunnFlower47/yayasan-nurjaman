/**
 * src/modules/auth/services/rate-limit.service.ts
 * Layanan pelindung brute-force dan pembatasan laju percobaan login & 2FA.
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

  async recordLoginFailure(
    username: string,
    ip: string
  ): Promise<{ lockedOut: boolean; blockedUntil?: Date }> {
    const windowStart = this.getCurrentWindowStart();
    const userKey = this.getUserKey(username);
    const ipKey = this.getIpKey(ip);

    const userCounter = await rateLimitRepository.increment(userKey, windowStart);
    let blockedUntil: Date | null = null;

    if (userCounter.hitCount >= RATE_LIMIT_MAX_ATTEMPTS) {
      blockedUntil = new Date(Date.now() + RATE_LIMIT_LOCKOUT_MS);
      await rateLimitRepository.increment(userKey, windowStart, blockedUntil);
    }

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

  async recordLoginSuccess(username: string, ip: string): Promise<void> {
    await rateLimitRepository.reset(this.getUserKey(username));
    await rateLimitRepository.reset(this.getIpKey(ip));
  }

  async recordMfaFailure(
    sessionId: string
  ): Promise<{ lockedOut: boolean; attempts: number }> {
    const key = `auth:mfa:session:${sessionId}`;
    const windowStart = this.getCurrentWindowStart();
    const counter = await rateLimitRepository.increment(key, windowStart);
    return {
      lockedOut: counter.hitCount >= 5,
      attempts: counter.hitCount,
    };
  }

  async resetMfaFailure(sessionId: string): Promise<void> {
    await rateLimitRepository.reset(`auth:mfa:session:${sessionId}`);
  }
}

export const rateLimitService = new RateLimitService();
