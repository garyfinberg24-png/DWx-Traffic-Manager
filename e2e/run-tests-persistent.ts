/**
 * E2E Tests using Playwright with Persistent Context
 *
 * This approach launches Edge with a persistent user profile,
 * allowing MSAL tokens to be reused after manual login.
 *
 * Usage:
 * 1. First run: npx tsx e2e/run-tests-persistent.ts --setup
 *    (This opens browser for manual login)
 * 2. Then run: npx tsx e2e/run-tests-persistent.ts
 *    (Uses saved session to run tests)
 */

import { chromium, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USER_DATA_DIR = path.join(__dirname, '.auth', 'edge-profile');
const isSetup = process.argv.includes('--setup');

async function runTests() {
  console.log('Launching Edge with persistent profile...');

  const context: BrowserContext = await chromium.launchPersistentContext(USER_DATA_DIR, {
    channel: 'msedge',
    headless: false,
    viewport: { width: 1280, height: 720 },
  });

  const page: Page = context.pages()[0] || await context.newPage();

  if (isSetup) {
    // Setup mode: let user log in manually
    console.log('\n========================================');
    console.log('SETUP MODE - Manual Login Required');
    console.log('========================================');
    console.log('1. Navigate to http://localhost:5173');
    console.log('2. Click "Sign in with Microsoft"');
    console.log('3. Complete Windows Hello authentication');
    console.log('4. Once logged in, close the browser');
    console.log('5. Run this script again without --setup');
    console.log('========================================\n');

    await page.goto('http://localhost:5173');

    // Keep browser open for manual login
    await page.waitForTimeout(300000); // 5 minutes
    await context.close();
    return;
  }

  // Test mode: run automated tests
  console.log('Running E2E tests...\n');

  // Navigate to My Bookings
  console.log('📍 Navigating to My Bookings...');
  await page.goto('http://localhost:5173/my-bookings');
  await page.waitForLoadState('networkidle');

  // Check if we're authenticated
  const isLoggedIn = await page.locator('text=My Bookings').isVisible().catch(() => false);
  if (!isLoggedIn) {
    console.error('❌ Not logged in. Run with --setup first to capture login session.');
    await context.close();
    process.exit(1);
  }
  console.log('✅ Authenticated - My Bookings page loaded');

  // Run tests
  let passed = 0;
  let failed = 0;

  // Test CAN-01: Cancel button visible for non-cancelled bookings
  console.log('\n🧪 TEST CAN-01: Cancel button visible for non-cancelled bookings');
  try {
    const bookingCard = page.locator('.fui-Card').first();
    const listRow = page.locator('table tbody tr').first();

    if (await bookingCard.isVisible()) {
      await bookingCard.click();
    } else if (await listRow.isVisible()) {
      await listRow.click();
    } else {
      console.log('   ⚠️ No bookings found - skipping');
    }

    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    const cancelBtn = page.getByRole('button', { name: /cancel booking/i });
    const statusText = await page.locator('text=Booking Cancelled').isVisible();

    if (statusText) {
      console.log('   ℹ️ Booking is already cancelled - cancel button should be hidden');
      const isHidden = !(await cancelBtn.isVisible());
      if (isHidden) {
        console.log('   ✅ PASS - Cancel button correctly hidden for cancelled booking');
        passed++;
      } else {
        console.log('   ❌ FAIL - Cancel button should be hidden for cancelled booking');
        failed++;
      }
    } else {
      const isVisible = await cancelBtn.isVisible();
      if (isVisible) {
        console.log('   ✅ PASS - Cancel button visible for non-cancelled booking');
        passed++;
      } else {
        console.log('   ❌ FAIL - Cancel button should be visible');
        failed++;
      }
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } catch (error) {
    console.log(`   ❌ FAIL - ${error}`);
    failed++;
  }

  // Test CAN-03: Cancel dialog opens with booking details
  console.log('\n🧪 TEST CAN-03: Cancel dialog opens with booking details');
  try {
    const bookingCard = page.locator('.fui-Card').first();
    const listRow = page.locator('table tbody tr').first();

    if (await bookingCard.isVisible()) {
      await bookingCard.click();
    } else if (await listRow.isVisible()) {
      await listRow.click();
    }

    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    const cancelBtn = page.getByRole('button', { name: /cancel booking/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await page.waitForTimeout(500);

      const dialogTitle = await page.locator('text=Cancel Booking').first().isVisible();
      const hasClient = await page.locator('text=Client').isVisible();
      const hasType = await page.locator('text=Type').isVisible();

      if (dialogTitle && hasClient && hasType) {
        console.log('   ✅ PASS - Cancel dialog opened with booking details');
        passed++;
      } else {
        console.log('   ❌ FAIL - Cancel dialog missing expected content');
        failed++;
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('   ⚠️ Skipped - No cancellable booking available');
    }
  } catch (error) {
    console.log(`   ❌ FAIL - ${error}`);
    failed++;
  }

  // Test CAN-05: Reason field required
  console.log('\n🧪 TEST CAN-05: Reason field required');
  try {
    const bookingCard = page.locator('.fui-Card').first();
    const listRow = page.locator('table tbody tr').first();

    if (await bookingCard.isVisible()) {
      await bookingCard.click();
    } else if (await listRow.isVisible()) {
      await listRow.click();
    }

    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    const cancelBtn = page.getByRole('button', { name: /cancel booking/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await page.waitForTimeout(500);

      const submitBtn = page.getByRole('button', { name: /cancel booking/i }).last();
      const isDisabled = await submitBtn.isDisabled();

      if (isDisabled) {
        console.log('   ✅ PASS - Submit button disabled when reason empty');
        passed++;
      } else {
        console.log('   ❌ FAIL - Submit button should be disabled without reason');
        failed++;
      }

      const textarea = page.locator('textarea');
      await textarea.fill('Test reason');
      await page.waitForTimeout(300);

      const isEnabled = await submitBtn.isEnabled();
      if (isEnabled) {
        console.log('   ✅ PASS - Submit button enabled after entering reason');
        passed++;
      } else {
        console.log('   ❌ FAIL - Submit button should be enabled with reason');
        failed++;
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('   ⚠️ Skipped - No cancellable booking available');
    }
  } catch (error) {
    console.log(`   ❌ FAIL - ${error}`);
    failed++;
  }

  // Test DET-01: Modal displays booking info
  console.log('\n🧪 TEST DET-01: Modal displays booking info');
  try {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const bookingCard = page.locator('.fui-Card').first();
    const listRow = page.locator('table tbody tr').first();

    if (await bookingCard.isVisible()) {
      await bookingCard.click();
    } else if (await listRow.isVisible()) {
      await listRow.click();
    }

    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    const hasDetails = await page.locator('text=Booking Details').isVisible();
    const hasLicenses = await page.locator('text=License Count').isVisible();
    const hasAM = await page.locator('text=Account Manager').isVisible();
    const hasSlots = await page.locator('text=Proposed Time Slots').isVisible();

    if (hasDetails && hasLicenses && hasAM && hasSlots) {
      console.log('   ✅ PASS - Modal displays all booking info');
      passed++;
    } else {
      console.log('   ❌ FAIL - Modal missing some fields');
      console.log(`      Details: ${hasDetails}, Licenses: ${hasLicenses}, AM: ${hasAM}, Slots: ${hasSlots}`);
      failed++;
    }

    await page.keyboard.press('Escape');
  } catch (error) {
    console.log(`   ❌ FAIL - ${error}`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  await context.close();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
