#!/usr/bin/env node

/**
 * scripts/scan-secrets.mjs
 * Pemindai rahasia, kunci privat, dan kredensial bocor.
 * Dapat dijalankan untuk memindai berkas staged (--staged) atau seluruh repositori kode sumber.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const isStagedOnly = process.argv.includes("--staged");

const IGNORED_PATHS = [
  ".git",
  "node_modules",
  ".next",
  "pnpm-lock.yaml",
  ".env.example",
  "docs/",
  "changelogs/",
];

const SECRET_PATTERNS = [
  {
    name: "Private Key PEM",
    regex: /-----BEGIN\s+(?:RSA|OPENSSH|EC|DSA|PGP|PRIVATE)\s+KEY-----/,
  },
  {
    name: "AWS Access Key ID",
    regex: /\b(AKIA[0-9A-Z]{16})\b/,
  },
  {
    name: "GitHub Token",
    regex: /\b(gh[pousr]_[A-Za-z0-9_]{36,255}|github_pat_[A-Za-z0-9_]{82})\b/,
  },
  {
    name: "Stripe Live Secret Key",
    regex: /\b(sk_live_[0-9a-zA-Z]{24,34})\b/,
  },
  {
    name: "Slack Token",
    regex: /\b(xox[baprs]-[0-9a-zA-Z]{10,48})\b/,
  },
  {
    name: "Hardcoded API Key / Secret Literal",
    regex:
      /(?:api[_-]?key|secret[_-]?key|auth[_-]?token|private[_-]?key)\s*[:=]\s*["']([A-Za-z0-9_\-]{24,})["']/i,
    filter: (match) => {
      const val = match[1]?.toLowerCase() || "";
      return !(
        val.includes("placeholder") ||
        val.includes("example") ||
        val.includes("changeme") ||
        val.includes("your-secret") ||
        val.includes("dev-secret")
      );
    },
  },
];

function isGitIgnored(filePath) {
  try {
    execSync(`git check-ignore -q "${filePath}"`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function getFilesToScan() {
  if (isStagedOnly) {
    try {
      const output = execSync("git diff --cached --name-only --diff-filter=ACM", {
        encoding: "utf-8",
      });
      return output
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean)
        .map((f) => path.join(projectRoot, f));
    } catch {
      return [];
    }
  }

  const allFiles = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(projectRoot, fullPath).replace(/\\/g, "/");

      if (IGNORED_PATHS.some((p) => relPath === p || relPath.startsWith(p))) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        // Jangan scan berkas yang sudah di-ignore oleh git pada full scan (seperti file lokal .env)
        if (!isStagedOnly && isGitIgnored(fullPath)) {
          continue;
        }
        allFiles.push(fullPath);
      }
    }
  }

  walk(projectRoot);
  return allFiles;
}

const files = getFilesToScan();
const findings = [];

for (const filePath of files) {
  const relPath = path.relative(projectRoot, filePath).replace(/\\/g, "/");

  // Jika berkas .env dicoba di-stage atau ter-track tanpa ignore
  if (
    /^\.env(\.local|\.production|\.development)?$/.test(path.basename(relPath)) &&
    relPath !== ".env.example"
  ) {
    findings.push({
      file: relPath,
      line: 1,
      rule: "Forbidden Env File",
      snippet: "Berkas .env tidak boleh di-commit ke dalam repositori git!",
    });
    continue;
  }

  if (!fs.existsSync(filePath)) continue;

  let content;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    continue; // File biner
  }

  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    for (const pattern of SECRET_PATTERNS) {
      const match = line.match(pattern.regex);
      if (match) {
        if (pattern.filter && !pattern.filter(match)) {
          continue;
        }
        findings.push({
          file: relPath,
          line: idx + 1,
          rule: pattern.name,
          snippet: line.trim().slice(0, 60) + "...",
        });
      }
    }
  });
}

if (findings.length > 0) {
  console.error(
    "\n================================================================================"
  );
  console.error("❌ KUNCI RAHASIA ATAU KREDENSIAL TERDETEKSI!");
  console.error(
    "================================================================================"
  );
  for (const f of findings) {
    console.error(`- [${f.rule}] ${f.file}:${f.line}`);
    console.error(`  Cuplikan: ${f.snippet}\n`);
  }
  console.error("Segera cabut (revoke) kunci rahasia yang terlanjur terekspos.");
  console.error("Gunakan variabel lingkungan via .env (yang tidak di-commit).");
  console.error(
    "================================================================================\n"
  );
  process.exit(1);
}

console.log(
  `🔒 Pemindaian rahasia selesai: ${files.length} berkas diperiksa. Tidak ada rahasia terdeteksi.`
);
process.exit(0);
