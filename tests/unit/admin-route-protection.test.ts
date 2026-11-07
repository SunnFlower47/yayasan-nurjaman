import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

function findFiles(dir: string, filter: (file: string) => boolean): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findFiles(fullPath, filter));
    } else if (filter(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("Penegakan Keamanan Server: Otorisasi Halaman dan Action Administratif", () => {
  it("seluruh page.tsx di bawah src/app/(admin) wajib memanggil requireUser atau requirePermission", () => {
    const adminPagesDir = path.resolve(process.cwd(), "src/app/(admin)");
    const pageFiles = findFiles(adminPagesDir, (name) => name === "page.tsx");

    expect(pageFiles.length).toBeGreaterThan(0);

    const unprotectedPages: string[] = [];

    for (const pagePath of pageFiles) {
      const content = fs.readFileSync(pagePath, "utf-8");
      const hasRequireUser =
        content.includes("requireUser(") || content.includes("requirePermission(");

      if (!hasRequireUser) {
        unprotectedPages.push(path.relative(process.cwd(), pagePath));
      }
    }

    expect(
      unprotectedPages,
      `Halaman administratif berikut belum memanggil requireUser atau requirePermission di server layer:\n${unprotectedPages.join("\n")}`
    ).toEqual([]);
  });

  it("layout.tsx di bawah src/app/(admin) memanggil requireUser untuk proteksi lapis pertama", () => {
    const layoutPath = path.resolve(process.cwd(), "src/app/(admin)/layout.tsx");
    const content = fs.readFileSync(layoutPath, "utf-8");
    expect(content).toContain("requireUser(");
  });
});
