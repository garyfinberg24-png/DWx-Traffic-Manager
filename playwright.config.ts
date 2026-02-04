import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for LP Demo Scheduler E2E Tests
 *
 * Usage:
 * 1. First run: npx playwright test e2e/auth-setup.ts --headed
 *    (This captures your login session)
 *
 * 2. Then run tests: npx playwright test
 *    (Tests will use the saved session)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run tests sequentially for MSAL session stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid session conflicts
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Setup project - run once to capture auth
    {
      name: 'setup',
      testMatch: /auth-setup\.ts/,
      timeout: 180000, // 3 minutes for manual login
      use: {
        ...devices['Desktop Edge'],
        headless: false, // Must be headed for manual login
        channel: 'msedge', // Use installed Edge
      },
    },

    // Main test project - uses saved auth
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: './e2e/.auth/session.json',
      },
      dependencies: ['setup'],
    },

    // Edge tests (optional)
    {
      name: 'edge',
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices['Desktop Edge'],
        storageState: './e2e/.auth/session.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Dev server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
