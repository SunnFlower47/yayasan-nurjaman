#!/usr/bin/env node

/**
 * scripts/check-layers.mjs
 * Memverifikasi batas arsitektur berlapis dan larangan impor antar-lapisan:
 * 1. Komponen UI dilarang mengimpor @prisma/client, @/lib/db, atau berkas repositories/
 * 2. Impor lintas-modul HANYA boleh melalui public API index.ts (dilarang deep-import)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const srcDir = path.join(projectRoot, "src");

const violations = [];

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next") {
        scanDirectory(fullPath);
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const relPath = path.relative(projectRoot, filePath).replace(/\\/g, "/");
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  const isUIComponent =
    relPath.startsWith("src/components/") ||
    relPath.includes("/components/") ||
    (relPath.startsWith("src/app/") &&
      (relPath.endsWith("page.tsx") ||
        relPath.endsWith("layout.tsx") ||
        relPath.endsWith("loading.tsx") ||
        relPath.endsWith("error.tsx")));

  const moduleMatch = relPath.match(/^src\/modules\/([^/]+)\//);
  const currentModule = moduleMatch ? moduleMatch[1] : null;

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Abaikan komentar
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      return;
    }

    // Ekstraksi path impor
    const importMatch = line.match(/(?:import|from)\s+['"]([^'"]+)['"]/);
    if (!importMatch) return;
    const importSource = importMatch[1];

    // Aturan 1: Komponen UI dilarang akses database / repository langsung
    if (isUIComponent) {
      if (
        importSource === "@prisma/client" ||
        importSource === "@/lib/db" ||
        importSource.includes("/repositories/") ||
        importSource.endsWith("/repositories")
      ) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: "UI Layer Boundary Violation",
          message: `Komponen UI dilarang mengimpor database/repository langsung ('${importSource}'). Wajib melalui Route/Action -> Service -> Repository.`,
        });
      }
    }

    // Aturan 2: Larangan deep import antar modul domain
    const crossModuleDeepMatch = importSource.match(
      /^@\/modules\/([^/]+)\/(actions|services|repositories|schemas|components|hooks|types|constants|lib)\b/
    );
    if (crossModuleDeepMatch) {
      const targetModule = crossModuleDeepMatch[1];
      if (currentModule !== targetModule) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: "Cross-Module Boundary Violation",
          message: `Deep import dari modul '${targetModule}' dilarang ('${importSource}'). Modul luar hanya boleh mengimpor dari public API '@/modules/${targetModule}'.`,
        });
      }
    }
  });
}

console.log("🔍 Menjalankan pemeriksaan batas lapisan arsitektur...");
scanDirectory(srcDir);

if (violations.length > 0) {
  console.error(
    "\n================================================================================"
  );
  console.error("❌ PELANGGARAN ARSITEKTUR BERLAPIS TERDETEKSI!");
  console.error(
    "================================================================================"
  );
  for (const v of violations) {
    console.error(`- [${v.rule}] ${v.file}:${v.line}`);
    console.error(`  Pesan: ${v.message}\n`);
  }
  console.error(
    "Rujuk docs/CODE-STANDARDS.md bagian 4 untuk pedoman arsitektur berlapis."
  );
  console.error(
    "================================================================================\n"
  );
  process.exit(1);
}

console.log(
  "✅ Seluruh batas lapisan arsitektur bersih dan sesuai aturan (0 pelanggaran).\n"
);
process.exit(0);
