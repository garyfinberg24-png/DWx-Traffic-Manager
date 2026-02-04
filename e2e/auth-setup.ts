/**
 * Playwright Auth Setup Script
 *
 * This script helps capture and reuse authentication state for E2E testing.
 *
 * Usage:
 * 1. Run: npx playwright test e2e/auth-setup.ts --headed
 * 2. Log in manually when the browser opens
 * 3. The script will save your session to e2e/.auth/session.json
 * 4. Subsequent tests will reuse this session
 */

import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, '.auth', 'session.json');

setup('authenticate', async ({ page }) => {
  // Ensure auth directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Navigate to the app
  await page.goto('http://localhost:5173');

  // Wait for login page to load
  await expect(page.getByRole('button', { name: /sign in with microsoft/i })).toBeVisible();

  console.log('\n========================================');
  console.log('MANUAL LOGIN REQUIRED');
  console.log('========================================');
  console.log('1. Click "Sign in with Microsoft"');
  console.log('2. Complete Windows Hello authentication');
  console.log('3. Wait for the app to load');
  console.log('4. The script will automatically save your session');
  console.log('========================================\n');

  // Click login button
  await page.getByRole('button', { name: /sign in with microsoft/i }).click();

  // Wait for user to complete manual authentication
  // The app should redirect to /booking or /my-bookings after login
  await page.waitForURL(/\/(booking|my-bookings|dashboard)/, {
    timeout: 120000 // 2 minutes for manual login
  });

  // Verify we're logged in by checking for user-specific content
  await expect(page.locator('text=New Booking').or(page.locator('text=My Bookings'))).toBeVisible({
    timeout: 10000
  });

  console.log('\n✅ Login successful! Saving session...\n');

  // Save storage state (cookies, localStorage, sessionStorage)
  await page.context().storageState({ path: authFile });

  console.log(`✅ Session saved to: ${authFile}`);
  console.log('You can now run tests without logging in again.\n');
});
