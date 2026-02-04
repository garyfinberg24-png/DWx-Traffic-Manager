/**
 * Test Mode Configuration
 *
 * This module provides mock authentication and data for E2E testing with TestSprite.
 * When VITE_TEST_MODE=true, the app bypasses MSAL authentication and uses mock data.
 *
 * Usage:
 *   1. Set VITE_TEST_MODE=true in .env.test
 *   2. Run the app with: npm run dev -- --mode test
 *   3. TestSprite can now interact with the app without authentication barriers
 */

import type { User } from '../types/User';
import type { Booking } from '../types/Booking';
import type { Client, TeamMember, AccountManager } from '../types/ReferenceData';

// Check if test mode is enabled
export const isTestMode = import.meta.env.VITE_TEST_MODE === 'true';

// Test mode user type - allows switching between AM and Manager roles
export type TestUserRole = 'account_manager' | 'manager';

// Get test user role from environment (default: account_manager)
export const getTestUserRole = (): TestUserRole => {
  const role = import.meta.env.VITE_TEST_USER_ROLE || 'account_manager';
  return role === 'manager' ? 'manager' : 'account_manager';
};

// Mock Users
export const mockUsers: Record<TestUserRole, User> = {
  account_manager: {
    id: 'test-am-001',
    displayName: 'Test Account Manager',
    email: 'test.am@example.com',
    jobTitle: 'Account Manager',
    isManager: false,
    groupMemberships: [],
  },
  manager: {
    id: 'test-manager-001',
    displayName: 'Test Manager',
    email: 'gary@firsttech.digital', // Uses FALLBACK_MANAGER_EMAILS for manager detection
    jobTitle: 'Sales Manager',
    isManager: true,
    groupMemberships: ['mock-manager-group-id'],
  },
};

// Get the current mock user based on test role
export const getMockUser = (): User => {
  const role = getTestUserRole();
  return mockUsers[role];
};

// Mock JWT token for API calls (not a real token - just for testing)
export const mockAccessToken = 'mock-test-token-for-testing-purposes-only';

// Mock Clients
export const mockClients: Client[] = [
  {
    Id: 1,
    Title: 'Acme Corporation',
    PrimaryContactName: 'John Smith',
    PrimaryContactEmail: 'john.smith@acme.com',
    Phone: '+1-555-0100',
    Industry: 'Technology',
    IsPremium: true,
    AccountManagerEmail: 'test.am@example.com',
    AccountManagerName: 'Test Account Manager',
    ContractStatus: 'Active',
    Notes: 'Enterprise client with multi-year contract',
    Created: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 2,
    Title: 'TechStart Inc',
    PrimaryContactName: 'Sarah Johnson',
    PrimaryContactEmail: 'sarah@techstart.io',
    Phone: '+1-555-0200',
    Industry: 'Technology',
    IsPremium: false,
    AccountManagerEmail: 'test.am@example.com',
    AccountManagerName: 'Test Account Manager',
    ContractStatus: 'Active',
    Notes: 'Growing startup - potential for expansion',
    Created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 3,
    Title: 'Global Finance Ltd',
    PrimaryContactName: 'Michael Chen',
    PrimaryContactEmail: 'mchen@globalfinance.com',
    Phone: '+1-555-0300',
    Industry: 'Finance',
    IsPremium: true,
    AccountManagerEmail: 'other.am@example.com',
    AccountManagerName: 'Other Account Manager',
    ContractStatus: 'Active',
    Notes: 'High compliance requirements',
    Created: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 4,
    Title: 'HealthCare Plus',
    PrimaryContactName: 'Emily Davis',
    PrimaryContactEmail: 'edavis@healthcareplus.org',
    Phone: '+1-555-0400',
    Industry: 'Healthcare',
    IsPremium: false,
    ContractStatus: 'Prospect',
    Notes: 'Initial discussions - demo requested',
    Created: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 5,
    Title: 'RetailMax',
    PrimaryContactName: 'David Wilson',
    PrimaryContactEmail: 'dwilson@retailmax.com',
    Phone: '+1-555-0500',
    Industry: 'Retail',
    IsPremium: false,
    ContractStatus: 'Churned',
    Notes: 'Contract ended - possible re-engagement in Q2',
    Created: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock Team Members
export const mockTeamMembers: TeamMember[] = [
  {
    Id: 1,
    Title: 'Test Project Manager',
    Email: 'test.pm@example.com',
    Phone: '+1-555-1001',
    Role: 'Project Manager',
    Department: 'Operations',
    IsActive: true,
    Created: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 2,
    Title: 'Demo Specialist One',
    Email: 'demo.spec1@example.com',
    Phone: '+1-555-1002',
    Role: 'Demo Specialist',
    Department: 'Pre-Sales',
    IsActive: true,
    Created: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 3,
    Title: 'Demo Specialist Two',
    Email: 'demo.spec2@example.com',
    Phone: '+1-555-1003',
    Role: 'Demo Specialist',
    Department: 'Pre-Sales',
    IsActive: true,
    Created: new Date(Date.now() - 250 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 4,
    Title: 'Developer One',
    Email: 'dev1@example.com',
    Phone: '+1-555-1004',
    Role: 'Developer',
    Department: 'Engineering',
    IsActive: true,
    Created: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 5,
    Title: 'Developer Two',
    Email: 'dev2@example.com',
    Phone: '+1-555-1005',
    Role: 'Developer',
    Department: 'Engineering',
    IsActive: true,
    Created: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock Account Managers
export const mockAccountManagers: AccountManager[] = [
  {
    Id: 1,
    Title: 'Test Account Manager',
    Email: 'test.am@example.com',
    Phone: '+1-555-2001',
    MobilePhone: '+1-555-2001',
    Department: 'Sales',
    JobTitle: 'Senior Account Manager',
    Region: 'Western Cape',
    Status: 'Active',
    Source: 'Internal',
    EntraUserId: 'test-am-001',
    ClientCount: 2,
    BookingCount: 5,
    HireDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
    Created: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 2,
    Title: 'Other Account Manager',
    Email: 'other.am@example.com',
    Phone: '+1-555-2002',
    Department: 'Sales',
    JobTitle: 'Account Manager',
    Region: 'Gauteng',
    Status: 'Active',
    Source: 'Internal',
    EntraUserId: 'other-am-001',
    ClientCount: 1,
    BookingCount: 3,
    HireDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    Created: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 3,
    Title: 'UK Account Manager',
    Email: 'uk.am@example.com',
    Phone: '+44-20-7123-4567',
    Department: 'Sales',
    JobTitle: 'Account Manager',
    Region: 'UK',
    Status: 'Active',
    Source: 'External',
    ExternalTenant: 'partner.onmicrosoft.com',
    Company: 'Partner Corp',
    ClientCount: 0,
    BookingCount: 1,
    Created: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper to generate future dates for proposed slots
const getFutureDate = (daysFromNow: number, hour: number = 10): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

// Mock Bookings - varied statuses for testing different scenarios
export const mockBookings: Booking[] = [
  {
    Id: 1,
    Title: 'Acme Corporation - Demo',
    AccountManagerName: 'Test Account Manager',
    AccountManagerEmail: 'test.am@example.com',
    ClientName: 'Acme Corporation',
    BookingType: 'Demo',
    LicenseCount: 500,
    ProposedSlot1: getFutureDate(3, 10),
    ProposedSlot2: getFutureDate(4, 14),
    ProposedSlot3: getFutureDate(5, 10),
    IsPremiumClient: true,
    Status: 'Pending Review',
    Comments: 'Executive demo for C-suite. Please prepare enterprise features presentation.',
    Priority: 'High',
    DealSize: 250000,
    DealValue: '$250,000 USD',
    Created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    CreatedBy: {
      Title: 'Test Account Manager',
      Email: 'test.am@example.com',
    },
  },
  {
    Id: 2,
    Title: 'TechStart Inc - Demo',
    AccountManagerName: 'Test Account Manager',
    AccountManagerEmail: 'test.am@example.com',
    ClientName: 'TechStart Inc',
    BookingType: 'Demo',
    LicenseCount: 50,
    ProposedSlot1: getFutureDate(7, 11),
    ProposedSlot2: getFutureDate(8, 15),
    ProposedSlot3: getFutureDate(9, 10),
    IsPremiumClient: false,
    Status: 'Awaiting Approval',
    Comments: 'Initial demo for technical team. Focus on API integrations.',
    Priority: 'Normal',
    DealSize: 15000,
    DealValue: '$15,000 USD',
    Created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    CreatedBy: {
      Title: 'Test Account Manager',
      Email: 'test.am@example.com',
    },
  },
  {
    Id: 3,
    Title: 'Global Finance Ltd - Deployment',
    AccountManagerName: 'Other Account Manager',
    AccountManagerEmail: 'other.am@example.com',
    ClientName: 'Global Finance Ltd',
    BookingType: 'Deployment',
    LicenseCount: 1000,
    ProposedSlot1: getFutureDate(14, 9),
    ProposedSlot2: getFutureDate(15, 9),
    ProposedSlot3: getFutureDate(16, 9),
    ConfirmedDateTime: getFutureDate(14, 9),
    IsPremiumClient: true,
    Status: 'Confirmed',
    Comments: 'Full deployment with data migration. Compliance team will be present.',
    Priority: 'Urgent',
    DealSize: 500000,
    DealValue: '$500,000 USD',
    CalendarEventId: 'mock-calendar-event-001',
    AssignedSpecialistName: 'Developer One',
    AssignedSpecialistEmail: 'dev1@example.com',
    AssignedSpecialistRole: 'Developer',
    Created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    CreatedBy: {
      Title: 'Other Account Manager',
      Email: 'other.am@example.com',
    },
  },
  {
    Id: 4,
    Title: 'HealthCare Plus - Demo',
    AccountManagerName: 'Test Account Manager',
    AccountManagerEmail: 'test.am@example.com',
    ClientName: 'HealthCare Plus',
    BookingType: 'Demo',
    LicenseCount: 200,
    ProposedSlot1: getFutureDate(10, 14),
    ProposedSlot2: getFutureDate(11, 10),
    ProposedSlot3: getFutureDate(12, 14),
    ConfirmedDateTime: getFutureDate(10, 14),
    IsPremiumClient: false,
    Status: 'Confirmed',
    Comments: 'Demo for IT and procurement team.',
    Priority: 'Normal',
    DealSize: 60000,
    DealValue: '$60,000 USD',
    CalendarEventId: 'mock-calendar-event-002',
    AssignedSpecialistName: 'Demo Specialist One',
    AssignedSpecialistEmail: 'demo.spec1@example.com',
    AssignedSpecialistRole: 'Demo Specialist',
    Created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    CreatedBy: {
      Title: 'Test Account Manager',
      Email: 'test.am@example.com',
    },
  },
  {
    Id: 5,
    Title: 'RetailMax - Demo',
    AccountManagerName: 'Test Account Manager',
    AccountManagerEmail: 'test.am@example.com',
    ClientName: 'RetailMax',
    BookingType: 'Demo',
    LicenseCount: 100,
    ProposedSlot1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    ProposedSlot2: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
    ProposedSlot3: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    IsPremiumClient: false,
    Status: 'Cancelled',
    Comments: 'Client decided to postpone evaluation.',
    Priority: 'Low',
    Created: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    CreatedBy: {
      Title: 'Test Account Manager',
      Email: 'test.am@example.com',
    },
  },
  {
    Id: 6,
    Title: 'Acme Corporation - Deployment',
    AccountManagerName: 'Test Account Manager',
    AccountManagerEmail: 'test.am@example.com',
    ClientName: 'Acme Corporation',
    BookingType: 'Deployment',
    LicenseCount: 500,
    ProposedSlot1: getFutureDate(21, 9),
    ProposedSlot2: getFutureDate(22, 9),
    ProposedSlot3: getFutureDate(23, 9),
    IsPremiumClient: true,
    Status: 'Rescheduling Required',
    Comments: 'Need to reschedule due to client availability change.',
    Priority: 'High',
    DealSize: 250000,
    DealValue: '$250,000 USD',
    Created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    CreatedBy: {
      Title: 'Test Account Manager',
      Email: 'test.am@example.com',
    },
  },
];

// In-memory storage for test mode (allows CRUD operations during tests)
let testBookings = [...mockBookings];
let testClients = [...mockClients];
let testTeamMembers = [...mockTeamMembers];
let testAccountManagers = [...mockAccountManagers];
let nextBookingId = Math.max(...mockBookings.map((b) => b.Id)) + 1;
let nextClientId = Math.max(...mockClients.map((c) => c.Id)) + 1;

// Reset test data to initial state (useful between test runs)
export const resetTestData = (): void => {
  testBookings = [...mockBookings];
  testClients = [...mockClients];
  testTeamMembers = [...mockTeamMembers];
  testAccountManagers = [...mockAccountManagers];
  nextBookingId = Math.max(...mockBookings.map((b) => b.Id)) + 1;
  nextClientId = Math.max(...mockClients.map((c) => c.Id)) + 1;
  console.log('[TestMode] Test data reset to initial state');
};

// CRUD operations for test bookings
export const getTestBookings = (): Booking[] => [...testBookings];

export const getTestBookingById = (id: number): Booking | undefined =>
  testBookings.find((b) => b.Id === id);

export const createTestBooking = (booking: Omit<Booking, 'Id'>): Booking => {
  const newBooking: Booking = {
    ...booking,
    Id: nextBookingId++,
  };
  testBookings.push(newBooking);
  return newBooking;
};

export const updateTestBooking = (id: number, updates: Partial<Booking>): Booking | undefined => {
  const index = testBookings.findIndex((b) => b.Id === id);
  if (index === -1) return undefined;

  testBookings[index] = { ...testBookings[index], ...updates };
  return testBookings[index];
};

export const deleteTestBooking = (id: number): boolean => {
  const index = testBookings.findIndex((b) => b.Id === id);
  if (index === -1) return false;

  testBookings.splice(index, 1);
  return true;
};

// CRUD operations for test clients
export const getTestClients = (): Client[] => [...testClients];

export const getTestClientByName = (name: string): Client | undefined =>
  testClients.find((c) => c.Title.toLowerCase() === name.toLowerCase());

export const createTestClient = (client: Omit<Client, 'Id'>): Client => {
  const newClient: Client = {
    ...client,
    Id: nextClientId++,
  };
  testClients.push(newClient);
  return newClient;
};

// Get test team members and account managers
export const getTestTeamMembers = (): TeamMember[] => [...testTeamMembers];
export const getTestAccountManagers = (): AccountManager[] => [...testAccountManagers];

// Console logging for test mode
if (isTestMode) {
  console.log('========================================');
  console.log('[TestMode] TEST MODE ENABLED');
  console.log(`[TestMode] User Role: ${getTestUserRole()}`);
  console.log(`[TestMode] Mock User: ${getMockUser().displayName} (${getMockUser().email})`);
  console.log(`[TestMode] Is Manager: ${getMockUser().isManager}`);
  console.log('[TestMode] Mock data loaded:');
  console.log(`  - ${mockBookings.length} bookings`);
  console.log(`  - ${mockClients.length} clients`);
  console.log(`  - ${mockTeamMembers.length} team members`);
  console.log(`  - ${mockAccountManagers.length} account managers`);
  console.log('========================================');
}
