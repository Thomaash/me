import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e/playwright",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 0,
  workers: 1,
  reporter: "list",
  timeout: 60_000,

  use: {
    baseURL: "http://127.0.0.1:5173",
    viewport: { width: 1311, height: 737 },
    actionTimeout: 15_000,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
});
