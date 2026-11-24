import { defineConfig, devices } from "playwright/test";

const PORT = 1314;

export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Workers share one hugo serve. Third-party requests are blocked in the spec,
  // so pages render from local files and four workers stay stable.
  workers: 4,

  expect: {
    // toHaveScreenshot needs two identical captures in a row. A long page at
    // desktop width takes a few seconds per capture with four workers running,
    // so the default 5s is not enough.
    timeout: 15_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },

  use: {
    baseURL: `http://localhost:${PORT}`,
  },

  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],

  webServer: {
    command: `hugo serve --port ${PORT} --baseURL http://localhost:${PORT}/ --disableLiveReload --noHTTPCache`,
    cwd: "../..",
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    // Per-test durations, to see which pages make a run slow.
    ["json", { outputFile: "results.json" }],
  ],
});
