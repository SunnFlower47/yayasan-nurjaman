#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const changelogsDir = path.join(rootDir, "changelogs");

const args = process.argv.slice(2);
const title = args.join(" ").trim();

if (!title) {
  console.error("❌ Error: Judul changelog wajib disertakan!");
  console.log('Penggunaan: pnpm changelog:new "judul singkat perubahan"');
  process.exit(1);
}

// Format slug kebab-case
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, "")
  .trim()
  .replace(/\s+/g, "-");

// Dapatkan waktu Jakarta (Asia/Jakarta)
const now = new Date();
const formatterDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const [year, month, day] = formatterDate.format(now).split("-");
const dateStr = `${year}-${month}-${day}`;

const formatterTime = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const timeStr = formatterTime.format(now);

// Cari nomor urut berikutnya
if (!fs.existsSync(changelogsDir)) {
  fs.mkdirSync(changelogsDir, { recursive: true });
}

const existingFiles = fs.readdirSync(changelogsDir);
let maxId = 0;

for (const file of existingFiles) {
  const match = file.match(/^(\d{4})-/);
  if (match && match[1]) {
    const id = parseInt(match[1], 10);
    if (id > maxId) {
      maxId = id;
    }
  }
}

const nextId = String(maxId + 1).padStart(4, "0");
const filename = `${nextId}-${dateStr}-${slug}.md`;
const filePath = path.join(changelogsDir, filename);

const content = `# [ID: ${nextId}] ${title}

- **Tanggal & Waktu**: ${dateStr} ${timeStr} WIB (Asia/Jakarta)
- **Tipe Perubahan**: chore | feat | fix | refactor | docs | db | deps | security | ui | config
- **Fase / Modul**: Fase X (nama-modul)
- **Penulis / Agent**: Senior Full-Stack Engineer

---

## 1. Ringkasan Perubahan
Tuliskan ringkasan padat 2-4 kalimat mengenai perubahan ini.

## 2. Latar Belakang & Alasan
Jelaskan motivasi dan alasan teknis atau bisnis di balik perubahan ini.

## 3. Rincian File yang Berubah
- **Ditambah**:
  - \`path/ke/file\`
- **Diubah**:
  - \`path/ke/file\`
- **Dihapus**:
  - \`path/ke/file\`

## 4. Perubahan Basis Data (Database)
- **Nama Migrasi**: \`None\`
- **Dampak Data**: Tidak ada perubahan skema / dampak data.

## 5. Perubahan Dependensi (Dependencies)
- **Ditambah**: Tidak ada
- **Diubah / Dihapus**: Tidak ada

## 6. Dampak & Risiko
Analisis potensi efek samping dan mitigasi risiko.

## 7. Prosedur Verifikasi
Langkah pengujian untuk memverifikasi fungsionalitas:
1. \`pnpm test\`
2. \`pnpm build\`

## 8. Prosedur Rollback
Langkah pemulihan bila ditemukan isu:
1. \`git revert <commit-hash>\`

## 9. Status Pengujian
- [x] Linting bersih (\`pnpm lint\`)
- [x] Typecheck bersih (\`pnpm typecheck\`)
- [x] Test unit lulus (\`pnpm test\`)

## 10. Tautan Terkait & Catatan Keamanan
- Keputusan Terkait: ARCHITECTURE.md / WORKING-RULES.md
- Catatan Keamanan: Tidak ada risiko keamanan yang timbul.
`;

fs.writeFileSync(filePath, content, "utf-8");
console.log(`✅ Entri changelog berhasil dibuat:`);
console.log(`   ${filePath}`);
