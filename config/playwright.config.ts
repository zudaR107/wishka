import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "../tests/e2e",
  globalSetup: "../tests/e2e/global-setup.ts",
  use: {
    baseURL: "http://127.0.0.1:3000",
    browserName: "chromium",
    headless: true,
  },
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
