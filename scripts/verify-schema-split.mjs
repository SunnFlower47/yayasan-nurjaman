import fs from "node:fs";
import path from "node:path";

const oldFile = path.resolve("docs/DATABASE-SCHEMA.md");
const oldContent = fs.readFileSync(oldFile, "utf8");

// Parse tables and columns from old file
const oldTables = {};
let currentTable = null;

for (const line of oldContent.split("\n")) {
  const tableMatch = line.match(/^###\s+([a-z0-9_]+)/);
  if (tableMatch) {
    const name = tableMatch[1];
    if (name !== "6") {
      // ignore '### 6 Poin Keputusan'
      currentTable = name;
      oldTables[currentTable] = [];
    }
  } else if (currentTable) {
    const colMatch = line.match(/^\|\s*`([a-z0-9_]+)`/);
    if (colMatch) {
      oldTables[currentTable].push(colMatch[1]);
    }
  }
}

// Read all modular files in docs/database/0*.md
const dbDir = path.resolve("docs/database");
const modularFiles = fs
  .readdirSync(dbDir)
  .filter((f) => /^0[0-9].*\.md$/.test(f))
  .map((f) => fs.readFileSync(path.join(dbDir, f), "utf8"))
  .join("\n");

const missingTables = [];
const missingColumns = [];

for (const [table, columns] of Object.entries(oldTables)) {
  const tableRegex = new RegExp(`(^|\\n)#{2,3}\\s+${table}\\b`, "m");
  if (!tableRegex.test(modularFiles)) {
    missingTables.push(table);
  }

  for (const col of columns) {
    const colRegex = new RegExp(`\`${col}\``);
    if (!colRegex.test(modularFiles)) {
      missingColumns.push(`${table}.${col}`);
    }
  }
}

console.log("=== HASIL PEMERIKSAAN KELENGKAPAN SKEMA MODULAR ===");
console.log(`Total tabel di DATABASE-SCHEMA.md: ${Object.keys(oldTables).length}`);
console.log(`Tabel yang belum tercakup di docs/database/0*.md: ${missingTables.length}`);
if (missingTables.length > 0) {
  missingTables.forEach((t) => console.log(` - Tabel hilang: ${t}`));
}
console.log(`Kolom yang belum tercakup di docs/database/0*.md: ${missingColumns.length}`);
if (missingColumns.length > 0) {
  missingColumns.forEach((c) => console.log(` - Kolom hilang: ${c}`));
}

if (missingTables.length === 0 && missingColumns.length === 0) {
  console.log(
    "STATUS: SELURUH TABEL DAN KOLOM LAMA TELAH 100% TERCAKUP PADA BERKAS MODULAR."
  );
} else {
  console.log("STATUS: DITEMUKAN SELISIH.");
  process.exit(1);
}
