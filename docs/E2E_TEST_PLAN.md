# LP Demo Scheduler - End-to-End Test Plan

## Overview
This document outlines the comprehensive testing approach to ensure the LP Demo Scheduler is production-ready with zero defects.

## Test Environment
- **App URL**: http://localhost:5173 (dev) or deployed URL
- **SharePoint Site**: https://hallofd.sharepoint.com/sites/LicensePulseDemoScheduler
- **Shared Calendar**: lpbookings@firsttech.digital
- **Test User**: Account Manager with appropriate permissions

---

## Test Categories

### 1. Authentication & Authorization

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| AUTH-01 | App loads login page when not authenticated | Login page displays with Microsoft SSO button | |
| AUTH-02 | User can sign in with Microsoft account | Redirects to app after successful auth | |
| AUTH-03 | User info displays correctly in header | Shows user name and avatar | |
| AUTH-04 | User can sign out | Returns to login page, clears session | |
| AUTH-05 | Token refresh works silently | App continues working without re-login | |

### 2. Booking Creation

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| BOOK-01 | Navigate to booking form | Form displays with all fields | |
| BOOK-02 | Client dropdown loads clients | Shows list of active clients | |
| BOOK-03 | Add new client inline | Dialog opens, creates client, appears in dropdown | |
| BOOK-04 | Select booking type (Demo/Deployment) | Type selection works, affects duration | |
| BOOK-05 | Enter license count | Accepts numeric input, validates range | |
| BOOK-06 | Select 3 proposed time slots | Date/time pickers work correctly | |
| BOOK-07 | Mark as premium client | Checkbox toggles correctly | |
| BOOK-08 | Add comments | Text area accepts input | |
| BOOK-09 | Preview booking before submit | Preview dialog shows all details | |
| BOOK-10 | Submit booking | Creates in SharePoint, shows success toast | |
| BOOK-11 | Duplicate booking prevention | Warns if similar booking exists | |

### 3. My Bookings View

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| VIEW-01 | My Bookings page loads | Shows user's bookings | |
| VIEW-02 | Cards view displays correctly | Booking cards with status badges | |
| VIEW-03 | List view displays correctly | Table format with all columns | |
| VIEW-04 | Toggle between card/list views | Switches views correctly | |
| VIEW-05 | Filter by status | Shows only matching bookings | |
| VIEW-06 | Filter by booking type | Shows only Demo or Deployment | |
| VIEW-07 | Filter by date range | Shows bookings in date range | |
| VIEW-08 | Search by client name | Filters results correctly | |
| VIEW-09 | Refresh button works | Reloads booking data | |
| VIEW-10 | Click booking opens details | Modal shows full booking info | |

### 4. Booking Details Modal

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| DET-01 | Modal displays booking info | All fields shown correctly | |
| DET-02 | Status badge shows correct color | Matches booking status | |
| DET-03 | Premium badge shows for premium | Star icon visible | |
| DET-04 | Proposed slots formatted correctly | Shows all 3 time options | |
| DET-05 | Confirmed date shows if set | Displays confirmed time | |
| DET-06 | Clone button opens clone dialog | Pre-fills form with booking data | |
| DET-07 | Save as Template works | Creates template in storage | |
| DET-08 | View Client History works | Shows past bookings for client | |
| DET-09 | Reschedule button works | Opens reschedule dialog | |
| DET-10 | Cancel button works | Opens cancel dialog | |

### 5. Booking Cancellation (New Feature)

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| CAN-01 | Cancel button visible for non-cancelled | Button shows in footer | |
| CAN-02 | Cancel button hidden for cancelled | Not shown for cancelled bookings | |
| CAN-03 | Cancel dialog opens | Shows booking summary | |
| CAN-04 | Warning shown for confirmed bookings | Yellow warning message | |
| CAN-05 | Reason field required | Cannot submit without reason | |
| CAN-06 | Submit cancellation | Updates status to Cancelled | |
| CAN-07 | Calendar event deleted | Removed from shared calendar | |
| CAN-08 | Notification sent to managers | Email received | |
| CAN-09 | Booking list refreshes | Shows updated status | |
| CAN-10 | Audit log created | Cancellation logged | |

### 6. Booking Reschedule

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| RES-01 | Reschedule dialog opens | Shows current booking info | |
| RES-02 | Select 3 new time slots | Date/time pickers work | |
| RES-03 | Add reschedule reason | Text field accepts input | |
| RES-04 | Submit reschedule request | Updates status to Rescheduling Required | |
| RES-05 | Old calendar event updated | Shows pending reschedule | |
| RES-06 | Manager notified | Email sent about reschedule | |

### 7. Manager Dashboard

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| DASH-01 | Dashboard loads | Shows KPIs, charts, tables | |
| DASH-02 | KPI cards show correct counts | Matches actual data | |
| DASH-03 | Status chart renders | Pie chart with status breakdown | |
| DASH-04 | Booking type chart renders | Shows Demo vs Deployment | |
| DASH-05 | Trends chart shows data | Line chart with booking trends | |
| DASH-06 | AM performance table loads | Shows account managers | |
| DASH-07 | Calendar view works | Monthly/weekly/daily views | |
| DASH-08 | Timeline view works | Chronological booking list | |
| DASH-09 | Filters apply to dashboard | Data updates based on filters | |

### 8. Approval Queue (Manager)

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| APR-01 | Approval queue shows pending | Lists Pending Review bookings | |
| APR-02 | Click Approve opens dialog | Shows time slot options | |
| APR-03 | Conflict detection runs | Checks calendar availability | |
| APR-04 | Available slots show green badge | "Available" indicator | |
| APR-05 | Conflicting slots show red badge | "Conflict" with event details | |
| APR-06 | Select slot and approve | Updates status to Confirmed | |
| APR-07 | Calendar event created | Added to shared calendar | |
| APR-08 | AM added as attendee | Receives meeting invite | |
| APR-09 | Notification sent | Confirmation email to AM | |
| APR-10 | Reject booking works | Updates status to Cancelled | |
| APR-11 | Rejection reason required | Must provide reason | |
| APR-12 | Rejection notification sent | AM receives rejection email | |

### 9. Calendar Integration

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| CAL-01 | Events created on shared mailbox | lpbookings@firsttech.digital calendar | |
| CAL-02 | Event subject formatted correctly | Client - Type format | |
| CAL-03 | Event body contains details | Full booking information | |
| CAL-04 | AM added as required attendee | Receives calendar invite | |
| CAL-05 | Event duration correct | 1hr Demo, 2hr Deployment | |
| CAL-06 | Event updates on reschedule | Time changed correctly | |
| CAL-07 | Event deleted on cancel | Removed from calendar | |

### 10. Email Notifications

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| EMAIL-01 | Booking created notification | Email to managers | |
| EMAIL-02 | Booking approved notification | Email to AM | |
| EMAIL-03 | Booking rejected notification | Email to AM with reason | |
| EMAIL-04 | Booking cancelled notification | Email to managers | |
| EMAIL-05 | Reschedule request notification | Email to managers | |
| EMAIL-06 | HTML formatting renders | Styled email templates | |

### 11. Admin Functions

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| ADM-01 | Client management works | CRUD for clients | |
| ADM-02 | Account Manager management | CRUD for AMs | |
| ADM-03 | Entra ID user picker works | Search and select users | |

### 12. Error Handling

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| ERR-01 | Network error shows message | Toast notification | |
| ERR-02 | SharePoint error handled | Graceful error display | |
| ERR-03 | Auth error redirects to login | Clears session, shows login | |
| ERR-04 | Form validation errors | Inline error messages | |

---

## Test Execution Log

### Session: [DATE]

**Tester**:
**Environment**:

| Test ID | Result | Notes |
|---------|--------|-------|
| | | |

---

## Defect Log

| ID | Test ID | Severity | Description | Status |
|----|---------|----------|-------------|--------|
| | | | | |

**Severity Levels**:
- Critical: App unusable, data loss
- High: Feature broken, no workaround
- Medium: Feature impaired, workaround exists
- Low: Minor issue, cosmetic

---

## Sign-off Checklist

- [ ] All Critical/High defects resolved
- [ ] Core workflows tested successfully
- [ ] Calendar integration verified
- [ ] Email notifications working
- [ ] Performance acceptable
- [ ] No console errors in production build
- [ ] Security review complete
