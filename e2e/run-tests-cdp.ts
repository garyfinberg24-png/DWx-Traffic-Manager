/**
 * Connect to existing Edge browser and run E2E tests
 *
 * This script connects to an already-authenticated Edge browser via CDP
 * and runs the booking cancellation tests.
 */

import { chromium, Browser, Page } from 'playwright';

async function runTests() {
  console.log('Connecting to Edge browser on port 9222...');

  let browser: Browser;
  try {
    browser = await chromium.connectOverCDP('http://localhost:9222');
    console.log('✅ Connected to Edge browser');
  } catch (error) {
    console.error('❌ Failed to connect. Make sure Edge is running with --remote-debugging-port=9222');
    process.exit(1);
  }

  const contexts = browser.contexts();
  if (contexts.length === 0) {
    console.error('❌ No browser contexts found');
    process.exit(1);
  }

  const context = contexts[0];
  const pages = context.pages();

  let page: Page;
  if (pages.length > 0) {
    page = pages[0];
    console.log(`✅ Using existing page: ${await page.title()}`);
  } else {
    page = await context.newPage();
    console.log('✅ Created new page');
  }

  // Navigate to My Bookings
  console.log('\n📍 Navigating to My Bookings...');
  await page.goto('http://localhost:5173/my-bookings');
  await page.waitForLoadState('networkidle');

  // Check if we're authenticated
  const isLoggedIn = await page.locator('text=My Bookings').isVisible().catch(() => false);
  if (!isLoggedIn) {
    console.error('❌ Not logged in. Please log in manually first.');
    process.exit(1);
  }
  console.log('✅ Authenticated - My Bookings page loaded');

  // Run tests
  let passed = 0;
  let failed = 0;

  // Test CAN-01: Cancel button visible for non-cancelled bookings
  console.log('\n🧪 TEST CAN-01: Cancel button visible for non-cancelled bookings');
  try {
    // Try to click first booking card or list item
    const bookingCard = page.locator('.fui-Card').first();
    const listRow = page.locator('table tbody tr').first();

    if (await bookingCard.isVisible()) {
      await bookingCard.click();
    } else if (await listRow.isVisible()) {
      await listRow.click();
    } else {
      console.log('   ⚠️ No bookings found - skipping');
    }

    // Wait for modal
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Check for cancel button
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

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } catch (error) {
    console.log(`   ❌ FAIL - ${error}`);
    failed++;
  }

  // Test CAN-03: Cancel dialog opens with booking details
  console.log('\n🧪 TEST CAN-03: Cancel dialog opens with booking details');
  try {
    // Click first booking again
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

      // Check cancel dialog opened
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

      // Close dialog
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
    // Click first booking again
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

      // Check submit button is disabled
      const submitBtn = page.getByRole('button', { name: /cancel booking/i }).last();
      const isDisabled = await submitBtn.isDisabled();

      if (isDisabled) {
        console.log('   ✅ PASS - Submit button disabled when reason empty');
        passed++;
      } else {
        console.log('   ❌ FAIL - Submit button should be disabled without reason');
        failed++;
      }

      // Fill reason and check button enables
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

      // Close without submitting
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
    // Close any open dialogs first
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

  // Don't close the browser - keep it open for user
  console.log('\n✅ Tests complete. Browser left open for further inspection.');
}

runTests().catch(console.error);
