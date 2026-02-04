# Test Mode for E2E Testing

This document describes how to use Test Mode for automated E2E testing with TestSprite or other testing frameworks.

## Overview

Test Mode bypasses Microsoft Authentication Library (MSAL) authentication and uses mock data, enabling automated E2E testing without the Windows Hello / Azure AD login barrier.

## Quick Start

### Running in Test Mode (Account Manager)

```bash
cd LP_Booking_App
npm run dev:test
```

This starts the app with:
- **Mock authentication** (auto-logged in as Test Account Manager)
- **Mock data** (bookings, clients, team members)
- **Full UI functionality** (all features work, but data is not persisted)

### Running in Test Mode (Manager)

```bash
npm run dev:test:manager
```

This starts the app as a manager user with access to:
- Dashboard
- Approval Queue
- Admin pages
- All manager-only features

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:test` | Development server in test mode (Account Manager role) |
| `npm run dev:test:manager` | Development server in test mode (Manager role) |
| `npm run build:test` | Build for test mode |
| `npm run preview:test` | Preview test build |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run Playwright with UI mode |

## Test Users

### Account Manager (Default)

| Property | Value |
|----------|-------|
| Display Name | Test Account Manager |
| Email | test.am@example.com |
| Role | Account Manager |
| Permissions | Create bookings, view own bookings |

### Manager

| Property | Value |
|----------|-------|
| Display Name | Test Manager |
| Email | gary@firsttech.digital |
| Role | Manager |
| Permissions | Dashboard, approvals, admin, all bookings |

## Mock Data

Test mode includes pre-populated mock data:

### Bookings (6 items)
- Various statuses: Pending Review, Awaiting Approval, Confirmed, Cancelled, Rescheduling Required
- Mix of Demo and Deployment types
- Premium and regular clients

### Clients (5 items)
- Acme Corporation (Premium)
- TechStart Inc
- Global Finance Ltd (Premium)
- HealthCare Plus
- RetailMax

### Team Members (5 items)
- Account Managers
- Demo Specialists
- Developers

### Account Managers (3 items)
- Western Cape, Gauteng, and UK regions
- Internal and External sources

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                    App.tsx                          │
│  ┌───────────────────────────────────────────────┐  │
│  │ isTestMode? ─────────────────────────────────▶│──┼─▶ Skip MsalProvider
│  │     │                                         │  │
│  │     ▼                                         │  │
│  │ InnerProviders (AuthProvider, etc.)           │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               serviceFactory.ts                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ getAuthService() ─────────────────────────────│  │
│  │     │                                         │  │
│  │     ├─▶ isTestMode? ─▶ MockAuthService        │  │
│  │     └─▶ else       ─▶ AuthService (MSAL)      │  │
│  │                                               │  │
│  │ getGraphService() ────────────────────────────│  │
│  │     │                                         │  │
│  │     ├─▶ isTestMode? ─▶ MockGraphService       │  │
│  │     └─▶ else       ─▶ GraphService (Graph API)│  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/config/testModeConfig.ts` | Test mode detection, mock users, mock data |
| `src/services/MockAuthService.ts` | Mock authentication (auto-login, fake tokens) |
| `src/services/MockGraphService.ts` | Mock Graph API (calendar, email, SharePoint) |
| `src/services/serviceFactory.ts` | Conditional service injection |
| `.env.test` | Environment variables for test mode |
| `.env.test.manager` | Environment variables for manager test mode |

## Using with TestSprite

### 1. Install TestSprite MCP Server

```bash
npm install -g @testsprite/testsprite-mcp@latest
```

### 2. Start the App in Test Mode

```bash
npm run dev:test
```

### 3. Run TestSprite Tests

TestSprite can now interact with the app without authentication barriers.

Example test prompts:
- "Create a new booking for Acme Corporation"
- "Navigate to My Bookings and filter by Confirmed status"
- "Test the reschedule flow for booking #1"
- "Verify the approval queue shows pending bookings" (manager mode)

## Resetting Test Data

Test data can be reset programmatically using:

```typescript
import { resetTestData } from './config/testModeConfig';
import { resetMockCalendarEvents } from './services/MockGraphService';

// Reset all mock data to initial state
resetTestData();
resetMockCalendarEvents();
```

This is useful for:
- Cleaning up between test runs
- Restoring initial state after destructive tests
- Starting fresh in TestSprite sessions

## Environment Variables

### .env.test

```env
VITE_TEST_MODE=true
VITE_TEST_USER_ROLE=account_manager  # or 'manager'
```

### Changing Test User Role

Edit `.env.test` and change `VITE_TEST_USER_ROLE`:

```env
# For Account Manager testing
VITE_TEST_USER_ROLE=account_manager

# For Manager testing
VITE_TEST_USER_ROLE=manager
```

Or use the pre-configured manager mode:

```bash
npm run dev:test:manager
```

## Limitations

1. **Data Persistence**: Mock data is in-memory only. Changes are lost on page refresh.

2. **File Uploads**: Document attachments return mock responses.

3. **Email**: Emails are logged to console but not actually sent.

4. **Calendar**: Calendar events are stored in memory, not on a real calendar.

5. **Real API Calls**: No actual Microsoft Graph or SharePoint API calls are made.

## Troubleshooting

### App shows login screen in test mode

Check that:
1. You're running with `npm run dev:test` (not `npm run dev`)
2. `.env.test` file exists with `VITE_TEST_MODE=true`
3. Browser console shows "[TestMode] TEST MODE ENABLED"

### Mock user not loading

Check console for:
- "[MockAuthService] Initialized in test mode"
- "[AuthContext] Initializing in TEST MODE"
- "[AuthContext] Test user loaded: Test Account Manager"

### Dashboard/Admin not accessible

Ensure you're running in manager mode:
```bash
npm run dev:test:manager
```

Or set `VITE_TEST_USER_ROLE=manager` in `.env.test`.

## Extending Mock Data

To add more mock data, edit `src/config/testModeConfig.ts`:

```typescript
// Add more mock bookings
export const mockBookings: Booking[] = [
  // ... existing bookings
  {
    Id: 7,
    Title: 'New Test Client - Demo',
    // ... other fields
  },
];

// Add more mock clients
export const mockClients: Client[] = [
  // ... existing clients
  {
    Id: 6,
    Title: 'New Test Client',
    // ... other fields
  },
];
```
