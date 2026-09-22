import path from 'path';
import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT ?? '3000';
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['list'], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // Starts the OMS server (`npm start` from the repo root) before the suite
  // and tears it down after, so `npm test` is the only command anyone needs.
  webServer: {
    command: 'npm start',
    cwd: path.resolve(__dirname, '..'),
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      // No browser needed — hits the REST API directly over HTTP.
      name: 'api',
      testDir: './tests/api',
    },
    {
      // Drives the real bundled UI (public/index.html) in a real browser.
      // UI and integration specs both need a browser, so they share this project.
      name: 'chromium',
      testDir: './tests',
      testIgnore: ['**/api/**'],
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to expand cross-browser coverage once the chromium suite is stable:
    // {
    //   name: 'firefox',
    //   testDir: './tests',
    //   testIgnore: ['**/api/**'],
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   testDir: './tests',
    //   testIgnore: ['**/api/**'],
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});
