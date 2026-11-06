/**
 * src/modules/auth/repositories/user.repository.ts
 * Akses basis data untuk entitas pengguna pada alur autentikasi.
 */

import { db } from "@/lib/db";
import type { User } from "@prisma/client";

export class UserRepository {
  async findByUsername(username: string): Promise<User | null> {
    const cleanUsername = username.trim().toLowerCase();
    return db.user.findFirst({
      where: {
        username: cleanUsername,
        deletedAt: null,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return db.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<User> {
    return db.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        mustChangePassword: false,
      },
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }
}

export const userRepository = new UserRepository();
