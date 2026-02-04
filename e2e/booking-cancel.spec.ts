/**
 * E2E Tests for Booking Cancellation Feature
 *
 * Prerequisites:
 * 1. Run auth-setup.ts first to capture login session
 * 2. Dev server running at localhost:5173
 * 3. At least one non-cancelled booking exists for your user
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use saved auth state
test.use({
  storageState: path.join(__dirname, '.auth', 'session.json'),
});

test.describe('Booking Cancellation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to My Bookings page
    await page.goto('http://localhost:5173/my-bookings');

    // Wait for bookings to load
    await expect(page.locator('text=My Bookings')).toBeVisible();
    await page.waitForLoadState('networkidle');
  });

  test('CAN-01: Cancel button visible for non-cancelled bookings', async ({ page }) => {
    // Find a booking card that is NOT cancelled
    const bookingCard = page.locator('[data-testid="booking-card"]').first();

    // If no booking cards, check if there are any bookings
    const hasBookings = await bookingCard.isVisible().catch(() => false);
    if (!hasBookings) {
      // Try clicking on a list item instead
      const listItem = page.locator('table tbody tr').first();
      if (await listItem.isVisible()) {
        await listItem.click();
      } else {
        test.skip(true, 'No bookings available to test');
        return;
      }
    } else {
      await bookingCard.click();
    }

    // Wait for details modal to open
    await expect(page.locator('role=dialog')).toBeVisible();

    // Check if Cancel button is visible (should be for non-cancelled bookings)
    const cancelButton = page.getByRole('button', { name: /cancel booking/i });
    const statusText = await page.locator('text=Booking Cancelled').isVisible();

    if (statusText) {
      // If booking is cancelled, cancel button should NOT be visible
      await expect(cancelButton).not.toBeVisible();
    } else {
      // If booking is not cancelled, cancel button SHOULD be visible
      await expect(cancelButton).toBeVisible();
    }
  });

  test('CAN-02: Cancel button hidden for cancelled bookings', async ({ page }) => {
    // Filter to show only cancelled bookings
    const statusFilter = page.locator('select[name="status"]').or(page.getByLabel(/status/i));
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('Cancelled');
      await page.waitForLoadState('networkidle');
    }

    // Find a cancelled booking
    const cancelledBadge = page.locator('text=Cancelled').first();
    if (!(await cancelledBadge.isVisible().catch(() => false))) {
      test.skip(true, 'No cancelled bookings to test');
      return;
    }

    // Click on a cancelled booking
    await cancelledBadge.click();

    // Wait for modal
    await expect(page.locator('role=dialog')).toBeVisible();

    // Cancel button should NOT be visible
    await expect(page.getByRole('button', { name: /cancel booking/i })).not.toBeVisible();
  });

  test('CAN-03: Cancel dialog opens with booking details', async ({ page }) => {
    // Click first non-cancelled booking
    const bookingCard = page.locator('[data-testid="booking-card"]').first();
    const listItem = page.locator('table tbody tr').first();

    if (await bookingCard.isVisible()) {
      await bookingCard.click();
    } else if (await listItem.isVisible()) {
      await listItem.click();
    } else {
      test.skip(true, 'No bookings available');
      return;
    }

    await expect(page.locator('role=dialog')).toBeVisible();

    const cancelButton = page.getByRole('button', { name: /cancel booking/i });
    if (!(await cancelButton.isVisible())) {
      test.skip(true, 'Booking already cancelled');
      return;
    }

    // Click Cancel Booking button
    await cancelButton.click();

    // Cancel dialog should open
    await expect(page.locator('text=Cancel Booking').first()).toBeVisible();

    // Should show booking info
    await expect(page.locator('text=Client')).toBeVisible();
    await expect(page.locator('text=Type')).toBeVisible();
    await expect(page.locator('text=Licenses')).toBeVisible();
  });

  test('CAN-04: Warning shown for confirmed bookings', async ({ page }) => {
    // Filter to confirmed bookings
    const statusFilter = page.locator('select[name="status"]').or(page.getByLabel(/status/i));
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('Confirmed');
      await page.waitForLoadState('networkidle');
    }

    // Find and click a confirmed booking
    const confirmedBadge = page.locator('text=Confirmed').first();
    if (!(await confirmedBadge.isVisible().catch(() => false))) {
      test.skip(true, 'No confirmed bookings to test');
      return;
    }

    await confirmedBadge.click();
    await expect(page.locator('role=dialog')).toBeVisible();

    const cancelButton = page.getByRole('button', { name: /cancel booking/i });
    await cancelButton.click();

    // Should show warning for confirmed booking
    await expect(page.locator('text=Confirmed Booking')).toBeVisible();
    await expect(page.locator('text=calendar event')).toBeVisible();
  });

  test('CAN-05: Reason field required', async ({ page }) => {
    // Open first booking
    const bookingCard = page.locator('[data-testid="booking-card"]').first();
    const listItem = page.locator('table tbody tr').first();

    if (await bookingCard.isVisible()) {
      await bookingCard.click();
    } else if (await listItem.isVisible()) {
      await listItem.click();
    } else {
      test.skip(true, 'No bookings available');
      return;
    }

    await expect(page.locator('role=dialog')).toBeVisible();

    const cancelButton = page.getByRole('button', { name: /cancel booking/i });
    if (!(await cancelButton.isVisible())) {
      test.skip(true, 'Booking already cancelled');
      return;
    }

    await cancelButton.click();
    await expect(page.locator('text=Cancel Booking').first()).toBeVisible();

    // Try to submit without reason
    const submitButton = page.getByRole('button', { name: /cancel booking/i }).last();

    // Button should be disabled when reason is empty
    await expect(submitButton).toBeDisabled();

    // Enter a reason
    const reasonField = page.locator('textarea');
    await reasonField.fill('Test cancellation reason');

    // Now button should be enabled
    await expect(submitButton).toBeEnabled();
  });

  test('CAN-06: Submit cancellation updates status', async ({ page }) => {
    // This test actually cancels a booking - use with caution!
    test.skip(true, 'Skipping destructive test - run manually when needed');

    // Open first booking
    const bookingCard = page.locator('[data-testid="booking-card"]').first();
    await bookingCard.click();
    await expect(page.locator('role=dialog')).toBeVisible();

    // Click Cancel Booking
    await page.getByRole('button', { name: /cancel booking/i }).click();

    // Fill reason and submit
    await page.locator('textarea').fill('E2E Test - Cancellation test');
    await page.getByRole('button', { name: /cancel booking/i }).last().click();

    // Wait for success toast
    await expect(page.locator('text=Booking Cancelled')).toBeVisible({ timeout: 10000 });

    // Verify booking status changed
    await page.reload();
    // The booking should now show as Cancelled
  });
});

test.describe('Booking Details Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/my-bookings');
    await expect(page.locator('text=My Bookings')).toBeVisible();
    await page.waitForLoadState('networkidle');
  });

  test('DET-01: Modal displays booking info', async ({ page }) => {
    // Click first booking
    const bookingCard = page.locator('[data-testid="booking-card"]').first();
    const listItem = page.locator('table tbody tr').first();

    if (await bookingCard.isVisible()) {
      await bookingCard.click();
    } else if (await listItem.isVisible()) {
      await listItem.click();
    } else {
      test.skip(true, 'No bookings available');
      return;
    }

    // Modal should be visible
    await expect(page.locator('role=dialog')).toBeVisible();

    // Check for key fields
    await expect(page.locator('text=Booking Details')).toBeVisible();
    await expect(page.locator('text=License Count')).toBeVisible();
    await expect(page.locator('text=Account Manager')).toBeVisible();
    await expect(page.locator('text=Proposed Time Slots')).toBeVisible();
  });

  test('DET-06: Clone button opens clone dialog', async ({ page }) => {
    const bookingCard = page.locator('[data-testid="booking-card"]').first();
    const listItem = page.locator('table tbody tr').first();

    if (await bookingCard.isVisible()) {
      await bookingCard.click();
    } else if (await listItem.isVisible()) {
      await listItem.click();
    } else {
      test.skip(true, 'No bookings available');
      return;
    }

    await expect(page.locator('role=dialog')).toBeVisible();

    // Click Clone button
    const cloneButton = page.getByRole('button', { name: /clone/i });
    if (await cloneButton.isVisible()) {
      await cloneButton.click();
      await expect(page.locator('text=Clone Booking')).toBeVisible();
    }
  });

  test('DET-09: Reschedule button works', async ({ page }) => {
    const bookingCard = page.locator('[data-testid="booking-card"]').first();
    const listItem = page.locator('table tbody tr').first();

    if (await bookingCard.isVisible()) {
      await bookingCard.click();
    } else if (await listItem.isVisible()) {
      await listItem.click();
    } else {
      test.skip(true, 'No bookings available');
      return;
    }

    await expect(page.locator('role=dialog')).toBeVisible();

    // Click Reschedule button (if visible - not shown for cancelled bookings)
    const rescheduleButton = page.getByRole('button', { name: /request reschedule/i });
    if (await rescheduleButton.isVisible()) {
      await rescheduleButton.click();
      await expect(page.locator('text=Request Reschedule')).toBeVisible();
    }
  });
});
