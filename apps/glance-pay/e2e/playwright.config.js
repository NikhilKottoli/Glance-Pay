import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 45_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:8787",
    viewport: { width: 1280, height: 720 },
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    command: "node apps/glance-pay/server/server.mjs",
    cwd: "../..",
    url: "http://127.0.0.1:8787/api/health",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
