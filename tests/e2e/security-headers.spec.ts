import { test, expect } from "@playwright/test";

test.describe("Security Headers & Indexing Policy", () => {
  test("halaman publik '/' menyematkan HTTP security headers yang ketat", async ({
    request,
  }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toContain("max-age=63072000");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  });

  test("route /api/health menyematkan X-Robots-Tag untuk mencegah pengindeksan search engine", async ({
    request,
  }) => {
    const response = await request.get("/api/health");
    expect([200, 503]).toContain(response.status());

    const headers = response.headers();
    expect(headers["x-robots-tag"]).toBe("noindex, nofollow, noarchive");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
  });
});
