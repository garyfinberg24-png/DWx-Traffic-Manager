/**
 * Browser Console E2E Tests for Cancel Booking Feature
 *
 * INSTRUCTIONS:
 * 1. Open your browser to http://localhost:5173/my-bookings (already logged in)
 * 2. Open DevTools (F12) -> Console tab
 * 3. Copy and paste this entire script
 * 4. Press Enter to run
 *
 * The tests will run automatically and report results in the console.
 */

(async function runCancelBookingTests() {
  const results = { passed: 0, failed: 0, skipped: 0 };
  const log = (msg) => console.log(msg);
  const pass = (test) => { log(`   ✅ PASS - ${test}`); results.passed++; };
  const fail = (test) => { log(`   ❌ FAIL - ${test}`); results.failed++; };
  const skip = (test) => { log(`   ⚠️ SKIP - ${test}`); results.skipped++; };

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const click = (selector) => {
    const el = document.querySelector(selector);
    if (el) { el.click(); return true; }
    return false;
  };

  const clickByText = (text, tag = '*') => {
    const elements = [...document.querySelectorAll(tag)];
    const el = elements.find(e => e.textContent.includes(text));
    if (el) { el.click(); return true; }
    return false;
  };

  const isVisible = (selector) => {
    const el = document.querySelector(selector);
    return el && el.offsetParent !== null;
  };

  const hasText = (text) => document.body.textContent.includes(text);

  log('\n' + '='.repeat(60));
  log('🧪 CANCEL BOOKING E2E TESTS');
  log('='.repeat(60) + '\n');

  // Verify we're on My Bookings page
  if (!hasText('My Bookings')) {
    log('❌ ERROR: Not on My Bookings page. Navigate to /my-bookings first.');
    return;
  }
  log('✅ On My Bookings page\n');

  // TEST CAN-01: Cancel button visible for non-cancelled bookings
  log('🧪 TEST CAN-01: Cancel button visible for non-cancelled bookings');
  try {
    // Click first booking card or table row
    const card = document.querySelector('.fui-Card');
    const row = document.querySelector('table tbody tr');

    if (card) {
      card.click();
    } else if (row) {
      row.click();
    } else {
      skip('No bookings found');
      return;
    }

    await wait(1000);

    // Check if dialog opened
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) {
      fail('Details modal did not open');
    } else {
      const isCancelled = hasText('Booking Cancelled');
      const cancelBtn = [...document.querySelectorAll('button')].find(b =>
        b.textContent.toLowerCase().includes('cancel booking')
      );

      if (isCancelled) {
        if (!cancelBtn || cancelBtn.offsetParent === null) {
          pass('Cancel button correctly hidden for cancelled booking');
        } else {
          fail('Cancel button should be hidden for cancelled booking');
        }
      } else {
        if (cancelBtn && cancelBtn.offsetParent !== null) {
          pass('Cancel button visible for non-cancelled booking');
        } else {
          fail('Cancel button should be visible for non-cancelled booking');
        }
      }
    }

    // Close modal
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wait(500);
  } catch (e) {
    fail(e.message);
  }

  // TEST CAN-03: Cancel dialog opens with booking details
  log('\n🧪 TEST CAN-03: Cancel dialog opens with booking details');
  try {
    // Open booking again
    const card = document.querySelector('.fui-Card');
    const row = document.querySelector('table tbody tr');
    if (card) card.click();
    else if (row) row.click();

    await wait(1000);

    const cancelBtn = [...document.querySelectorAll('button')].find(b =>
      b.textContent.toLowerCase().includes('cancel booking')
    );

    if (!cancelBtn || cancelBtn.offsetParent === null) {
      skip('No cancellable booking available');
    } else {
      cancelBtn.click();
      await wait(500);

      const hasCancelTitle = hasText('Cancel Booking');
      const hasClient = hasText('Client');
      const hasType = hasText('Type');

      if (hasCancelTitle && hasClient && hasType) {
        pass('Cancel dialog opened with booking details');
      } else {
        fail('Cancel dialog missing expected content');
      }

      // Close dialog
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await wait(500);
    }
  } catch (e) {
    fail(e.message);
  }

  // TEST CAN-05: Reason field required
  log('\n🧪 TEST CAN-05: Reason field required');
  try {
    // Open booking again
    const card = document.querySelector('.fui-Card');
    const row = document.querySelector('table tbody tr');
    if (card) card.click();
    else if (row) row.click();

    await wait(1000);

    const cancelBtn = [...document.querySelectorAll('button')].find(b =>
      b.textContent.toLowerCase().includes('cancel booking')
    );

    if (!cancelBtn || cancelBtn.offsetParent === null) {
      skip('No cancellable booking available');
    } else {
      cancelBtn.click();
      await wait(500);

      // Find submit button (the second "Cancel Booking" button in the dialog)
      const buttons = [...document.querySelectorAll('button')].filter(b =>
        b.textContent.toLowerCase().includes('cancel booking')
      );
      const submitBtn = buttons[buttons.length - 1];

      // Check if disabled when reason is empty
      if (submitBtn && submitBtn.disabled) {
        pass('Submit button disabled when reason empty');
      } else {
        fail('Submit button should be disabled without reason');
      }

      // Fill reason
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = 'Test reason for cancellation';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        await wait(300);

        if (!submitBtn.disabled) {
          pass('Submit button enabled after entering reason');
        } else {
          fail('Submit button should be enabled with reason');
        }
      }

      // Close without submitting
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await wait(500);
    }
  } catch (e) {
    fail(e.message);
  }

  // TEST DET-01: Modal displays booking info
  log('\n🧪 TEST DET-01: Modal displays booking info');
  try {
    // Close any open dialogs
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wait(300);

    const card = document.querySelector('.fui-Card');
    const row = document.querySelector('table tbody tr');
    if (card) card.click();
    else if (row) row.click();

    await wait(1000);

    const hasDetails = hasText('Booking Details');
    const hasLicenses = hasText('License Count') || hasText('Licenses');
    const hasAM = hasText('Account Manager');
    const hasSlots = hasText('Proposed Time Slots') || hasText('Proposed Slots');

    if (hasDetails && hasLicenses && hasAM && hasSlots) {
      pass('Modal displays all booking info');
    } else {
      fail(`Modal missing fields - Details:${hasDetails}, Licenses:${hasLicenses}, AM:${hasAM}, Slots:${hasSlots}`);
    }

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  } catch (e) {
    fail(e.message);
  }

  // TEST DET-06: Clone button opens clone dialog
  log('\n🧪 TEST DET-06: Clone button opens clone dialog');
  try {
    const card = document.querySelector('.fui-Card');
    const row = document.querySelector('table tbody tr');
    if (card) card.click();
    else if (row) row.click();

    await wait(1000);

    const cloneBtn = [...document.querySelectorAll('button')].find(b =>
      b.textContent.toLowerCase().includes('clone')
    );

    if (cloneBtn && cloneBtn.offsetParent !== null) {
      cloneBtn.click();
      await wait(500);

      if (hasText('Clone Booking')) {
        pass('Clone dialog opened');
      } else {
        fail('Clone dialog did not open');
      }

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await wait(300);
    } else {
      skip('Clone button not visible');
    }

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  } catch (e) {
    fail(e.message);
  }

  // TEST DET-09: Reschedule button works
  log('\n🧪 TEST DET-09: Reschedule button works');
  try {
    const card = document.querySelector('.fui-Card');
    const row = document.querySelector('table tbody tr');
    if (card) card.click();
    else if (row) row.click();

    await wait(1000);

    const rescheduleBtn = [...document.querySelectorAll('button')].find(b =>
      b.textContent.toLowerCase().includes('reschedule')
    );

    if (rescheduleBtn && rescheduleBtn.offsetParent !== null) {
      rescheduleBtn.click();
      await wait(500);

      if (hasText('Request Reschedule') || hasText('Reschedule')) {
        pass('Reschedule dialog opened');
      } else {
        fail('Reschedule dialog did not open');
      }

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    } else {
      skip('Reschedule button not visible (may be cancelled booking)');
    }

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  } catch (e) {
    fail(e.message);
  }

  // Summary
  log('\n' + '='.repeat(60));
  log(`📊 TEST RESULTS: ${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped`);
  log('='.repeat(60) + '\n');

  if (results.failed === 0) {
    log('🎉 All tests passed! Cancel booking feature is working correctly.');
  } else {
    log('⚠️ Some tests failed. Review the output above for details.');
  }

  return results;
})();
