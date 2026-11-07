import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env["CI"]);
const baseURL = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI ? { workers: 1 } : {}),
  reporter: "list",
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
  ],
  ...(!baseURL.startsWith("https://")
    ? {
        webServer: {
          command: "pnpm dev",
          url: "http://localhost:3000/api/health",
          reuseExistingServer: !isCI,
          timeout: 120 * 1000,
        },
      }
    : {}),
});
