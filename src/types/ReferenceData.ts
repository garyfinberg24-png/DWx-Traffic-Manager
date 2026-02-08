// Reference Data Types for TeamMembers, AccountManagers, and Clients

// ==================== ENTRA ID (Azure AD) USERS ====================

// User from Entra ID (Azure AD)
export interface EntraUser {
  id: string;
  displayName: string;
  mail: string | null;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
  businessPhones?: string[];
  photo?: string | null;
}

// ==================== ACCOUNT MANAGERS ====================

// Account Manager Status
export type AccountManagerStatus = 'Active' | 'Inactive' | 'On Leave';

export const ACCOUNT_MANAGER_STATUSES: AccountManagerStatus[] = [
  'Active',
  'Inactive',
  'On Leave',
];

// Account Manager Regions
export type AccountManagerRegion =
  | 'Western Cape'
  | 'Gauteng'
  | 'KZN'
  | 'UK';

export const ACCOUNT_MANAGER_REGIONS: AccountManagerRegion[] = [
  'Western Cape',
  'Gauteng',
  'KZN',
  'UK',
];

// Account Manager Source (internal or external)
export type AccountManagerSource = 'Internal' | 'External' | 'Guest';

export const ACCOUNT_MANAGER_SOURCES: AccountManagerSource[] = [
  'Internal',
  'External',
  'Guest',
];

// Account Manager Entity
export interface AccountManager {
  Id: number;
  Title: string; // Full Name
  Email: string;
  Phone?: string;
  MobilePhone?: string;
  Department?: string;
  JobTitle?: string;
  Region?: AccountManagerRegion;
  Status: AccountManagerStatus;
  Source: AccountManagerSource; // Whether AM is internal, external, or guest user
  EntraUserId?: string; // Azure AD Object ID for linking (if internal)
  ExternalTenant?: string; // External tenant name/domain if from another Entra
  Company?: string; // Company name (especially for external AMs)
  ManagerEmail?: string; // Reports to
  ClientCount?: number; // Number of assigned clients (computed)
  BookingCount?: number; // Number of bookings (computed)
  HireDate?: string;
  Notes?: string;
  Created?: string;
  Modified?: string;
}

// For creating/updating account managers
export interface AccountManagerInput {
  Title: string;
  Email: string;
  Phone?: string;
  MobilePhone?: string;
  Department?: string;
  JobTitle?: string;
  Region?: AccountManagerRegion;
  Status: AccountManagerStatus;
  Source: AccountManagerSource;
  EntraUserId?: string;
  ExternalTenant?: string;
  Company?: string;
  ManagerEmail?: string;
  HireDate?: string;
  Notes?: string;
}

// SharePoint list item for Account Managers
export interface AccountManagerSharePointItem {
  Id: number;
  Title: string;
  Email: string;
  Phone?: string;
  MobilePhone?: string;
  Department?: string;
  JobTitle?: string;
  Region?: string;
  Status: string;
  Source: string;
  EntraUserId?: string;
  ExternalTenant?: string;
  Company?: string;
  ManagerEmail?: string;
  HireDate?: string;
  Notes?: string;
  Created?: string;
  Modified?: string;
  __metadata?: {
    type: string;
    etag?: string;
  };
}

// ==================== TEAM MEMBERS ====================

// Team Member Roles (Account Manager removed - use Account Managers list instead)
export type TeamMemberRole =
  | 'Solution Architect'
  | 'Senior Developer'
  | 'Junior Developer'
  | 'SharePoint Engineer'
  | 'SPFx'
  | 'Power Platform'
  | 'Consultant'
  | 'Business Analyst'
  | 'QA Lead'
  | 'Designer'
  | 'Demo Specialist'
  | 'Implementer'
  | 'Project Manager'
  | 'Trainer'
  | 'Support';

export const TEAM_MEMBER_ROLES: TeamMemberRole[] = [
  'Solution Architect',
  'Senior Developer',
  'Junior Developer',
  'SharePoint Engineer',
  'SPFx',
  'Power Platform',
  'Consultant',
  'Business Analyst',
  'QA Lead',
  'Designer',
  'Demo Specialist',
  'Implementer',
  'Project Manager',
  'Trainer',
  'Support',
];

// Team Member Entity
export interface TeamMember {
  Id: number;
  Title: string; // Full Name
  Email: string;
  Phone?: string;
  Role: TeamMemberRole; // Primary role (for backwards compatibility)
  Roles?: TeamMemberRole[]; // Multiple roles (stored as comma-separated in SharePoint)
  IsActive: boolean;
  Created?: string;
  Modified?: string;
}

// For creating/updating team members
export interface TeamMemberInput {
  Title: string;
  Email: string;
  Phone?: string;
  Role: TeamMemberRole; // Primary role
  Roles?: TeamMemberRole[]; // Multiple roles
  IsActive: boolean;
}

// Client Contract Status
export type ClientContractStatus = 'Prospect' | 'Active' | 'Churned';

export const CLIENT_CONTRACT_STATUSES: ClientContractStatus[] = [
  'Prospect',
  'Active',
  'Churned',
];

// Industry Options
export type ClientIndustry =
  | 'Technology'
  | 'Finance'
  | 'Healthcare'
  | 'Manufacturing'
  | 'Retail'
  | 'Energy'
  | 'Government'
  | 'Education'
  | 'Other';

export const CLIENT_INDUSTRIES: ClientIndustry[] = [
  'Technology',
  'Finance',
  'Healthcare',
  'Manufacturing',
  'Retail',
  'Energy',
  'Government',
  'Education',
  'Other',
];

// Client Entity
export interface Client {
  Id: number;
  Title: string; // Company Name
  PrimaryContactName: string;
  PrimaryContactEmail: string;
  Phone?: string;
  Industry?: ClientIndustry;
  IsPremium: boolean;
  AccountManagerEmail?: string; // Links to TeamMember
  AccountManagerName?: string; // Denormalized for display
  ContractStatus: ClientContractStatus;
  BusinessUnit?: string; // Business unit for quoting (e.g., "Enterprise", "SMB", "Government")
  Notes?: string;
  Created?: string;
  Modified?: string;
}

// For creating/updating clients
export interface ClientInput {
  Title: string;
  PrimaryContactName: string;
  PrimaryContactEmail: string;
  Phone?: string;
  Industry?: ClientIndustry;
  IsPremium: boolean;
  AccountManagerEmail?: string;
  ContractStatus: ClientContractStatus;
  BusinessUnit?: string; // Business unit for quoting
  Notes?: string;
}

// SharePoint list item interfaces for API responses
export interface TeamMemberSharePointItem {
  Id: number;
  Title: string;
  Email: string;
  Phone?: string;
  Role: string;
  IsActive: boolean;
  Created?: string;
  Modified?: string;
  __metadata?: {
    type: string;
    etag?: string;
  };
}

export interface ClientSharePointItem {
  Id: number;
  Title: string;
  PrimaryContactName: string;
  PrimaryContactEmail: string;
  Phone?: string;
  Industry?: string;
  IsPremium: boolean;
  AccountManagerEmail?: string;
  AccountManagerName?: string;
  ContractStatus: string;
  BusinessUnit?: string;
  Notes?: string;
  Created?: string;
  Modified?: string;
  __metadata?: {
    type: string;
    etag?: string;
  };
}

// Dropdown option format for form selects
export interface DropdownOption {
  key: string;
  text: string;
}

// Helper functions to convert entities to dropdown options
export const teamMemberToDropdownOption = (member: TeamMember): DropdownOption => ({
  key: member.Email,
  text: `${member.Title} (${member.Role})`,
});

export const clientToDropdownOption = (client: Client): DropdownOption => ({
  key: client.Title,
  text: client.IsPremium ? `${client.Title} ★` : client.Title,
});

// Filter helpers
export const getDemoSpecialists = (members: TeamMember[]): TeamMember[] =>
  members.filter((m) => (m.Role === 'Demo Specialist' || m.Roles?.includes('Demo Specialist')) && m.IsActive);

export const getSupport = (members: TeamMember[]): TeamMember[] =>
  members.filter((m) => (m.Role === 'Support' || m.Roles?.includes('Support')) && m.IsActive);

export const getImplementers = (members: TeamMember[]): TeamMember[] =>
  members.filter((m) => (m.Role === 'Implementer' || m.Roles?.includes('Implementer')) && m.IsActive);

export const getProjectManagers = (members: TeamMember[]): TeamMember[] =>
  members.filter((m) => (m.Role === 'Project Manager' || m.Roles?.includes('Project Manager')) && m.IsActive);

export const getActiveClients = (clients: Client[]): Client[] =>
  clients.filter((c) => c.ContractStatus === 'Active');

export const getPremiumClients = (clients: Client[]): Client[] =>
  clients.filter((c) => c.IsPremium);

// Account Manager helpers
export const accountManagerToDropdownOption = (am: AccountManager): DropdownOption => ({
  key: am.Email,
  text: am.Region ? `${am.Title} (${am.Region})` : am.Title,
});

export const getActiveAccountManagers = (managers: AccountManager[]): AccountManager[] =>
  managers.filter((m) => m.Status === 'Active');

export const getAccountManagersByRegion = (
  managers: AccountManager[],
  region: AccountManagerRegion
): AccountManager[] => managers.filter((m) => m.Region === region && m.Status === 'Active');

// Entra User helper
export const entraUserToDropdownOption = (user: EntraUser): DropdownOption => ({
  key: user.mail || user.userPrincipalName,
  text: user.jobTitle ? `${user.displayName} (${user.jobTitle})` : user.displayName,
});
