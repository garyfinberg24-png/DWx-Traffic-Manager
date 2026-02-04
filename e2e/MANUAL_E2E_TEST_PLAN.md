# LP Demo Scheduler - Complete E2E Test Plan

## Test Environment Setup

**Prerequisites:**
- Dev server running at `http://localhost:5173`
- Valid Microsoft account with access to the tenant
- At least one existing booking in the system
- Browser: Edge or Chrome

**Test Date:** ________________
**Tester:** ________________
**Build Version:** v1.6.0

---

## Test Summary

| Section | Total Tests | Passed | Failed | Skipped |
|---------|-------------|--------|--------|---------|
| Authentication | 4 | | | |
| New Booking | 12 | | | |
| My Bookings | 10 | | | |
| Booking Details | 8 | | | |
| Cancel Booking | 6 | | | |
| Clone Booking | 4 | | | |
| Reschedule | 4 | | | |
| Dashboard | 8 | | | |
| Admin | 6 | | | |
| **TOTAL** | **62** | | | |

---

## Section 1: Authentication (AUTH)

### AUTH-01: Login Page Display
**Steps:**
1. Navigate to `http://localhost:5173`
2. Observe the login page

**Expected Results:**
- [ ] License Pulse logo is displayed
- [ ] "Sign in with Microsoft" button is visible
- [ ] Marketing stats are shown (2,500+ Bookings, 98% Success, etc.)
- [ ] Testimonial section is displayed

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### AUTH-02: Microsoft SSO Login
**Steps:**
1. Click "Sign in with Microsoft"
2. Complete Windows Hello/authentication
3. Wait for redirect

**Expected Results:**
- [ ] Microsoft login popup appears
- [ ] After authentication, redirects to /booking page
- [ ] User name appears in header
- [ ] Navigation menu is accessible

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### AUTH-03: Session Persistence
**Steps:**
1. After logging in, refresh the page (F5)
2. Observe the result

**Expected Results:**
- [ ] User remains logged in
- [ ] No re-authentication required
- [ ] Same page loads correctly

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### AUTH-04: Navigation Access
**Steps:**
1. While logged in, try accessing each navigation item:
   - New Booking
   - My Bookings
   - Dashboard
   - Admin (if visible)

**Expected Results:**
- [ ] All navigation items work
- [ ] Each page loads without errors
- [ ] No unauthorized access errors

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

## Section 2: New Booking (BOOK)

### BOOK-01: Form Display
**Steps:**
1. Navigate to New Booking (/booking)
2. Observe the form

**Expected Results:**
- [ ] Client dropdown is populated with clients
- [ ] Booking Type dropdown shows Demo/Deployment
- [ ] License Count field is visible
- [ ] Three date/time pickers for proposed slots
- [ ] Comments field is present
- [ ] Premium Client checkbox exists
- [ ] Submit button is visible

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### BOOK-02: Client Selection
**Steps:**
1. Click the Client dropdown
2. Search for a client by typing

**Expected Results:**
- [ ] Dropdown shows list of clients
- [ ] Search/filter works
- [ ] Client can be selected
- [ ] Selected client displays in field

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### BOOK-03: Add New Client Inline
**Steps:**
1. Click "Add New Client" button/link (if available)
2. Fill in client details
3. Save the new client

**Expected Results:**
- [ ] Add client dialog opens
- [ ] Can enter client name and details
- [ ] New client appears in dropdown after save
- [ ] Dialog closes automatically

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### BOOK-04: Date/Time Selection
**Steps:**
1. Click on Proposed Slot 1 date picker
2. Select a date and time
3. Repeat for Slot 2 and Slot 3

**Expected Results:**
- [ ] Date picker opens correctly
- [ ] Can select date and time
- [ ] Selected values display in fields
- [ ] Time shows in correct format

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### BOOK-05: Form Validation - Required Fields
**Steps:**
1. Leave all fields empty
2. Click Submit

**Expected Results:**
- [ ] Form does not submit
- [ ] Validation errors appear for required fields
- [ ] Client, Type, License Count show as required

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### BOOK-06: Form Validation - License Count
**Steps:**
1. Enter 0 in License Count
2. Enter -5 in License Count
3. Enter a valid number (e.g., 100)

**Expected Results:**
- [ ] 0 shows validation error
- [ ] Negative numbers show error
- [ ] Valid numbers are accepted

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### BOOK-07: Premium Client Toggle
**Steps:**
1. Check the Premium Client checkbox
2. Uncheck it
3. Observe UI changes

**Expected Results:**
- [ ] Checkbox toggles on/off
- [ ] Premium indicator may show visually
- [ ] Form state updates correctly

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### BOOK-08: Booking Preview
**Steps:**
1. Fill in all required fields
2. Look for preview or review section

**Expected Results:**
- [ ] Booking summary shows before submit
- [ ] All entered data is displayed correctly
- [ ] Can review before final submission

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### BOOK-09: Submit Booking - Success
**Steps:**
1. Fill in all required fields with valid data:
   - Client: Select any client
   - Type: Demo
   - License Count: 50
   - Proposed Slot 1: Tomorrow at 10:00 AM
   - Proposed Slot 2: Tomorrow at 2:00 PM
   - Proposed Slot 3: Day after tomorrow at 10:00 AM
2. Click Submit

**Expected Results:**
- [ ] Loading indicator appears
- [ ] Success message/toast displayed
- [ ] Form resets or redirects to My Bookings
- [ ] No error messages

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### BOOK-10: Verify Booking in SharePoint
**Steps:**
1. After successful submission
2. Check SharePoint list or My Bookings

**Expected Results:**
- [ ] New booking appears in My Bookings
- [ ] Status is "Pending Review"
- [ ] All entered data is saved correctly

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### BOOK-11: Comments Field
**Steps:**
1. Enter text in Comments field (200+ characters)
2. Submit the booking

**Expected Results:**
- [ ] Comments field accepts long text
- [ ] Comments are saved with booking
- [ ] Special characters are handled

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### BOOK-12: Form Reset
**Steps:**
1. Fill in several fields
2. Click Reset/Clear button (if available)

**Expected Results:**
- [ ] All fields are cleared
- [ ] Form returns to initial state
- [ ] No validation errors shown

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

## Section 3: My Bookings (LIST)

### LIST-01: Page Load
**Steps:**
1. Navigate to My Bookings (/my-bookings)
2. Wait for page to load

**Expected Results:**
- [ ] Page title "My Bookings" is displayed
- [ ] Bookings list/cards load
- [ ] Loading indicator shows briefly then disappears
- [ ] No error messages

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### LIST-02: Booking Cards Display
**Steps:**
1. View the bookings list
2. Check a booking card/row

**Expected Results:**
- [ ] Client name is displayed
- [ ] Booking type (Demo/Deployment) shows
- [ ] Status badge is visible and correct
- [ ] Date information is shown
- [ ] Premium indicator (star) shows for premium clients

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### LIST-03: Status Filter
**Steps:**
1. Look for status filter dropdown
2. Filter by "Pending Review"
3. Filter by "Confirmed"
4. Filter by "Cancelled"

**Expected Results:**
- [ ] Filter dropdown exists
- [ ] Filtering updates the list
- [ ] Correct bookings show for each status
- [ ] Count updates to match filtered results

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### LIST-04: Date Filter
**Steps:**
1. Look for date range filter
2. Set a date range
3. Apply filter

**Expected Results:**
- [ ] Date picker(s) available
- [ ] Can select start and end dates
- [ ] List updates based on date range
- [ ] Only bookings within range show

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### LIST-05: Search Functionality
**Steps:**
1. Look for search box
2. Type a client name
3. Observe results

**Expected Results:**
- [ ] Search box exists
- [ ] Results filter as you type
- [ ] Matching bookings displayed
- [ ] Clear search shows all bookings again

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### LIST-06: View Toggle (Card/List)
**Steps:**
1. Look for view toggle buttons
2. Switch between Card and List view

**Expected Results:**
- [ ] Toggle buttons exist
- [ ] Card view shows cards layout
- [ ] List view shows table layout
- [ ] Data remains the same in both views

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### LIST-07: Pagination/Infinite Scroll
**Steps:**
1. If more than 10-20 bookings exist
2. Scroll down or look for pagination

**Expected Results:**
- [ ] More bookings load on scroll OR
- [ ] Pagination controls exist and work
- [ ] All bookings are accessible

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### LIST-08: Empty State
**Steps:**
1. Filter to show no results (e.g., future date range)
2. Observe the page

**Expected Results:**
- [ ] Empty state message displayed
- [ ] Helpful text like "No bookings found"
- [ ] No errors or broken UI

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### LIST-09: Refresh Data
**Steps:**
1. Look for refresh button
2. Click refresh
3. Or manually refresh the page

**Expected Results:**
- [ ] Data reloads
- [ ] Loading indicator shows
- [ ] Latest bookings are displayed

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### LIST-10: Export Functionality
**Steps:**
1. Look for Export button
2. Click to export data

**Expected Results:**
- [ ] Export option exists
- [ ] Downloads file (Excel/CSV)
- [ ] File contains booking data
- [ ] All columns are included

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

## Section 4: Booking Details Modal (DET)

### DET-01: Open Details Modal
**Steps:**
1. From My Bookings, click on a booking card
2. Wait for modal to open

**Expected Results:**
- [ ] Modal opens smoothly
- [ ] "Booking Details" title visible
- [ ] Close button (X) is visible
- [ ] Modal has proper overlay/backdrop

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### DET-02: Header Information
**Steps:**
1. With modal open, check the header

**Expected Results:**
- [ ] Client name is displayed prominently
- [ ] Booking type badge shows (Demo/Deployment)
- [ ] Premium star shows if applicable
- [ ] Header has colored background

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### DET-03: Status Banner
**Steps:**
1. Check the status banner in the modal

**Expected Results:**
- [ ] Status icon with correct color
- [ ] Status text (Confirmed, Pending, etc.)
- [ ] Status description text
- [ ] Banner color matches status

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### DET-04: Booking Details Section
**Steps:**
1. Scroll through the modal body
2. Check each field

**Expected Results:**
- [ ] License Count displayed
- [ ] Account Manager name shown
- [ ] Account Manager email shown
- [ ] Comments (if any) displayed

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### DET-05: Proposed Time Slots
**Steps:**
1. Find the time slots section

**Expected Results:**
- [ ] All three proposed slots displayed
- [ ] Date and time formatted correctly
- [ ] Confirmed slot highlighted (if applicable)

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### DET-06: Action Buttons
**Steps:**
1. Check the modal footer for buttons

**Expected Results:**
- [ ] Clone button visible
- [ ] Reschedule button visible (for non-cancelled)
- [ ] Cancel Booking button visible (for non-cancelled)
- [ ] Save as Template option exists
- [ ] Client History option exists

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### DET-07: Close Modal - X Button
**Steps:**
1. Click the X button in modal header

**Expected Results:**
- [ ] Modal closes
- [ ] Returns to My Bookings list
- [ ] No data is lost

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### DET-08: Close Modal - Escape Key
**Steps:**
1. Open a booking modal
2. Press Escape key

**Expected Results:**
- [ ] Modal closes
- [ ] Returns to My Bookings list

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

## Section 5: Cancel Booking (CAN)

### CAN-01: Cancel Button Visibility - Active Booking
**Steps:**
1. Open details for a non-cancelled booking
2. Check for Cancel Booking button

**Expected Results:**
- [ ] Cancel Booking button is visible
- [ ] Button is in the footer area
- [ ] Button has warning/red styling

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### CAN-02: Cancel Button Hidden - Cancelled Booking
**Steps:**
1. Open details for an already cancelled booking
2. Check for Cancel Booking button

**Expected Results:**
- [ ] Cancel Booking button is NOT visible
- [ ] Status shows as "Cancelled"
- [ ] Reschedule button also hidden

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### CAN-03: Cancel Dialog Opens
**Steps:**
1. From a non-cancelled booking, click Cancel Booking
2. Wait for dialog

**Expected Results:**
- [ ] Cancel dialog opens
- [ ] Title says "Cancel Booking"
- [ ] Booking summary displayed (Client, Type, etc.)
- [ ] Reason textarea is shown
- [ ] Submit button is present

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### CAN-04: Warning for Confirmed Bookings
**Steps:**
1. Open a CONFIRMED booking
2. Click Cancel Booking

**Expected Results:**
- [ ] Warning banner shows
- [ ] Mentions calendar event will be affected
- [ ] Extra confirmation may be required

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### CAN-05: Reason Required Validation
**Steps:**
1. In cancel dialog, leave reason empty
2. Try to click Submit/Confirm

**Expected Results:**
- [ ] Submit button is DISABLED
- [ ] Cannot submit without reason
- [ ] Visual indication that reason is required

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### CAN-06: Submit Cancellation
**Steps:**
1. Enter a cancellation reason (e.g., "Client requested postponement")
2. Click Submit/Confirm Cancel

**Expected Results:**
- [ ] Loading indicator shows
- [ ] Success message appears
- [ ] Dialog closes
- [ ] Booking status updates to "Cancelled"
- [ ] Booking list reflects the change

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

## Section 6: Clone Booking (CLN)

### CLN-01: Clone Dialog Opens
**Steps:**
1. Open a booking's details
2. Click Clone button

**Expected Results:**
- [ ] Clone dialog opens
- [ ] Shows "Clone Booking" title
- [ ] Pre-filled with original booking data
- [ ] Date fields are editable

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### CLN-02: Modify Clone Data
**Steps:**
1. In clone dialog, change some values:
   - Update license count
   - Change proposed dates

**Expected Results:**
- [ ] Fields are editable
- [ ] Changes are reflected
- [ ] Validation still applies

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### CLN-03: Submit Clone
**Steps:**
1. Make any desired changes
2. Click Create Clone / Submit

**Expected Results:**
- [ ] Loading indicator shows
- [ ] Success message appears
- [ ] New booking created
- [ ] Original booking unchanged

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### CLN-04: Cancel Clone
**Steps:**
1. Open clone dialog
2. Click Cancel / Close

**Expected Results:**
- [ ] Dialog closes
- [ ] No new booking created
- [ ] Returns to details modal or list

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

## Section 7: Reschedule Booking (RES)

### RES-01: Reschedule Dialog Opens
**Steps:**
1. Open a non-cancelled booking
2. Click Reschedule / Request Reschedule

**Expected Results:**
- [ ] Reschedule dialog opens
- [ ] Shows current booking info
- [ ] Has fields for new proposed dates
- [ ] Reason field may be present

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### RES-02: Enter New Dates
**Steps:**
1. In reschedule dialog
2. Enter new proposed time slots

**Expected Results:**
- [ ] Date pickers work correctly
- [ ] Can select new dates/times
- [ ] Validation prevents past dates

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### RES-03: Submit Reschedule
**Steps:**
1. Enter new valid dates
2. Click Submit / Request

**Expected Results:**
- [ ] Loading indicator shows
- [ ] Success message appears
- [ ] Booking status changes (may become "Rescheduling Required")
- [ ] New dates are saved

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### RES-04: Reschedule Hidden for Cancelled
**Steps:**
1. Open a cancelled booking
2. Check for Reschedule button

**Expected Results:**
- [ ] Reschedule button is NOT visible
- [ ] Cannot reschedule cancelled bookings

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

## Section 8: Dashboard (DASH)

### DASH-01: Dashboard Load
**Steps:**
1. Navigate to Dashboard (/dashboard)
2. Wait for page to load

**Expected Results:**
- [ ] Dashboard page loads
- [ ] KPI cards are displayed
- [ ] Charts are visible
- [ ] No error messages

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### DASH-02: KPI Cards
**Steps:**
1. Check the KPI cards at top of dashboard

**Expected Results:**
- [ ] Total Bookings count displayed
- [ ] Pending count shown
- [ ] Confirmed count shown
- [ ] Numbers match actual data

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### DASH-03: Status Chart
**Steps:**
1. Find the status distribution chart
2. Check the data

**Expected Results:**
- [ ] Pie/donut chart shows status breakdown
- [ ] Legend shows all statuses
- [ ] Percentages/counts are visible
- [ ] Chart is interactive (hover shows details)

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### DASH-04: Booking Type Chart
**Steps:**
1. Find the booking type chart

**Expected Results:**
- [ ] Chart shows Demo vs Deployment breakdown
- [ ] Numbers are accurate
- [ ] Chart renders correctly

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### DASH-05: Trends Chart
**Steps:**
1. Find the trends/timeline chart

**Expected Results:**
- [ ] Shows bookings over time
- [ ] X-axis shows dates
- [ ] Y-axis shows counts
- [ ] Trend line is visible

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### DASH-06: Calendar View
**Steps:**
1. Click on Calendar tab/view
2. Navigate through months

**Expected Results:**
- [ ] Calendar renders correctly
- [ ] Bookings appear on correct dates
- [ ] Can navigate between months
- [ ] Clicking a booking shows details

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### DASH-07: Timeline View
**Steps:**
1. Click on Timeline tab/view
2. Scroll through timeline

**Expected Results:**
- [ ] Chronological list of bookings
- [ ] Grouped by date
- [ ] Shows "Today", "Tomorrow" labels
- [ ] Status badges visible

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### DASH-08: Approval Queue (Manager)
**Steps:**
1. If you have manager access, check Approval Queue
2. Find a pending booking

**Expected Results:**
- [ ] Pending bookings listed
- [ ] Can Approve button available
- [ ] Can Reject button available
- [ ] Conflict indicators show slot availability

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

## Section 9: Admin Functions (ADM)

### ADM-01: Admin Page Access
**Steps:**
1. Navigate to Admin section (if accessible)
2. Check available tabs

**Expected Results:**
- [ ] Admin page loads
- [ ] Multiple tabs visible (Team, Clients, etc.)
- [ ] Only visible to authorized users

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### ADM-02: Account Manager List
**Steps:**
1. Go to Account Managers tab
2. View the list

**Expected Results:**
- [ ] List of account managers displayed
- [ ] Name, email, region shown
- [ ] Status (Active/Inactive) visible
- [ ] Add new AM button available

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### ADM-03: Add Account Manager
**Steps:**
1. Click Add Account Manager
2. Search for a user
3. Fill details and save

**Expected Results:**
- [ ] Entra ID picker opens
- [ ] Can search users
- [ ] Can select user
- [ ] New AM appears in list

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### ADM-04: Client Management
**Steps:**
1. Go to Clients tab
2. View client list

**Expected Results:**
- [ ] Clients are listed
- [ ] Can search/filter
- [ ] Edit/delete options available
- [ ] Contract status visible

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### ADM-05: Edit Client
**Steps:**
1. Click Edit on a client
2. Change some details
3. Save

**Expected Results:**
- [ ] Edit dialog opens
- [ ] Fields are pre-filled
- [ ] Can modify and save
- [ ] Changes persist

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

### ADM-06: SharePoint Provisioning
**Steps:**
1. If available, check provisioning section
2. Review list configurations

**Expected Results:**
- [ ] Shows SharePoint list status
- [ ] Column configurations visible
- [ ] Provisioning options available

**Status:** ☐ Pass ☐ Fail ☐ Skip

---

## Sign-Off

### Test Execution Summary

**Total Tests:** 62
**Passed:** _____
**Failed:** _____
**Skipped:** _____

**Pass Rate:** _____%

### Critical Issues Found
| Issue # | Test ID | Description | Severity |
|---------|---------|-------------|----------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

### Recommendations
_____________________________________________
_____________________________________________
_____________________________________________

### Sign-Off

**Tested By:** _________________________ **Date:** _____________

**Reviewed By:** _________________________ **Date:** _____________

**Production Ready:** ☐ Yes ☐ No ☐ Conditional

**Notes:**
_____________________________________________
_____________________________________________
