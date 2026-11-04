#!/usr/bin/env node

import { execSync } from "node:child_process";

if (process.env.SKIP_CHANGELOG_CHECK === "1") {
  console.log(
    "⚠️ PERINGATAN: Pemeriksaan changelog dilewati melalui SKIP_CHANGELOG_CHECK=1."
  );
  console.log(
    "Pastikan alasan penggunaan bypass ini dicatat pada entri changelog berikutnya!\n"
  );
  process.exit(0);
}

let stagedFiles = [];
try {
  const output = execSync("git diff --cached --name-only", { encoding: "utf-8" });
  stagedFiles = output
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
} catch {
  // Jika bukan git repository atau belum ada commit
  process.exit(0);
}

if (stagedFiles.length === 0) {
  process.exit(0);
}

// Pola file kode atau konfigurasi yang mewajibkan adanya entri changelog
const codeOrConfigPattern =
  /^(src\/|prisma\/|scripts\/|package\.json|pnpm-lock\.yaml|tsconfig\.json|eslint\.config\.mjs|next\.config\.ts|tailwind\.config\.ts|postcss\.config\.mjs|docker-compose\.yml|Dockerfile|\.env\.example|\.prettierrc|\.editorconfig)/i;

const touchesCodeOrConfig = stagedFiles.some((file) => codeOrConfigPattern.test(file));
const touchesChangelog = stagedFiles.some(
  (file) => file.startsWith("changelogs/") && file !== "changelogs/README.md"
);

if (touchesCodeOrConfig && !touchesChangelog) {
  console.error(
    "\n================================================================================"
  );
  console.error(
    "❌ COMMIT DITOLAK: Perubahan kode/konfigurasi terdeteksi tanpa entri changelog!"
  );
  console.error(
    "================================================================================"
  );
  console.error("Berdasarkan WORKING-RULES.md:");
  console.error(
    "Setiap perubahan fitur, bugfix, refactor, config, atau DB wajib memiliki entri"
  );
  console.error("di folder changelogs/ sebelum di-commit.\n");
  console.error("File staged yang memerlukan changelog:");
  stagedFiles
    .filter((f) => codeOrConfigPattern.test(f))
    .slice(0, 10)
    .forEach((f) => {
      console.error(`  - ${f}`);
    });
  console.error("\nSolusi:");
  console.error("1. Buat entri changelog baru:");
  console.error('   pnpm changelog:new "judul singkat perubahan"');
  console.error("2. Lengkapi template di file changelog yang dihasilkan.");
  console.error("3. Stage file changelog dan coba commit kembali:");
  console.error("   git add changelogs/");
  console.error('   git commit -m "..."\n');
  console.error("Bypass darurat (hanya untuk situasi mendesak):");
  console.error('   SKIP_CHANGELOG_CHECK=1 git commit -m "..."');
  console.error(
    "================================================================================\n"
  );
  process.exit(1);
}

process.exit(0);
