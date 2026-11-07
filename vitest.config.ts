import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL:
        "postgresql://postgres:postgres_master_pass_123!@localhost:5432/yayasan_db?schema=public",
      ENCRYPTION_KEY_ACTIVE_ID: "k1",
      ENCRYPTION_KEYS: "k1:XSH9aj9tlmpITmISXrRFOd1yQB3H+DjEr/ZIFO9m3uc=",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
