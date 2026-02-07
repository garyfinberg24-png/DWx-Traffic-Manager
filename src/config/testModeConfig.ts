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
import type { ServiceRequest, Specialist } from '../types/ServiceRequest';
import type { ProductRequest } from '../types/ProductRequest';
import type { Proposal } from '../types/Proposal';

// Check if test mode is enabled — with production safeguard
let _isTestMode = import.meta.env.VITE_TEST_MODE === 'true';
if (_isTestMode && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  console.error('[TestMode] BLOCKED: Test mode cannot run in production. Hostname:', window.location.hostname);
  _isTestMode = false;
}
export const isTestMode = _isTestMode;

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

// Mock Specialists
export const mockSpecialists: Specialist[] = [
  {
    Id: 1,
    Title: 'Alice van der Merwe',
    Email: 'alice.vdm@firsttech.digital',
    Role: 'Solution Architect',
    Specializations: ['Power Platform', 'Copilot Agents', 'M365 Assessment'],
    MaxConcurrentDeals: 4,
    CurrentDealCount: 2,
    IsActive: true,
    CalendarEmail: 'alice.vdm@firsttech.digital',
    Phone: '+27-21-555-0001',
    Created: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 2,
    Title: 'James Naidoo',
    Email: 'james.n@firsttech.digital',
    Role: 'Technical Specialist',
    Specializations: ['SPFx Development', 'SharePoint Migration'],
    MaxConcurrentDeals: 3,
    CurrentDealCount: 3,
    IsActive: true,
    CalendarEmail: 'james.n@firsttech.digital',
    Phone: '+27-21-555-0002',
    Created: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 3,
    Title: 'Priya Govender',
    Email: 'priya.g@firsttech.digital',
    Role: 'Consultant',
    Specializations: ['MS Viva', 'Training', 'M365 Assessment'],
    MaxConcurrentDeals: 5,
    CurrentDealCount: 1,
    IsActive: true,
    CalendarEmail: 'priya.g@firsttech.digital',
    Phone: '+27-11-555-0003',
    Created: new Date(Date.now() - 250 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 4,
    Title: 'David Botha',
    Email: 'david.b@firsttech.digital',
    Role: 'Technical Specialist',
    Specializations: ['Power Platform', 'SPFx Development', 'Copilot Agents'],
    MaxConcurrentDeals: 3,
    CurrentDealCount: 0,
    IsActive: true,
    CalendarEmail: 'david.b@firsttech.digital',
    Phone: '+27-21-555-0004',
    Created: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 5,
    Title: 'Sarah Chen',
    Email: 'sarah.c@firsttech.digital',
    Role: 'Solution Architect',
    Specializations: ['SharePoint Migration', 'M365 Assessment'],
    MaxConcurrentDeals: 4,
    CurrentDealCount: 2,
    IsActive: false,
    CalendarEmail: 'sarah.c@firsttech.digital',
    Phone: '+44-20-555-0005',
    Created: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock Service Requests (across all funnel stages)
export const mockServiceRequests: ServiceRequest[] = [
  {
    Id: 101,
    Title: 'Acme Corporation - Power Platform Development',
    ServiceId: 1,
    ServiceName: 'Power Platform Development',
    AccountManagerName: 'Gary Finberg',
    AccountManagerEmail: 'gary@firsttech.digital',
    AccountManagerTenant: 'Internal',
    ClientName: 'Acme Corporation',
    ClientId: 1,
    ContactName: 'John Smith',
    ContactEmail: 'john.smith@acme.com',
    ContactPhone: '+1-555-0100',
    Industry: 'Technology',
    CompanySize: 'Enterprise',
    FunnelStage: 'Discovery',
    InterestLevel: 'Hot',
    DealValue: 120000,
    DealProbability: 60,
    WeightedPipeline: 72000,
    ExpectedCloseDate: getFutureDate(30),
    ProposedSlot1: getFutureDate(5, 10),
    ProposedSlot2: getFutureDate(6, 14),
    ProposedSlot3: getFutureDate(7, 10),
    AssignedSpecialistName: 'Alice van der Merwe',
    AssignedSpecialistEmail: 'alice.vdm@firsttech.digital',
    AssignedSpecialistRole: 'Solution Architect',
    Requirements: 'Custom Power App for field service management with offline capabilities.',
    Comments: 'Key account — CEO personally involved.',
    StageTimestamps: {
      Lead: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      Qualified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      Discovery: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    Created: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 102,
    Title: 'TechStart Inc - SPFx Development',
    ServiceId: 2,
    ServiceName: 'SPFx Development',
    AccountManagerName: 'Test Account Manager',
    AccountManagerEmail: 'test.am@example.com',
    AccountManagerTenant: 'Internal',
    ClientName: 'TechStart Inc',
    ClientId: 2,
    ContactName: 'Sarah Johnson',
    ContactEmail: 'sarah@techstart.io',
    Industry: 'Technology',
    CompanySize: 'SMB',
    FunnelStage: 'Lead',
    InterestLevel: 'Warm',
    DealValue: 35000,
    DealProbability: 20,
    WeightedPipeline: 7000,
    ProposedSlot1: getFutureDate(10, 11),
    ProposedSlot2: getFutureDate(11, 15),
    ProposedSlot3: getFutureDate(12, 10),
    Comments: 'Initial inquiry through website contact form.',
    StageTimestamps: {
      Lead: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    Created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 103,
    Title: 'Global Finance Ltd - M365 Tenant Assessment',
    ServiceId: 4,
    ServiceName: 'M365 Tenant Assessment',
    AccountManagerName: 'Other Account Manager',
    AccountManagerEmail: 'other.am@example.com',
    AccountManagerTenant: 'Internal',
    ClientName: 'Global Finance Ltd',
    ClientId: 3,
    ContactName: 'Michael Chen',
    ContactEmail: 'mchen@globalfinance.com',
    ContactPhone: '+1-555-0300',
    Industry: 'Finance',
    CompanySize: 'Large',
    FunnelStage: 'Proposal',
    InterestLevel: 'Hot',
    DealValue: 75000,
    DealProbability: 70,
    WeightedPipeline: 52500,
    ExpectedCloseDate: getFutureDate(21),
    ProposedSlot1: getFutureDate(14, 9),
    ProposedSlot2: getFutureDate(15, 9),
    ProposedSlot3: getFutureDate(16, 9),
    AssignedSpecialistName: 'Alice van der Merwe',
    AssignedSpecialistEmail: 'alice.vdm@firsttech.digital',
    AssignedSpecialistRole: 'Solution Architect',
    Requirements: 'Full tenant security and compliance assessment. POPIA focus.',
    StageTimestamps: {
      Lead: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      Qualified: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
      Discovery: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      Proposal: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    Created: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 104,
    Title: 'HealthCare Plus - SharePoint Migration',
    ServiceId: 3,
    ServiceName: 'SharePoint Migration',
    AccountManagerName: 'Test Account Manager',
    AccountManagerEmail: 'test.am@example.com',
    AccountManagerTenant: 'Internal',
    ClientName: 'HealthCare Plus',
    ClientId: 4,
    ContactName: 'Emily Davis',
    ContactEmail: 'edavis@healthcareplus.org',
    ContactPhone: '+1-555-0400',
    Industry: 'Healthcare',
    CompanySize: 'Medium',
    FunnelStage: 'Qualified',
    InterestLevel: 'Warm',
    DealValue: 95000,
    DealProbability: 40,
    WeightedPipeline: 38000,
    ExpectedCloseDate: getFutureDate(45),
    ProposedSlot1: getFutureDate(8, 10),
    ProposedSlot2: getFutureDate(9, 14),
    ProposedSlot3: getFutureDate(10, 10),
    Requirements: 'Migrate from SP 2016 on-prem to SPO. ~2TB content, 500 users.',
    Comments: 'Compliance-heavy — HIPAA considerations.',
    StageTimestamps: {
      Lead: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      Qualified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    Created: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 105,
    Title: 'RetailMax - Enterprise Copilot Agents',
    ServiceId: 5,
    ServiceName: 'Enterprise Copilot Agents',
    AccountManagerName: 'Gary Finberg',
    AccountManagerEmail: 'gary@firsttech.digital',
    AccountManagerTenant: 'Internal',
    ClientName: 'RetailMax',
    ClientId: 5,
    ContactName: 'David Wilson',
    ContactEmail: 'dwilson@retailmax.com',
    Industry: 'Retail',
    CompanySize: 'Large',
    FunnelStage: 'Negotiation',
    InterestLevel: 'Hot',
    DealValue: 180000,
    DealProbability: 80,
    WeightedPipeline: 144000,
    ExpectedCloseDate: getFutureDate(14),
    ProposedSlot1: getFutureDate(3, 10),
    ProposedSlot2: getFutureDate(4, 14),
    ProposedSlot3: getFutureDate(5, 10),
    ConfirmedDateTime: getFutureDate(3, 10),
    CalendarEventId: 'mock-dwx-event-001',
    AssignedSpecialistName: 'David Botha',
    AssignedSpecialistEmail: 'david.b@firsttech.digital',
    AssignedSpecialistRole: 'Technical Specialist',
    Requirements: 'Customer service Copilot agent with CRM integration.',
    Comments: 'Final contract terms under review by legal.',
    StageTimestamps: {
      Lead: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      Qualified: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      Discovery: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
      Proposal: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      Negotiation: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    Created: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 106,
    Title: 'Acme Corporation - Microsoft Viva Suite',
    ServiceId: 6,
    ServiceName: 'Microsoft Viva Suite',
    AccountManagerName: 'Gary Finberg',
    AccountManagerEmail: 'gary@firsttech.digital',
    AccountManagerTenant: 'Internal',
    ClientName: 'Acme Corporation',
    ClientId: 1,
    ContactName: 'John Smith',
    ContactEmail: 'john.smith@acme.com',
    Industry: 'Technology',
    CompanySize: 'Enterprise',
    FunnelStage: 'Won',
    InterestLevel: 'Hot',
    DealValue: 60000,
    DealProbability: 100,
    WeightedPipeline: 60000,
    ExpectedCloseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    ProposedSlot1: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    ProposedSlot2: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
    ProposedSlot3: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    ConfirmedDateTime: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    AssignedSpecialistName: 'Priya Govender',
    AssignedSpecialistEmail: 'priya.g@firsttech.digital',
    AssignedSpecialistRole: 'Consultant',
    WinLossReason: 'Strong relationship + competitive pricing.',
    StageTimestamps: {
      Lead: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      Qualified: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
      Discovery: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      Proposal: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      Negotiation: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      Won: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    Created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 107,
    Title: 'Global Finance Ltd - Power Platform Development',
    ServiceId: 1,
    ServiceName: 'Power Platform Development',
    AccountManagerName: 'Other Account Manager',
    AccountManagerEmail: 'other.am@example.com',
    AccountManagerTenant: 'Internal',
    ClientName: 'Global Finance Ltd',
    ClientId: 3,
    ContactName: 'Michael Chen',
    ContactEmail: 'mchen@globalfinance.com',
    Industry: 'Finance',
    CompanySize: 'Large',
    FunnelStage: 'Lost',
    InterestLevel: 'Cold',
    DealValue: 50000,
    DealProbability: 0,
    WeightedPipeline: 0,
    ProposedSlot1: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    ProposedSlot2: new Date(Date.now() - 39 * 24 * 60 * 60 * 1000).toISOString(),
    ProposedSlot3: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString(),
    WinLossReason: 'Budget frozen — will revisit in Q3.',
    StageTimestamps: {
      Lead: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      Qualified: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      Discovery: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      Lost: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    },
    Created: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 108,
    Title: 'HealthCare Plus - Zero to AI Copilot Chat Hero',
    ServiceId: 7,
    ServiceName: 'Zero to AI Copilot Chat Hero',
    AccountManagerName: 'Gary Finberg',
    AccountManagerEmail: 'gary@firsttech.digital',
    AccountManagerTenant: 'Internal',
    ClientName: 'HealthCare Plus',
    ClientId: 4,
    ContactName: 'Emily Davis',
    ContactEmail: 'edavis@healthcareplus.org',
    Industry: 'Healthcare',
    CompanySize: 'Medium',
    FunnelStage: 'Lead',
    InterestLevel: 'Cold',
    DealValue: 35000,
    DealProbability: 10,
    WeightedPipeline: 3500,
    ProposedSlot1: getFutureDate(20, 9),
    ProposedSlot2: getFutureDate(21, 9),
    ProposedSlot3: getFutureDate(22, 9),
    Comments: 'Expressed interest at webinar — follow up required.',
    StageTimestamps: {
      Lead: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    Created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 109,
    Title: 'TechStart Inc - M365 Tenant Assessment',
    ServiceId: 4,
    ServiceName: 'M365 Tenant Assessment',
    AccountManagerName: 'Test Account Manager',
    AccountManagerEmail: 'test.am@example.com',
    AccountManagerTenant: 'Internal',
    ClientName: 'TechStart Inc',
    ClientId: 2,
    ContactName: 'Sarah Johnson',
    ContactEmail: 'sarah@techstart.io',
    Industry: 'Technology',
    CompanySize: 'SMB',
    FunnelStage: 'Discovery',
    InterestLevel: 'Warm',
    DealValue: 15000,
    DealProbability: 50,
    WeightedPipeline: 7500,
    ExpectedCloseDate: getFutureDate(28),
    ProposedSlot1: getFutureDate(7, 10),
    ProposedSlot2: getFutureDate(8, 14),
    ProposedSlot3: getFutureDate(9, 10),
    ConfirmedDateTime: getFutureDate(7, 10),
    CalendarEventId: 'mock-dwx-event-002',
    AssignedSpecialistName: 'James Naidoo',
    AssignedSpecialistEmail: 'james.n@firsttech.digital',
    AssignedSpecialistRole: 'Technical Specialist',
    Requirements: 'Basic tenant health check and license review.',
    StageTimestamps: {
      Lead: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      Qualified: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      Discovery: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    Created: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 110,
    Title: 'RetailMax - SharePoint Migration',
    ServiceId: 3,
    ServiceName: 'SharePoint Migration',
    AccountManagerName: 'UK Account Manager',
    AccountManagerEmail: 'uk.am@example.com',
    AccountManagerTenant: 'External',
    ClientName: 'RetailMax',
    ClientId: 5,
    ContactName: 'David Wilson',
    ContactEmail: 'dwilson@retailmax.com',
    Industry: 'Retail',
    CompanySize: 'Large',
    FunnelStage: 'Qualified',
    InterestLevel: 'Warm',
    DealValue: 110000,
    DealProbability: 35,
    WeightedPipeline: 38500,
    ExpectedCloseDate: getFutureDate(60),
    ProposedSlot1: getFutureDate(12, 9),
    ProposedSlot2: getFutureDate(13, 14),
    ProposedSlot3: getFutureDate(14, 9),
    Requirements: 'Migrate 5TB file share + SP 2013 intranet to SPO.',
    StageTimestamps: {
      Lead: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      Qualified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    Created: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // --- Additional mock requests for list-view testing ---
  {
    Id: 111,
    Title: 'TechStart Inc - Training',
    ServiceId: 7,
    ServiceName: 'Training',
    AccountManagerName: 'Gary Finberg',
    AccountManagerEmail: 'gary@firsttech.digital',
    AccountManagerTenant: 'Internal',
    ClientName: 'TechStart Inc',
    ClientId: 2,
    ContactName: 'Sarah Johnson',
    ContactEmail: 'sarah@techstart.io',
    Industry: 'Technology',
    CompanySize: 'SMB',
    FunnelStage: 'Proposal',
    InterestLevel: 'Warm',
    DealValue: 22000,
    DealProbability: 55,
    WeightedPipeline: 12100,
    ExpectedCloseDate: getFutureDate(25),
    AssignedSpecialistName: 'Priya Govender',
    AssignedSpecialistEmail: 'priya.g@firsttech.digital',
    AssignedSpecialistRole: 'Consultant',
    ProposedSlot1: getFutureDate(15, 9),
    ProposedSlot2: getFutureDate(16, 14),
    ProposedSlot3: getFutureDate(17, 10),
    Requirements: 'M365 power user training for 20 staff — focus on Teams, SharePoint, OneDrive.',
    StageTimestamps: {
      Lead: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      Qualified: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      Discovery: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      Proposal: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    Created: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 112,
    Title: 'Global Finance Ltd - Strategic Advisory',
    ServiceId: 12,
    ServiceName: 'Strategic Advisory',
    AccountManagerName: 'Other Account Manager',
    AccountManagerEmail: 'other.am@example.com',
    AccountManagerTenant: 'Internal',
    ClientName: 'Global Finance Ltd',
    ClientId: 3,
    ContactName: 'Michael Chen',
    ContactEmail: 'mchen@globalfinance.com',
    ContactPhone: '+1-555-0300',
    Industry: 'Finance',
    CompanySize: 'Large',
    FunnelStage: 'Discovery',
    InterestLevel: 'Hot',
    DealValue: 250000,
    DealProbability: 45,
    WeightedPipeline: 112500,
    ExpectedCloseDate: getFutureDate(50),
    AssignedSpecialistName: 'Alice van der Merwe',
    AssignedSpecialistEmail: 'alice.vdm@firsttech.digital',
    AssignedSpecialistRole: 'Solution Architect',
    ProposedSlot1: getFutureDate(8, 10),
    ProposedSlot2: getFutureDate(9, 14),
    ProposedSlot3: getFutureDate(10, 10),
    Requirements: 'Digital transformation roadmap for FY2027. Board-level strategic advisory.',
    Comments: 'CIO sponsoring this initiative. Multi-year engagement potential.',
    StageTimestamps: {
      Lead: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      Qualified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      Discovery: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    Created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 113,
    Title: 'Acme Corporation - Tender Response',
    ServiceId: 9,
    ServiceName: 'Tender Response',
    AccountManagerName: 'Gary Finberg',
    AccountManagerEmail: 'gary@firsttech.digital',
    AccountManagerTenant: 'Internal',
    ClientName: 'Acme Corporation',
    ClientId: 1,
    ContactName: 'John Smith',
    ContactEmail: 'john.smith@acme.com',
    Industry: 'Technology',
    CompanySize: 'Enterprise',
    FunnelStage: 'Qualified',
    InterestLevel: 'Hot',
    DealValue: 450000,
    DealProbability: 30,
    WeightedPipeline: 135000,
    ExpectedCloseDate: getFutureDate(40),
    ProposedSlot1: getFutureDate(6, 9),
    ProposedSlot2: getFutureDate(7, 14),
    ProposedSlot3: getFutureDate(8, 9),
    Requirements: 'RFP response for enterprise-wide collaboration platform overhaul.',
    Comments: 'Tight deadline — tender closes in 6 weeks.',
    StageTimestamps: {
      Lead: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      Qualified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    Created: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 114,
    Title: 'HealthCare Plus - SLA Management',
    ServiceId: 11,
    ServiceName: 'SLA Management',
    AccountManagerName: 'Test Account Manager',
    AccountManagerEmail: 'test.am@example.com',
    AccountManagerTenant: 'Internal',
    ClientName: 'HealthCare Plus',
    ClientId: 4,
    ContactName: 'Emily Davis',
    ContactEmail: 'edavis@healthcareplus.org',
    ContactPhone: '+1-555-0400',
    Industry: 'Healthcare',
    CompanySize: 'Medium',
    FunnelStage: 'Lead',
    InterestLevel: 'Warm',
    DealValue: 40000,
    DealProbability: 15,
    WeightedPipeline: 6000,
    ProposedSlot1: getFutureDate(18, 10),
    ProposedSlot2: getFutureDate(19, 14),
    ProposedSlot3: getFutureDate(20, 10),
    Comments: 'Client wants to formalize SLA agreements across all M365 services.',
    StageTimestamps: {
      Lead: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    Created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 115,
    Title: 'RetailMax - Ad-Hoc Support',
    ServiceId: 10,
    ServiceName: 'Ad-Hoc Support',
    AccountManagerName: 'Gary Finberg',
    AccountManagerEmail: 'gary@firsttech.digital',
    AccountManagerTenant: 'Internal',
    ClientName: 'RetailMax',
    ClientId: 5,
    ContactName: 'David Wilson',
    ContactEmail: 'dwilson@retailmax.com',
    Industry: 'Retail',
    CompanySize: 'Large',
    FunnelStage: 'Won',
    InterestLevel: 'Hot',
    DealValue: 15000,
    DealProbability: 100,
    WeightedPipeline: 15000,
    AssignedSpecialistName: 'James Naidoo',
    AssignedSpecialistEmail: 'james.n@firsttech.digital',
    AssignedSpecialistRole: 'Technical Specialist',
    ProposedSlot1: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    ProposedSlot2: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
    ProposedSlot3: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    WinLossReason: 'Existing relationship — quick turnaround needed.',
    StageTimestamps: {
      Lead: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      Qualified: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
      Discovery: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      Proposal: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
      Negotiation: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      Won: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    Created: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 116,
    Title: 'Acme Corporation - Proposal Writing',
    ServiceId: 8,
    ServiceName: 'Proposal Writing',
    AccountManagerName: 'Test Account Manager',
    AccountManagerEmail: 'test.am@example.com',
    AccountManagerTenant: 'Internal',
    ClientName: 'Acme Corporation',
    ClientId: 1,
    ContactName: 'John Smith',
    ContactEmail: 'john.smith@acme.com',
    Industry: 'Technology',
    CompanySize: 'Enterprise',
    FunnelStage: 'Negotiation',
    InterestLevel: 'Hot',
    DealValue: 85000,
    DealProbability: 75,
    WeightedPipeline: 63750,
    ExpectedCloseDate: getFutureDate(10),
    AssignedSpecialistName: 'David Botha',
    AssignedSpecialistEmail: 'david.b@firsttech.digital',
    AssignedSpecialistRole: 'Technical Specialist',
    ProposedSlot1: getFutureDate(4, 10),
    ProposedSlot2: getFutureDate(5, 14),
    ProposedSlot3: getFutureDate(6, 10),
    Requirements: 'Formal proposal for Copilot + Power Platform bundle. Board presentation format.',
    Comments: 'Procurement has approved budget — legal review in progress.',
    StageTimestamps: {
      Lead: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      Qualified: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      Discovery: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
      Proposal: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
      Negotiation: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    Created: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 117,
    Title: 'Global Finance Ltd - Microsoft Viva Suite',
    ServiceId: 6,
    ServiceName: 'Microsoft Viva Suite',
    AccountManagerName: 'UK Account Manager',
    AccountManagerEmail: 'uk.am@example.com',
    AccountManagerTenant: 'External',
    ClientName: 'Global Finance Ltd',
    ClientId: 3,
    ContactName: 'Michael Chen',
    ContactEmail: 'mchen@globalfinance.com',
    Industry: 'Finance',
    CompanySize: 'Large',
    FunnelStage: 'Lost',
    InterestLevel: 'Cold',
    DealValue: 70000,
    DealProbability: 0,
    WeightedPipeline: 0,
    ProposedSlot1: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    ProposedSlot2: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000).toISOString(),
    ProposedSlot3: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000).toISOString(),
    WinLossReason: 'Chose competitor — lower price point won out.',
    StageTimestamps: {
      Lead: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      Qualified: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      Discovery: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
      Proposal: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      Lost: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    },
    Created: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock Product Requests
export const mockProductRequests: ProductRequest[] = [
  {
    Id: 201,
    Title: 'Acme Corporation - DWx Insights (Demo)',
    ProductId: 'dwx-insights-001',
    ProductName: 'DWx Insights Dashboard',
    ProductType: 'Web Part',
    ProductCategory: 'Analytics',
    RequestType: 'Demo',
    AccountManagerName: 'Test Account Manager',
    AccountManagerEmail: 'test.am@example.com',
    ClientName: 'Acme Corporation',
    ContactName: 'John Smith',
    ContactEmail: 'john.smith@acme.com',
    ContactPhone: '+1-555-0100',
    Industry: 'Technology',
    CompanySize: 'Enterprise',
    IsPremiumClient: true,
    Status: 'Pending Review',
    LicenseCount: 500,
    EstimatedValue: 45000,
    ProposedSlot1: getFutureDate(5, 10),
    ProposedSlot2: getFutureDate(6, 14),
    ProposedSlot3: getFutureDate(7, 10),
    ProductRequirements: 'Integration with existing Power BI dashboards.',
    Comments: 'High priority — CEO wants to see analytics capabilities.',
    Created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 202,
    Title: 'TechStart Inc - Copilot Agent (Trial Deployment)',
    ProductId: 'copilot-agent-002',
    ProductName: 'IT Help Desk Copilot',
    ProductType: 'Agent',
    ProductCategory: 'AI',
    RequestType: 'Trial Deployment',
    AccountManagerName: 'Test Account Manager',
    AccountManagerEmail: 'test.am@example.com',
    ClientName: 'TechStart Inc',
    ContactName: 'Sarah Johnson',
    ContactEmail: 'sarah@techstart.io',
    Industry: 'Technology',
    CompanySize: 'SMB',
    IsPremiumClient: false,
    Status: 'Awaiting Approval',
    LicenseCount: 50,
    EstimatedValue: 12000,
    ProposedSlot1: getFutureDate(10, 11),
    ProposedSlot2: getFutureDate(11, 15),
    ProposedSlot3: getFutureDate(12, 10),
    AssignedSpecialistName: 'David Botha',
    AssignedSpecialistEmail: 'david.b@firsttech.digital',
    AssignedSpecialistRole: 'Technical Specialist',
    ProductRequirements: 'Knowledge base for internal IT FAQs and ticket creation.',
    Created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 203,
    Title: 'Global Finance Ltd - Compliance App (Demo)',
    ProductId: 'compliance-app-003',
    ProductName: 'DWx Compliance Tracker',
    ProductType: 'App',
    ProductCategory: 'Governance',
    RequestType: 'Demo',
    AccountManagerName: 'Other Account Manager',
    AccountManagerEmail: 'other.am@example.com',
    ClientName: 'Global Finance Ltd',
    ContactName: 'Michael Chen',
    ContactEmail: 'mchen@globalfinance.com',
    Industry: 'Finance',
    CompanySize: 'Large',
    IsPremiumClient: true,
    Status: 'Confirmed',
    LicenseCount: 200,
    EstimatedValue: 30000,
    ProposedSlot1: getFutureDate(3, 9),
    ProposedSlot2: getFutureDate(4, 9),
    ProposedSlot3: getFutureDate(5, 9),
    ConfirmedDateTime: getFutureDate(3, 9),
    CalendarEventId: 'mock-product-event-001',
    AssignedSpecialistName: 'Alice van der Merwe',
    AssignedSpecialistEmail: 'alice.vdm@firsttech.digital',
    AssignedSpecialistRole: 'Solution Architect',
    ProductRequirements: 'POPIA and GDPR compliance tracking with audit trails.',
    Created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 204,
    Title: 'HealthCare Plus - Viva Card (Demo)',
    ProductId: 'viva-card-004',
    ProductName: 'Employee Wellness Card',
    ProductType: 'Adaptive Card',
    ProductCategory: 'Employee Experience',
    RequestType: 'Demo',
    AccountManagerName: 'Test Account Manager',
    AccountManagerEmail: 'test.am@example.com',
    ClientName: 'HealthCare Plus',
    ContactName: 'Emily Davis',
    ContactEmail: 'edavis@healthcareplus.org',
    Industry: 'Healthcare',
    IsPremiumClient: false,
    Status: 'Completed',
    LicenseCount: 100,
    EstimatedValue: 8000,
    ProposedSlot1: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    ConfirmedDateTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    AssignedSpecialistName: 'Priya Govender',
    AssignedSpecialistEmail: 'priya.g@firsttech.digital',
    AssignedSpecialistRole: 'Consultant',
    Outcome: 'Client impressed — proceeding to trial.',
    NextSteps: 'Prepare trial deployment proposal.',
    Created: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 205,
    Title: 'RetailMax - Inventory Agent (Trial Deployment)',
    ProductId: 'inventory-agent-005',
    ProductName: 'Smart Inventory Agent',
    ProductType: 'Agent',
    ProductCategory: 'Operations',
    RequestType: 'Trial Deployment',
    AccountManagerName: 'Test Account Manager',
    AccountManagerEmail: 'test.am@example.com',
    ClientName: 'RetailMax',
    ContactName: 'David Wilson',
    ContactEmail: 'dwilson@retailmax.com',
    Industry: 'Retail',
    CompanySize: 'Large',
    IsPremiumClient: false,
    Status: 'Cancelled',
    LicenseCount: 75,
    EstimatedValue: 20000,
    ProposedSlot1: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    Comments: 'Client postponed — budget constraints.',
    Created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock Proposals — linked to service requests in Proposal+ stages
export const mockProposals: Proposal[] = [
  {
    Id: 301,
    Title: 'Global Finance Ltd - M365 Tenant Assessment Proposal',
    ServiceRequestId: 103, // FunnelStage: Proposal
    Status: 'Draft',
    Version: 1,
    ProposalType: 'Standard',
    TemplateName: 'DW Standard Proposal',
    ExecutiveSummary: {
      overview: 'Digital Workplace proposes a comprehensive M365 Tenant Assessment for Global Finance Ltd, focusing on security posture, compliance readiness (POPIA), and governance optimization across their Microsoft 365 environment.',
      objectives: [
        'Evaluate current M365 security configuration and identify gaps',
        'Assess POPIA compliance readiness across all M365 workloads',
        'Review governance policies and recommend improvements',
        'Provide a prioritized remediation roadmap',
      ],
      successCriteria: [
        'Complete security assessment report delivered within 2 weeks',
        'POPIA compliance gap analysis with remediation steps',
        'Executive briefing with prioritized recommendations',
      ],
    },
    SolutionOverview: {
      description: 'Our M365 Tenant Assessment provides a thorough evaluation of your Microsoft 365 environment, covering security, compliance, governance, and user adoption. Using industry-leading tools and frameworks, we identify risks and opportunities to maximize your M365 investment.',
      approach: 'We follow a structured 3-phase approach: Discovery (automated scanning + stakeholder interviews), Analysis (gap assessment against best practices), and Reporting (executive summary + detailed technical findings).',
      differentiators: [
        'POPIA-specific compliance framework developed for SA market',
        'Automated scanning with Microsoft Secure Score integration',
        'Actionable remediation roadmap with effort estimates',
      ],
    },
    TechnologyStack: null,
    ScopeOfWork: {
      deliverables: [
        { title: 'Security Configuration Review', description: 'Review of all M365 security settings including MFA, Conditional Access, DLP policies', hours: 16 },
        { title: 'Compliance Gap Analysis', description: 'POPIA compliance assessment across Exchange, SharePoint, Teams, and OneDrive', hours: 12 },
        { title: 'Governance Review', description: 'Review of admin roles, group policies, sharing settings, and retention policies', hours: 8 },
        { title: 'Executive Report & Briefing', description: 'Comprehensive report with findings, risk ratings, and prioritized remediation roadmap', hours: 8 },
      ],
      exclusions: [
        'Remediation implementation (can be quoted separately)',
        'Third-party application security review',
        'Physical security assessment',
      ],
    },
    PricingBreakdown: {
      lineItems: [
        { description: 'Security Configuration Review (2 days)', quantity: 1, unitPrice: 16000, total: 16000 },
        { description: 'Compliance Gap Analysis (1.5 days)', quantity: 1, unitPrice: 12000, total: 12000 },
        { description: 'Governance Review (1 day)', quantity: 1, unitPrice: 8000, total: 8000 },
        { description: 'Executive Report & Briefing', quantity: 1, unitPrice: 8000, total: 8000 },
      ],
      subtotal: 44000,
      tax: 6600,
      discount: 0,
      grandTotal: 50600,
    },
    Timeline: {
      phases: [
        { name: 'Discovery & Scanning', startWeek: 1, endWeek: 1, milestones: ['Kickoff meeting', 'Automated scans complete'] },
        { name: 'Analysis & Assessment', startWeek: 2, endWeek: 2, milestones: ['Gap analysis complete', 'Internal review'] },
        { name: 'Reporting & Handover', startWeek: 3, endWeek: 3, milestones: ['Draft report delivery', 'Executive briefing'] },
      ],
      totalWeeks: 3,
    },
    TeamComposition: {
      members: [
        { role: 'Solution Architect', name: 'Alice van der Merwe', responsibility: 'Lead assessment, security review, executive briefing' },
        { role: 'Technical Specialist', name: 'James Naidoo', responsibility: 'Automated scanning, compliance analysis' },
      ],
    },
    Terms: {
      paymentTerms: 'Payment is due within 30 days of invoice date. A 50% deposit is required before project commencement, with the remaining 50% due upon completion of each milestone phase.',
      warranty: 'Digital Workplace provides a 90-day warranty period following project delivery.',
      liability: "Digital Workplace's total liability under this agreement shall not exceed the total contract value.",
      confidentiality: 'Both parties agree to maintain the confidentiality of all proprietary information shared during the engagement.',
      ipOwnership: 'All custom-developed intellectual property created specifically for this engagement shall be owned by the Client upon full payment.',
      termination: 'Either party may terminate this agreement with 30 days written notice.',
    },
    ChangeControl: {
      process: 'All changes to the agreed scope of work must be submitted in writing via a formal Change Request (CR).',
      approvalLevels: [
        'Minor changes (< 8 hours impact): Project Manager approval',
        'Medium changes (8-40 hours impact): Client Sponsor + DW Account Manager approval',
      ],
      pricingImpact: 'Changes that increase scope will be priced at the agreed day rate.',
    },
    Assumptions: [
      'Client will provide admin access to M365 tenant for scanning',
      'Key stakeholders available for interviews during Week 1',
      'Assessment covers production tenant only',
    ],
    Risks: [
      { risk: 'Limited admin access delays scanning', impact: 'Medium', mitigation: 'Request access credentials 1 week before kickoff', likelihood: 'Low' },
      { risk: 'Complex third-party integrations discovered', impact: 'Medium', mitigation: 'Third-party review can be scoped as a separate phase', likelihood: 'Medium' },
    ],
    SigningPage: null,
    ValidUntil: getFutureDate(30),
    SentDate: null,
    ClientResponseDate: null,
    ClientFeedback: '',
    InternalNotes: '',
    DocumentUrl: '',
    CreatedByEmail: 'gary@firsttech.digital',
    CreatedByName: 'Gary Finberg',
    ApprovedByEmail: '',
    ApprovedByName: '',
    ApprovedDate: null,
    Created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    Modified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 302,
    Title: 'RetailMax - Enterprise Copilot Agents Proposal',
    ServiceRequestId: 105, // FunnelStage: Negotiation
    Status: 'Sent to Client',
    Version: 2,
    ProposalType: 'Enterprise',
    TemplateName: 'DW Enterprise Proposal',
    ExecutiveSummary: {
      overview: 'Digital Workplace proposes the design and deployment of enterprise-grade Copilot Agents for RetailMax, focusing on customer service automation and CRM integration to drive operational efficiency across retail operations.',
      objectives: [
        'Deploy a customer-facing Copilot agent for order tracking and FAQs',
        'Integrate with existing CRM system for contextual customer interactions',
        'Build an internal agent for staff product knowledge queries',
        'Establish monitoring and continuous improvement framework',
      ],
      successCriteria: [
        'Customer-facing agent handles 60% of tier-1 queries autonomously',
        '30% reduction in average response time for customer inquiries',
        'Staff adoption rate of 80% within first 3 months',
      ],
    },
    SolutionOverview: {
      description: 'Our Enterprise Copilot Agents solution leverages Microsoft Copilot Studio and Azure AI to build intelligent conversational agents tailored for retail operations. The solution includes both customer-facing and internal agents, with seamless CRM integration.',
      approach: 'Agile delivery in 4 sprints: Foundation & Architecture → Customer Agent MVP → Internal Agent + CRM Integration → Testing, Training & Go-Live.',
      differentiators: [
        'Retail-specific Copilot agent templates from our IP library',
        'Native Microsoft 365 Copilot integration for staff agents',
        'Proven deployment methodology with 15+ enterprise Copilot deployments',
      ],
    },
    TechnologyStack: {
      technologies: [
        { name: 'Microsoft Copilot Studio', role: 'Agent orchestration & conversational AI', justification: 'Enterprise-grade agent platform with native M365 integration' },
        { name: 'Azure OpenAI Service', role: 'LLM backbone for natural language understanding', justification: 'GPT-4o for high-quality, context-aware responses' },
        { name: 'Power Automate', role: 'Backend workflow automation', justification: 'Low-code integration with CRM and business systems' },
        { name: 'Azure AI Search', role: 'Knowledge base indexing', justification: 'Fast, relevant retrieval for product knowledge' },
      ],
    },
    ScopeOfWork: {
      deliverables: [
        { title: 'Architecture & Design', description: 'Solution architecture, data flow design, security model', hours: 24 },
        { title: 'Customer-Facing Agent', description: 'Order tracking, FAQs, returns processing agent', hours: 60 },
        { title: 'Internal Staff Agent', description: 'Product knowledge, policy queries, inventory lookups', hours: 40 },
        { title: 'CRM Integration', description: 'Bidirectional CRM sync for customer context', hours: 32 },
        { title: 'Testing & UAT', description: 'Comprehensive testing, performance tuning, UAT support', hours: 20 },
        { title: 'Training & Handover', description: 'Admin training, user guides, knowledge transfer', hours: 16 },
      ],
      exclusions: [
        'CRM system modifications or upgrades',
        'Hardware procurement',
        'Ongoing content management after handover',
      ],
    },
    PricingBreakdown: {
      lineItems: [
        { description: 'Architecture & Design (3 days)', quantity: 1, unitPrice: 24000, total: 24000 },
        { description: 'Customer-Facing Agent Development', quantity: 1, unitPrice: 48000, total: 48000 },
        { description: 'Internal Staff Agent Development', quantity: 1, unitPrice: 32000, total: 32000 },
        { description: 'CRM Integration', quantity: 1, unitPrice: 25600, total: 25600 },
        { description: 'Testing & UAT', quantity: 1, unitPrice: 16000, total: 16000 },
        { description: 'Training & Handover', quantity: 1, unitPrice: 12800, total: 12800 },
        { description: 'Azure AI Service Licenses (3 months)', quantity: 1, unitPrice: 18000, total: 18000 },
      ],
      subtotal: 176400,
      tax: 26460,
      discount: 22860,
      grandTotal: 180000,
    },
    Timeline: {
      phases: [
        { name: 'Foundation & Architecture', startWeek: 1, endWeek: 2, milestones: ['Architecture approved', 'Dev environment ready'] },
        { name: 'Customer Agent MVP', startWeek: 3, endWeek: 5, milestones: ['Agent prototype demo', 'FAQ knowledge base loaded'] },
        { name: 'Internal Agent + CRM', startWeek: 5, endWeek: 8, milestones: ['CRM integration complete', 'Internal agent ready'] },
        { name: 'Testing & Go-Live', startWeek: 9, endWeek: 10, milestones: ['UAT complete', 'Production deployment'] },
      ],
      totalWeeks: 10,
    },
    TeamComposition: {
      members: [
        { role: 'Solution Architect', name: 'Alice van der Merwe', responsibility: 'Architecture, CRM integration design' },
        { role: 'Technical Specialist', name: 'David Botha', responsibility: 'Copilot agent development, Azure AI configuration' },
        { role: 'Consultant', name: 'Priya Govender', responsibility: 'UAT coordination, training delivery' },
      ],
    },
    Terms: {
      paymentTerms: 'Payment is due within 30 days of invoice date. A 50% deposit is required before project commencement, with the remaining 50% due upon completion of each milestone phase.',
      warranty: 'Digital Workplace provides a 90-day warranty period following project delivery.',
      liability: "Digital Workplace's total liability under this agreement shall not exceed the total contract value.",
      confidentiality: 'Both parties agree to maintain the confidentiality of all proprietary information shared during the engagement.',
      ipOwnership: 'All custom-developed intellectual property created specifically for this engagement shall be owned by the Client upon full payment.',
      termination: 'Either party may terminate this agreement with 30 days written notice.',
    },
    ChangeControl: {
      process: 'All changes to the agreed scope of work must be submitted in writing via a formal Change Request (CR).',
      approvalLevels: [
        'Minor changes (< 8 hours impact): Project Manager approval',
        'Medium changes (8-40 hours impact): Client Sponsor + DW Account Manager approval',
        'Major changes (> 40 hours impact): Steering Committee approval with revised SOW',
      ],
      pricingImpact: 'Changes that increase scope will be priced at the agreed day rate. Rush requests may incur an additional 15% premium.',
    },
    Assumptions: [
      'Client provides API access to existing CRM system',
      'Azure OpenAI service available in client region',
      'Client designates product SMEs for knowledge base population',
      'Production deployment to existing M365 tenant',
    ],
    Risks: [
      { risk: 'CRM API limitations delay integration', impact: 'High', mitigation: 'Early API assessment in Week 1, fallback to manual sync', likelihood: 'Medium' },
      { risk: 'Low user adoption of internal agent', impact: 'Medium', mitigation: 'Champions program + gamified rollout plan', likelihood: 'Low' },
      { risk: 'Azure AI rate limits during peak usage', impact: 'Medium', mitigation: 'Implement caching and request throttling', likelihood: 'Low' },
    ],
    SigningPage: {
      clientSignatory: 'David Wilson',
      clientTitle: 'CTO',
      dwSignatory: 'Gary Finberg',
      dwTitle: 'Account Manager',
      proposedDate: getFutureDate(7),
    },
    ValidUntil: getFutureDate(21),
    SentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    ClientResponseDate: null,
    ClientFeedback: '',
    InternalNotes: 'Strong proposal — client expressed interest in Phase 2 expansion if Phase 1 succeeds.',
    DocumentUrl: '',
    CreatedByEmail: 'gary@firsttech.digital',
    CreatedByName: 'Gary Finberg',
    ApprovedByEmail: 'gary@firsttech.digital',
    ApprovedByName: 'Gary Finberg',
    ApprovedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    Created: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    Modified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 303,
    Title: 'Acme Corporation - Microsoft Viva Suite Proposal',
    ServiceRequestId: 106, // FunnelStage: Won
    Status: 'Accepted',
    Version: 1,
    ProposalType: 'Standard',
    TemplateName: 'DW Standard Proposal',
    ExecutiveSummary: {
      overview: 'Digital Workplace proposes the implementation of Microsoft Viva Suite for Acme Corporation, enabling enhanced employee engagement, learning, and workplace insights across the organization.',
      objectives: [
        'Deploy Viva Connections as the central employee hub',
        'Implement Viva Learning with custom content integration',
        'Configure Viva Insights for manager and employee wellbeing',
        'Establish adoption framework with success metrics',
      ],
      successCriteria: [
        'Viva Connections hub live within 4 weeks',
        '90% employee access to Viva Learning content',
        'Manager adoption of Viva Insights at 75% within 60 days',
      ],
    },
    SolutionOverview: {
      description: 'A full Microsoft Viva Suite deployment covering Connections, Learning, and Insights modules, integrated with Acme Corporation\'s existing M365 environment and HR systems.',
      approach: 'Phased rollout: Viva Connections (Week 1-2) → Viva Learning (Week 3-4) → Viva Insights (Week 5-6) → Adoption & Training (Week 7-8).',
      differentiators: [
        'Pre-built Viva Connections dashboard templates',
        'Custom learning path design expertise',
        'Change management framework included',
      ],
    },
    TechnologyStack: null,
    ScopeOfWork: {
      deliverables: [
        { title: 'Viva Connections Hub', description: 'Custom dashboard with company news, tasks, and resources', hours: 20 },
        { title: 'Viva Learning Configuration', description: 'Content providers, learning paths, and custom content', hours: 16 },
        { title: 'Viva Insights Setup', description: 'Manager and personal insights configuration', hours: 12 },
        { title: 'Training & Adoption', description: 'Admin and user training, adoption playbook', hours: 12 },
      ],
      exclusions: [
        'Content creation for Viva Learning',
        'HR system integrations beyond standard connectors',
      ],
    },
    PricingBreakdown: {
      lineItems: [
        { description: 'Viva Connections Hub (2.5 days)', quantity: 1, unitPrice: 20000, total: 20000 },
        { description: 'Viva Learning Configuration (2 days)', quantity: 1, unitPrice: 16000, total: 16000 },
        { description: 'Viva Insights Setup (1.5 days)', quantity: 1, unitPrice: 12000, total: 12000 },
        { description: 'Training & Adoption (1.5 days)', quantity: 1, unitPrice: 12000, total: 12000 },
      ],
      subtotal: 60000,
      tax: 9000,
      discount: 9000,
      grandTotal: 60000,
    },
    Timeline: {
      phases: [
        { name: 'Viva Connections', startWeek: 1, endWeek: 2, milestones: ['Dashboard live', 'Initial content populated'] },
        { name: 'Viva Learning', startWeek: 3, endWeek: 4, milestones: ['Learning paths configured', 'Content providers connected'] },
        { name: 'Viva Insights', startWeek: 5, endWeek: 6, milestones: ['Insights enabled for managers', 'Privacy settings confirmed'] },
        { name: 'Adoption & Training', startWeek: 7, endWeek: 8, milestones: ['Training sessions complete', 'Adoption playbook delivered'] },
      ],
      totalWeeks: 8,
    },
    TeamComposition: {
      members: [
        { role: 'Consultant', name: 'Priya Govender', responsibility: 'Lead deployment, training delivery' },
        { role: 'Technical Specialist', name: 'James Naidoo', responsibility: 'Technical configuration, integrations' },
      ],
    },
    Terms: {
      paymentTerms: 'Payment is due within 30 days of invoice date. A 50% deposit is required before project commencement.',
      warranty: 'Digital Workplace provides a 90-day warranty period following project delivery.',
      liability: "Digital Workplace's total liability under this agreement shall not exceed the total contract value.",
      confidentiality: 'Both parties agree to maintain the confidentiality of all proprietary information shared during the engagement.',
      ipOwnership: 'All custom-developed intellectual property created specifically for this engagement shall be owned by the Client upon full payment.',
      termination: 'Either party may terminate this agreement with 30 days written notice.',
    },
    ChangeControl: {
      process: 'All changes to the agreed scope of work must be submitted in writing via a formal Change Request (CR).',
      approvalLevels: [
        'Minor changes (< 8 hours impact): Project Manager approval',
        'Medium changes (8-40 hours impact): Client Sponsor + DW Account Manager approval',
      ],
      pricingImpact: 'Changes that increase scope will be priced at the agreed day rate.',
    },
    Assumptions: [
      'Client has Microsoft Viva licenses assigned to all users',
      'SharePoint Online configured as content hub',
      'Client designates Viva champions for adoption support',
    ],
    Risks: [
      { risk: 'Low employee adoption without executive sponsorship', impact: 'High', mitigation: 'Executive sponsor identified before kickoff + champions program', likelihood: 'Medium' },
    ],
    SigningPage: {
      clientSignatory: 'John Smith',
      clientTitle: 'VP of Technology',
      dwSignatory: 'Gary Finberg',
      dwTitle: 'Account Manager',
      proposedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    ValidUntil: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    SentDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    ClientResponseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    ClientFeedback: 'Looks great, happy to proceed. Please schedule kickoff.',
    InternalNotes: 'Client accepted quickly — strong relationship and competitive pricing.',
    DocumentUrl: '',
    CreatedByEmail: 'gary@firsttech.digital',
    CreatedByName: 'Gary Finberg',
    ApprovedByEmail: 'gary@firsttech.digital',
    ApprovedByName: 'Gary Finberg',
    ApprovedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    Created: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    Modified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// In-memory storage for test mode (allows CRUD operations during tests)
let testBookings = [...mockBookings];
let testClients = [...mockClients];
let testTeamMembers = [...mockTeamMembers];
let testAccountManagers = [...mockAccountManagers];
let testServiceRequests = [...mockServiceRequests];
let testProductRequests = [...mockProductRequests];
let testSpecialists = [...mockSpecialists];
let testProposals = [...mockProposals];
let nextBookingId = Math.max(...mockBookings.map((b) => b.Id)) + 1;
let nextClientId = Math.max(...mockClients.map((c) => c.Id)) + 1;
let nextServiceRequestId = Math.max(...mockServiceRequests.map((r) => r.Id)) + 1;
let nextProductRequestId = Math.max(...mockProductRequests.map((r) => r.Id)) + 1;
let nextSpecialistId = Math.max(...mockSpecialists.map((s) => s.Id)) + 1;
let nextProposalId = Math.max(...mockProposals.map((p) => p.Id)) + 1;

// Reset test data to initial state (useful between test runs)
export const resetTestData = (): void => {
  testBookings = [...mockBookings];
  testClients = [...mockClients];
  testTeamMembers = [...mockTeamMembers];
  testAccountManagers = [...mockAccountManagers];
  testServiceRequests = [...mockServiceRequests];
  testProductRequests = [...mockProductRequests];
  testSpecialists = [...mockSpecialists];
  testProposals = [...mockProposals];
  nextBookingId = Math.max(...mockBookings.map((b) => b.Id)) + 1;
  nextClientId = Math.max(...mockClients.map((c) => c.Id)) + 1;
  nextServiceRequestId = Math.max(...mockServiceRequests.map((r) => r.Id)) + 1;
  nextProductRequestId = Math.max(...mockProductRequests.map((r) => r.Id)) + 1;
  nextSpecialistId = Math.max(...mockSpecialists.map((s) => s.Id)) + 1;
  nextProposalId = Math.max(...mockProposals.map((p) => p.Id)) + 1;
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

// CRUD operations for test service requests
export const getTestServiceRequests = (): ServiceRequest[] => [...testServiceRequests];

export const getTestServiceRequestById = (id: number): ServiceRequest | undefined =>
  testServiceRequests.find((r) => r.Id === id);

export const createTestServiceRequest = (request: Omit<ServiceRequest, 'Id'>): ServiceRequest => {
  const newRequest: ServiceRequest = { ...request, Id: nextServiceRequestId++ };
  testServiceRequests.push(newRequest);
  return newRequest;
};

export const updateTestServiceRequest = (id: number, updates: Partial<ServiceRequest>): ServiceRequest | undefined => {
  const index = testServiceRequests.findIndex((r) => r.Id === id);
  if (index === -1) return undefined;
  testServiceRequests[index] = { ...testServiceRequests[index], ...updates };
  return testServiceRequests[index];
};

export const deleteTestServiceRequest = (id: number): boolean => {
  const index = testServiceRequests.findIndex((r) => r.Id === id);
  if (index === -1) return false;
  testServiceRequests.splice(index, 1);
  return true;
};

// CRUD operations for test product requests
export const getTestProductRequests = (): ProductRequest[] => [...testProductRequests];

export const getTestProductRequestById = (id: number): ProductRequest | undefined =>
  testProductRequests.find((r) => r.Id === id);

export const createTestProductRequest = (request: Omit<ProductRequest, 'Id'>): ProductRequest => {
  const newRequest: ProductRequest = { ...request, Id: nextProductRequestId++ };
  testProductRequests.push(newRequest);
  return newRequest;
};

export const updateTestProductRequest = (id: number, updates: Partial<ProductRequest>): ProductRequest | undefined => {
  const index = testProductRequests.findIndex((r) => r.Id === id);
  if (index === -1) return undefined;
  testProductRequests[index] = { ...testProductRequests[index], ...updates };
  return testProductRequests[index];
};

// CRUD operations for test specialists
export const getTestSpecialists = (): Specialist[] => [...testSpecialists];

export const getTestSpecialistById = (id: number): Specialist | undefined =>
  testSpecialists.find((s) => s.Id === id);

export const createTestSpecialist = (specialist: Omit<Specialist, 'Id'>): Specialist => {
  const newSpecialist: Specialist = { ...specialist, Id: nextSpecialistId++ };
  testSpecialists.push(newSpecialist);
  return newSpecialist;
};

export const updateTestSpecialist = (id: number, updates: Partial<Specialist>): Specialist | undefined => {
  const index = testSpecialists.findIndex((s) => s.Id === id);
  if (index === -1) return undefined;
  testSpecialists[index] = { ...testSpecialists[index], ...updates };
  return testSpecialists[index];
};

// CRUD operations for test proposals
export const getTestProposals = (): Proposal[] => [...testProposals];

export const getTestProposalById = (id: number): Proposal | undefined =>
  testProposals.find((p) => p.Id === id);

export const getTestProposalByServiceRequestId = (serviceRequestId: number): Proposal | undefined =>
  testProposals.find((p) => p.ServiceRequestId === serviceRequestId);

export const createTestProposal = (proposal: Omit<Proposal, 'Id'>): Proposal => {
  const newProposal: Proposal = { ...proposal, Id: nextProposalId++ };
  testProposals.push(newProposal);
  return newProposal;
};

export const updateTestProposal = (id: number, updates: Partial<Proposal>): Proposal | undefined => {
  const index = testProposals.findIndex((p) => p.Id === id);
  if (index === -1) return undefined;
  testProposals[index] = { ...testProposals[index], ...updates };
  return testProposals[index];
};

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
  console.log(`  - ${mockServiceRequests.length} service requests`);
  console.log(`  - ${mockProductRequests.length} product requests`);
  console.log(`  - ${mockSpecialists.length} specialists`);
  console.log(`  - ${mockProposals.length} proposals`);
  console.log('========================================');
}
