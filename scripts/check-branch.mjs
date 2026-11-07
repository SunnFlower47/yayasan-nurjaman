import { execSync } from "node:child_process";

try {
  // Dapatkan nama branch aktif
  const branchName = execSync("git branch --show-current", { encoding: "utf8" }).trim();

  if (branchName === "main" || branchName === "master") {
    // Periksa apakah commit ini adalah merge commit
    let isMergeCommit = false;
    try {
      execSync("git rev-parse -q --verify MERGE_HEAD", { stdio: "ignore" });
      isMergeCommit = true;
    } catch {
      // Bukan merge commit jika MERGE_HEAD tidak ada
      isMergeCommit = false;
    }

    if (!isMergeCommit) {
      console.error(
        "\n❌ [GAGAL] Dilarang melakukan commit langsung ke branch main/master!"
      );
      console.error(
        "   Seluruh pekerjaan wajib dilakukan melalui feature branch (misal: feat/... atau docs/...)."
      );
      console.error(
        "   Silakan buat branch baru dengan perintah: git checkout -b feat/nama-tugas\n"
      );
      process.exit(1);
    }
  }

  process.exit(0);
} catch (error) {
  if (error.status === 1) {
    process.exit(1);
  }
  // Bila terjadi galat git di luar dugaan, biarkan proses berlanjut
  process.exit(0);
}
