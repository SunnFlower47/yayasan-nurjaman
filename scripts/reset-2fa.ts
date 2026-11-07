/**
 * scripts/reset-2fa.ts
 * Skrip darurat pemulihan operator (break-glass CLI) untuk mereset 2FA pengguna.
 * Penggunaan: pnpm admin:reset-2fa -- --username <username>
 */

import readline from "readline";
import { PrismaClient } from "@prisma/client";
import { twoFactorService } from "../src/modules/auth/services/two-factor.service";

async function main() {
  const args = process.argv.slice(2);
  const usernameIdx = args.indexOf("--username");
  const username =
    usernameIdx !== -1 ? args[usernameIdx + 1]?.trim().toLowerCase() : null;

  if (!username) {
    console.error("❌ Argumen --username wajib disertakan.");
    console.error("Penggunaan: pnpm admin:reset-2fa -- --username <nama_pengguna>");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findFirst({
      where: {
        username,
        deletedAt: null,
      },
    });

    if (!user) {
      console.error(`❌ Pengguna dengan username "${username}" tidak ditemukan.`);
      process.exit(1);
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const confirmation = await new Promise<string>((resolve) => {
      rl.question(
        `⚠️  PERINGATAN PEMULIHAN DARURAT (BREAK-GLASS)\n` +
          `Anda akan mereset 2FA TOTP dan seluruh recovery code untuk pengguna "${user.username}" (${user.name}).\n` +
          `Seluruh sesi aktif pengguna akan langsung dicabut.\n` +
          `Ketik ulang username "${user.username}" untuk konfirmasi: `,
        (answer) => {
          rl.close();
          resolve(answer.trim().toLowerCase());
        }
      );
    });

    if (confirmation !== user.username.toLowerCase()) {
      console.error("❌ Konfirmasi tidak cocok. Prosedur reset 2FA dibatalkan.");
      process.exit(1);
    }

    console.log(
      `Mengosongkan secret 2FA dan mencabut seluruh sesi untuk ${user.username}...`
    );

    await twoFactorService.resetTwoFactor(user.id, {
      id: "cli",
      ip: "127.0.0.1",
      userAgent: "CLI-Operator-BreakGlass/1.0",
    });

    console.log(`✅ Berhasil! 2FA untuk "${user.username}" telah direset.`);
    console.log(`Jejak audit dan insiden keamanan dengan aktor "cli" telah dicatat.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Terjadi kegagalan fatal saat reset 2FA:", err);
  process.exit(1);
});
