import { test, expect } from "@playwright/test";

test.describe("API Health Smoke Test", () => {
  test("route /api/health mengembalikan struktur status kesehatan yang valid", async ({
    request,
  }) => {
    const response = await request.get("/api/health");

    // Status bisa 200 (database connected) atau 503 (database disconnected saat belum aktif)
    expect([200, 503]).toContain(response.status());

    const body = await response.json();
    expect(body).toHaveProperty("service", "yayasan-nurjaman-api");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("database");
    expect(body.database).toHaveProperty("status");
    expect(["connected", "disconnected"]).toContain(body.database.status);
  });
});
