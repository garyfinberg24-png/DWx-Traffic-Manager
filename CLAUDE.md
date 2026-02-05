# DWx Traffic Manager - Agent Context

## Project Overview

**DWx Traffic Manager** is a Microsoft Teams application for Digital Workplace that serves as an intelligent traffic manager for pre-sales coordination, information gathering, and time scheduling. It enables Account Managers, Business Development Managers, and Sales Team members to book pre-sales sessions with technical specialists, manage a sales funnel, and track deal progression.

**Project Origin**: Cloned from LP Booking App (v1.7.5) - a production Teams app for License Pulse demo scheduling.

**Current Version**: v2.5.0 (February 2026) - AI-powered Session Preparation

## Critical Configuration Values

### Azure AD App Registration

| Setting | Value |
|---------|-------|
| **Display Name** | DWx Traffic Manager |
| **Application (Client) ID** | `<to-be-configured>` |
| **Directory (Tenant) ID** | `<to-be-configured>` |

> **Security Note**: Client secrets should NEVER be stored in documentation or source code.
> Store secrets in `.env.local` (gitignored) or Azure Key Vault for production.

### SharePoint Configuration

| Setting | Value |
|---------|-------|
| **SharePoint Site URL** | `https://digitalworkplace.sharepoint.com/sites/DWxTrafficManager` |
| **Service Requests List** | `DWxServiceRequests` |
| **Services Catalog List** | `DWxServices` |
| **Clients List** | `DWxClients` |
| **Specialists List** | `DWxSpecialists` |
| **Team Members List** | `DWxTeamMembers` |
| **Account Managers List** | `DWxAccountManagers` |
| **Managers List** | `DWxManagers` |
| **Audit Log List** | `DWxAuditLog` |
| **Product Requests List** | `DWxProductRequests` |
| **Session Prep List** | `DWxSessionPrep` |
| **Document Library** | `DWxSupportingDocuments` |
| **Pre-Sales Calendar Email** | `presales@digitalworkplace.com` |

### GitHub Repository

| Setting | Value |
|---------|-------|
| **Repository URL** | `https://github.com/garyfinberg24-png/DWx-Traffic-Manager` |
| **Branch** | `master` |

## Technology Stack

### Frontend
- **Framework**: React 18.x with TypeScript
- **UI Library**: Fluent UI React v9
- **State Management**: React Context API + React Hook Form
- **Teams Integration**: Microsoft Teams JavaScript SDK (@microsoft/teams-js)
- **Build Tool**: Vite
- **Charts**: Recharts
- **Form Validation**: Yup + @hookform/resolvers
- **Spreadsheet**: xlsx (v0.18.5) for import/export

### Backend/Integration
- **Authentication**: MSAL (Microsoft Authentication Library) + Teams SSO
- **Data Storage**: SharePoint Online via Microsoft Graph API
- **Calendar Operations**: Microsoft Graph API
- **Email**: Microsoft Graph API
- **AI**: Azure OpenAI (GPT-4o) for session preparation content generation

### Infrastructure
- **IaC**: Bicep templates for Azure resource provisioning
- **AI Resources**: Azure OpenAI deployed via `infrastructure/azure-openai.bicep`

## Service Offerings (6 Categories)

Digital Workplace offers the following services through this app:

| Service | Category | Complexity | Description |
|---------|----------|------------|-------------|
| Power Platform Development | Power Platform | Medium | Custom Power Apps, Power Automate, Power BI |
| SPFx Development | SPFx Development | High | SharePoint Framework web parts, extensions, Teams apps |
| SharePoint Migration | SharePoint Migration | High | On-prem to cloud migrations |
| M365 Tenant Assessment | M365 Assessment | Medium | Security, compliance, governance review |
| Enterprise Copilot Agents | Copilot Agents | Enterprise | Custom Copilot plugins and agents |
| Microsoft Viva Suite | MS Viva | Medium | Viva Connections, Engage, Learning, Insights, Goals |

## Sales Funnel Workflow

### Funnel Stages (7 Stages)

```
Lead → Qualified → Discovery → Proposal → Negotiation → Won
  ↓        ↓           ↓           ↓           ↓
  └────────┴───────────┴───────────┴───────────┴────→ Lost
```

| Stage | Entry Trigger | Actions | Exit Criteria |
|-------|--------------|---------|---------------|
| **Lead** | Request submitted | Email confirmation to AM | AM validates interest |
| **Qualified** | AM confirms interest | Notify pre-sales team | Discovery scheduled |
| **Discovery** | Slot confirmed | Calendar event + Teams link | Meeting completed |
| **Proposal** | Discovery notes captured | Prepare proposal | Proposal sent |
| **Negotiation** | Client reviewing | Track engagement | Decision made |
| **Won** | Contract signed | Update client lifetime value | Terminal |
| **Lost** | Client declined | Capture reason, schedule follow-up | Terminal (can reopen) |

### Stage Transition Rules

```typescript
const STAGE_TRANSITIONS = {
  'Lead': ['Qualified', 'Lost'],
  'Qualified': ['Discovery', 'Lead', 'Lost'],
  'Discovery': ['Proposal', 'Qualified', 'Lost'],
  'Proposal': ['Negotiation', 'Discovery', 'Lost'],
  'Negotiation': ['Won', 'Lost', 'Proposal'],
  'Won': [],
  'Lost': ['Lead'], // Can reopen as new lead
};
```

### Assignment Workflow

**Manager assigns specialists only** - specialists cannot self-assign:

1. AM creates service request (enters Lead stage)
2. AM qualifies the lead (moves to Qualified)
3. Manager assigns specialist via AssignSpecialistDialog
4. Manager confirms discovery slot (moves to Discovery)
5. Calendar event created with Teams meeting link
6. After discovery, moves to Proposal stage

## SharePoint List Schemas

### DWxServiceRequests (Main Entity)

| Column | Type | Description |
|--------|------|-------------|
| Title | Text | Auto: "Client - Service" |
| ServiceId | Lookup | Link to DWxServices |
| ServiceName | Text | Denormalized service name |
| AccountManagerName | Text | AM display name |
| AccountManagerEmail | Text | AM email |
| AccountManagerTenant | Text | Internal/External |
| ClientName | Text | Company name |
| ClientId | Lookup | Link to DWxClients |
| ContactName | Text | Primary contact |
| ContactEmail | Text | Contact email |
| ContactPhone | Text | Contact phone |
| Industry | Choice | Technology, Finance, Healthcare, etc. |
| CompanySize | Choice | SMB, Medium, Large, Enterprise |
| **FunnelStage** | Choice | Lead, Qualified, Discovery, Proposal, Negotiation, Won, Lost |
| InterestLevel | Choice | Hot, Warm, Cold |
| DealValue | Number | Estimated revenue (ZAR) |
| DealProbability | Number | 0-100% |
| WeightedPipeline | Calculated | DealValue × Probability |
| ExpectedCloseDate | Date | Target close date |
| Budget | Text | Client's stated budget |
| Timeline | Text | Client's desired timeline |
| ProposedSlot1/2/3 | DateTime | Discovery time options |
| ConfirmedDateTime | DateTime | Confirmed meeting |
| CalendarEventId | Text | Graph event ID |
| AssignedSpecialistName | Text | Pre-sales resource |
| AssignedSpecialistEmail | Text | Specialist email |
| AssignedSpecialistRole | Choice | Solution Architect, Technical Specialist, Consultant |
| Requirements | Multi-line | RFP/requirements summary |
| ServiceHistory | Multi-line | Past engagement summary |
| WinLossReason | Text | Outcome explanation |
| NextSteps | Multi-line | Follow-up actions |
| Comments | Multi-line | Internal notes |

### DWxServices (Service Catalog)

| Column | Type | Description |
|--------|------|-------------|
| Title | Text | Service name |
| Description | Multi-line | Full description |
| ShortDescription | Text | 50-char tagline |
| Category | Choice | Power Platform, SPFx Development, SharePoint Migration, M365 Assessment, Copilot Agents, MS Viva, Training |
| TypicalDuration | Choice | 30min, 1hr, 2hr, Half-day, Full-day, Multi-day |
| ComplexityLevel | Choice | Low, Medium, High, Enterprise |
| PricingModel | Choice | Fixed, Hourly, Project-based, TBD |
| BasePrice | Number | Starting price (ZAR) |
| RequiredRoles | Multi-line | JSON array of specialist roles |
| Prerequisites | Multi-line | Client requirements |
| IsActive | Yes/No | Currently offered |
| SortOrder | Number | Display order |
| IconName | Text | Fluent UI icon name |
| **WhatsIncluded_JSON** | Note | JSON array of included items |
| **EngagementPhases_JSON** | Note | JSON array of {name, description} phases |
| **KeyBenefits_JSON** | Note | JSON array of benefits |
| **IdealFor_JSON** | Note | JSON array of ideal client profiles |
| **RelatedCategories_JSON** | Note | JSON array of related ServiceCategory values |

> **Note**: The 5 JSON columns (WhatsIncluded_JSON through RelatedCategories_JSON) store rich content for service detail pages. If empty, the app falls back to DEFAULT_SERVICES data in `src/types/ServiceRequest.ts`.

### DWxClients (Client Master Data)

| Column | Type | Description |
|--------|------|-------------|
| Title | Text | Company name |
| PrimaryContactName/Email | Text | Main contact |
| DecisionMakerName/Email | Text | Contract signer |
| Industry | Choice | Industry vertical |
| CompanySize | Choice | Size category |
| IsPremium | Yes/No | Priority status |
| AccountManagerEmail | Text | Assigned AM |
| EngagementCount | Number | Total past engagements |
| TotalRevenue | Number | Lifetime value |
| LastEngagementDate | Date | Most recent work |
| ContractStatus | Choice | Prospect, Active, Churned |

### DWxSpecialists (Pre-Sales Team)

| Column | Type | Description |
|--------|------|-------------|
| Title | Text | Full name |
| Email | Text | Email address |
| Role | Choice | Solution Architect, Technical Specialist, Consultant |
| Specializations | Multi-line | JSON array of service categories |
| MaxConcurrentDeals | Number | Capacity limit |
| CurrentDealCount | Number | Active assignments |
| IsActive | Yes/No | Available for assignment |
| CalendarEmail | Text | Calendar for availability |

### DWxTeamMembers

| Column | Type | Description |
|--------|------|-------------|
| Title | Text | Full name |
| Email | Text | Email address |
| Role | Text | Team role |
| Roles | Multi-line | JSON array of multiple roles |
| IsActive | Yes/No | Active status |
| Phone | Text | Phone number |

### DWxAccountManagers

| Column | Type | Description |
|--------|------|-------------|
| Title | Text | Full name |
| Email | Text | Email address |
| Region | Choice | Western Cape, Gauteng, KZN, UK |
| Status | Choice | Active, Inactive, On Leave |
| Source | Choice | Internal, External, Guest |
| EntraUserId | Text | Azure AD Object ID |
| Department | Text | Department |
| JobTitle | Text | Job title |

### DWxManagers (Access Control)

| Column | Type | Description |
|--------|------|-------------|
| Title | Text | Display name |
| Email | Text | Manager email |
| AddedBy | Text | Who added this manager |
| AddedDate | DateTime | When added |

### DWxSessionPrep (NEW v2.5.0)

| Column | Type | Description |
|--------|------|-------------|
| Title | Text | Auto: "Prep - {ClientName} - {Date}" |
| ServiceRequestId | Number | Link to DWxServiceRequests |
| SpecialistEmail | Text | Assigned specialist email |
| SpecialistName | Text | Assigned specialist name |
| Status | Choice | Not Started, In Progress, Ready |
| ClientProfile_JSON | Note | AI-generated client profile JSON |
| TalkingPoints_JSON | Note | AI-generated talking points JSON array |
| SuggestedResources_JSON | Note | AI-suggested resources JSON array |
| MeetingAgenda_JSON | Note | AI-generated meeting agenda JSON |
| ChecklistItems_JSON | Note | Preparation checklist JSON array |
| AIGeneratedAt | DateTime | When AI content was generated |
| CompletedAt | DateTime | When prep marked as Ready |
| ReminderSent | Yes/No | Whether reminder email sent |

### DWxAuditLog

| Column | Type | Description |
|--------|------|-------------|
| Title | Text | Action summary |
| Action | Choice | CREATE, UPDATE, DELETE, VIEW, APPROVE, REJECT, RESCHEDULE, LOGIN, LOGOUT |
| EntityType | Text | Booking, TeamMember, Client, Checklist, User, AccountManager, ServiceRequest, Service, Specialist, ProductRequest, SessionPrep |
| EntityId | Text | ID of affected entity |
| EntityName | Text | Human-readable entity name |
| PerformedBy | Text | User display name |
| PerformedByEmail | Text | User email |
| Timestamp | DateTime | When action occurred |
| Details | Multi-line | Action details |
| OldValues | Multi-line | JSON of previous values |
| NewValues | Multi-line | JSON of new values |

## Project Structure

```text
DWx-Traffic-Manager/
├── src/
│   ├── components/
│   │   ├── LandingPage/
│   │   │   ├── LandingPage.tsx          # Main entry with Services/Products cards
│   │   │   └── index.ts
│   │   ├── ProductCatalog/
│   │   │   ├── ProductCatalog.tsx        # Tabbed view (Apps/WebParts/Cards)
│   │   │   └── index.ts
│   │   ├── ProductRequest/
│   │   │   ├── ProductRequestForm.tsx    # Product demo/trial request form
│   │   │   └── index.ts
│   │   ├── ServiceCatalog/
│   │   │   ├── ServiceCatalog.tsx        # Grid view of services
│   │   │   ├── ServiceCard.tsx           # Service display card
│   │   │   ├── ServiceDetails.tsx        # Service quick-view modal
│   │   │   ├── ServiceDetailPage.tsx     # Full-page rich service detail view
│   │   │   └── index.ts
│   │   ├── ServiceRequest/
│   │   │   ├── ServiceRequestForm.tsx    # Multi-step request wizard
│   │   │   ├── ServiceRequirementsStep.tsx
│   │   │   ├── ProductRequirementsStep.tsx
│   │   │   └── index.ts
│   │   ├── MyRequests/
│   │   │   ├── MyRequests.tsx            # Request list with stage filtering + product request tab
│   │   │   ├── RequestCard.tsx           # Request card with stage badge
│   │   │   ├── RequestDetails.tsx        # Full service request details modal
│   │   │   ├── ProductRequestDetails.tsx # Full product request details modal (NEW v2.2.0)
│   │   │   ├── StageProgressBar.tsx      # Visual funnel stage progress
│   │   │   └── index.ts
│   │   ├── SalesFunnel/
│   │   │   ├── SalesFunnelDashboard.tsx  # Dashboard container
│   │   │   ├── FunnelChart.tsx           # Funnel visualization
│   │   │   ├── PipelineKPIs.tsx          # Pipeline metrics cards
│   │   │   ├── ConversionRatesCard.tsx   # Stage conversion metrics
│   │   │   ├── RequestsQueue.tsx         # Manager request queue
│   │   │   └── index.ts
│   │   ├── Dashboard/
│   │   │   ├── ManagerDashboard.tsx      # Dashboard with tabs
│   │   │   ├── KPICards.tsx              # KPI metric cards
│   │   │   ├── StatusChart.tsx           # Status pie chart
│   │   │   ├── TypeChart.tsx             # Type distribution
│   │   │   ├── TrendsChart.tsx           # Trends over time
│   │   │   ├── AccountManagerTable.tsx   # AM performance
│   │   │   ├── ClientTable.tsx           # Client bookings
│   │   │   ├── ApprovalQueue.tsx         # Manager approvals
│   │   │   ├── DashboardFilters.tsx      # Filter controls
│   │   │   ├── CalendarView.tsx          # Calendar (react-big-calendar)
│   │   │   ├── TimelineView.tsx          # Chronological timeline
│   │   │   ├── CommercialTab.tsx         # Commercial metrics
│   │   │   ├── ResourcesTab.tsx          # Resource allocation
│   │   │   ├── GamificationTab.tsx       # Gamification dashboard
│   │   │   └── index.ts
│   │   ├── Admin/
│   │   │   ├── AdminPage.tsx             # Admin tabbed container (10 tabs)
│   │   │   ├── TeamMemberList.tsx        # Team member CRUD
│   │   │   ├── TeamMemberForm.tsx        # Team member form dialog
│   │   │   ├── ClientList.tsx            # Client management
│   │   │   ├── ClientForm.tsx            # Client form dialog
│   │   │   ├── ImportClientsDialog.tsx   # XLSX client import
│   │   │   ├── ServiceManagement.tsx     # Service CRUD list
│   │   │   ├── ServiceForm.tsx           # 4-tab service form dialog
│   │   │   ├── ImportServicesDialog.tsx  # XLSX service import
│   │   │   ├── SpecialistManagement.tsx  # Specialist CRUD list (NEW)
│   │   │   ├── SpecialistForm.tsx        # Specialist form dialog (NEW)
│   │   │   ├── AccountManagerManagement.tsx # AM CRUD with Entra ID
│   │   │   ├── EntraUserPicker.tsx       # Entra ID user search
│   │   │   ├── ManagerSettings.tsx       # Manager access control
│   │   │   ├── GuestInvitations.tsx      # Guest user management
│   │   │   ├── ChecklistManagement.tsx   # Checklist management
│   │   │   ├── DocumentManagement.tsx    # Document management
│   │   │   ├── DWxSharePointProvisioning.tsx  # DWx list provisioning (Graph API)
│   │   │   └── index.ts
│   │   ├── Gamification/
│   │   │   ├── BadgeGrid.tsx             # Badge display
│   │   │   ├── BadgeIcon.tsx             # Badge icon component
│   │   │   ├── LeaderboardTable.tsx      # Leaderboard
│   │   │   ├── PointsTooltip.tsx         # Points explanation
│   │   │   ├── SetTargetsDialog.tsx      # Target setting
│   │   │   ├── TeamStatsCard.tsx         # Team statistics
│   │   │   └── index.ts
│   │   ├── SessionPrep/
│   │   │   ├── SessionPrepDialog.tsx     # Main session prep dialog with tabs
│   │   │   ├── ClientProfileView.tsx     # AI-generated client profile display
│   │   │   ├── TalkingPointsEditor.tsx   # Editable talking points by category
│   │   │   ├── ResourcePicker.tsx        # Suggested resources selector
│   │   │   ├── MeetingAgendaView.tsx     # AI-generated meeting agenda timeline
│   │   │   ├── PrepChecklist.tsx         # Pre-meeting checklist with completion tracking
│   │   │   └── index.ts
│   │   ├── Common/
│   │   │   ├── Header.tsx                # Navigation header
│   │   │   ├── ConfirmDialog.tsx         # Reusable confirm dialog
│   │   │   ├── ErrorBoundary.tsx         # Error boundary
│   │   │   ├── LoadingSpinner.tsx        # Loading indicator
│   │   │   ├── NotificationCenter.tsx    # Notifications
│   │   │   ├── UserGuide.tsx             # Onboarding guide
│   │   │   └── index.ts
│   │   ├── LoginPage/
│   │   │   ├── LoginPage.tsx             # Branded login
│   │   │   └── index.ts
│   │   └── MyBookings/
│   │       ├── BookingDetails.tsx        # Legacy booking details
│   │       └── index.ts
│   ├── services/
│   │   ├── ServiceCatalogService.ts      # Service CRUD with rich content JSON persistence
│   │   ├── ServiceRequestService.ts      # Funnel orchestration + stage transitions + updateDealInfo
│   │   ├── SpecialistService.ts          # Specialist management + availability + audit
│   │   ├── PipelineService.ts            # Dashboard metrics + analytics
│   │   ├── CommercialService.ts          # Commercial metrics
│   │   ├── GamificationService.ts        # Gamification logic
│   │   ├── DWxNotificationService.ts     # DW-branded notifications (18 methods)
│   │   ├── SessionPrepService.ts         # Session preparation CRUD + checklist management
│   │   ├── AIPreparationService.ts       # Azure OpenAI integration for AI content generation
│   │   ├── AuthService.ts                # MSAL authentication + Teams SSO
│   │   ├── GraphService.ts               # Microsoft Graph API
│   │   ├── AuditService.ts               # Change tracking (10 entity types)
│   │   ├── ProductRequestService.ts      # Product request CRUD + confirmProductDemo + specialist assignment
│   │   ├── ManagerService.ts             # Manager access CRUD
│   │   ├── AccountManagerService.ts      # AM CRUD operations
│   │   ├── ReferenceDataService.ts       # Clients/team members
│   │   ├── DashboardService.ts           # Dashboard metrics
│   │   ├── NotificationService.ts        # Email notifications
│   │   ├── DocumentService.ts            # Document library operations
│   │   ├── GuestInvitationService.ts     # Guest user management
│   │   ├── DWxSharePointProvisioningService.ts # DWx list provisioning (Graph API)
│   │   ├── SharePointService.ts          # SharePoint REST API
│   │   ├── EmailTemplates.ts             # Email template strings (22 templates)
│   │   ├── PowerAutomateService.ts       # Power Automate with retry/circuit breaker
│   │   ├── MockAuthService.ts            # Mock auth for E2E testing
│   │   ├── MockGraphService.ts           # Mock Graph for E2E testing
│   │   ├── serviceFactory.ts             # Conditional service injection (test/prod)
│   │   └── index.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx               # Authentication state
│   │   ├── NotificationContext.tsx        # Notification state
│   │   ├── TemplateContext.tsx            # Template management
│   │   ├── ToastContext.tsx              # Toast notifications
│   │   └── index.ts
│   ├── types/
│   │   ├── ServiceRequest.ts             # Core DWx types (DWService, DWServiceInput, ServiceCategory, FunnelStage, etc.)
│   │   ├── ProductRequest.ts             # Product request entity types
│   │   ├── SessionPreparation.ts         # Session prep types (NEW v2.5.0)
│   │   ├── Product.ts                    # Product catalog types (29 products)
│   │   ├── ProductRequirements.ts        # Product requirements form types
│   │   ├── ServiceRequirements.ts        # Service requirements types
│   │   ├── Commercial.ts                 # Commercial metrics types
│   │   ├── Gamification.ts               # Gamification types
│   │   ├── Dashboard.ts                  # Dashboard types
│   │   ├── Booking.ts                    # Legacy booking types
│   │   ├── User.ts                       # User types + FALLBACK_MANAGER_EMAILS
│   │   ├── ReferenceData.ts              # Team members, clients, AM types
│   │   ├── Checklist.ts                  # Checklist types
│   │   ├── Notification.ts               # Notification types
│   │   ├── Template.ts                   # Template types
│   │   ├── ApiResponses.ts               # API response types
│   │   └── index.ts
│   ├── config/
│   │   ├── environmentConfig.ts          # Environment config with all DWx list names
│   │   ├── msalConfig.ts                 # MSAL configuration
│   │   ├── testModeConfig.ts             # Mock data for E2E testing
│   │   └── index.ts
│   ├── utils/
│   │   ├── excelExport.ts                # Excel export utility
│   │   └── timezone.ts                   # Timezone utilities
│   ├── App.tsx                           # Main app with routes
│   ├── main.tsx                          # React entry point
│   └── vite-env.d.ts
├── docs/
│   ├── E2E_TEST_PLAN.md
│   ├── POWER_AUTOMATE_FLOW.md
│   ├── SHAREPOINT_CHECKLIST_COLUMNS.md
│   ├── SHAREPOINT_REFERENCE_LISTS.md
│   ├── SHAREPOINT_VIEW_FORMATTING.md
│   └── TEST_MODE.md
├── e2e/
│   └── MANUAL_E2E_TEST_PLAN.md
├── scripts/
│   └── MANUAL_COLUMNS.md
├── .env.local                            # DW tenant configuration (gitignored)
├── package.json
├── tsconfig.json
└── CLAUDE.md                             # This file
```

## Application Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/` | LandingPage | All users |
| `/services` | ServiceCatalog | All users |
| `/services/:serviceId` | ServiceDetailPage | All users |
| `/products` | ProductCatalog | All users |
| `/request` | ServiceRequestForm | All users |
| `/product-request` | ProductRequestForm | All users |
| `/requests` | MyRequests | All users (own only) |
| `/pipeline` | SalesFunnelDashboard | Managers only |
| `/dashboard` | ManagerDashboard | Managers only |
| `/admin` | AdminPage | Managers only |
| `/admin/account-managers` | AccountManagerManagement | Managers only |

## Admin Panel Tabs (10 Tabs)

| Tab | Component | Description |
|-----|-----------|-------------|
| Team Members | TeamMemberList | Team member CRUD with roles |
| Account Managers | AccountManagerManagement | AM CRUD with Entra ID picker |
| Clients | ClientList | Client management with XLSX import + orphan protection |
| Services | ServiceManagement | Service CRUD with rich content editing + XLSX import |
| **Specialists** | **SpecialistManagement** | **Specialist CRUD with workload tracking (NEW)** |
| Manager Access | ManagerSettings | Manager access control |
| Guest Invitations | GuestInvitations | Guest user management |
| Checklist | ChecklistManagement | Checklist management |
| Documents | DocumentManagement | Document management |
| SP Provisioning | DWxSharePointProvisioning | SharePoint list provisioning via Graph API |

## Environment Variables Template

Create a `.env.local` file with:

```env
# Azure AD Configuration
VITE_CLIENT_ID=<your-client-id-from-azure-portal>
VITE_TENANT_ID=<your-tenant-id-from-azure-portal>

# SharePoint Configuration
VITE_SHAREPOINT_SITE_URL=https://digitalworkplace.sharepoint.com/sites/DWxTrafficManager
VITE_LIST_NAME=DWxServiceRequests
VITE_SERVICES_LIST=DWxServices
VITE_CLIENTS_LIST=DWxClients
VITE_SPECIALISTS_LIST=DWxSpecialists
VITE_TEAM_MEMBERS_LIST=DWxTeamMembers
VITE_ACCOUNT_MANAGERS_LIST=DWxAccountManagers
VITE_MANAGERS_LIST=DWxManagers
VITE_AUDIT_LOG_LIST=DWxAuditLog
VITE_PRODUCT_REQUESTS_LIST=DWxProductRequests
VITE_DOCUMENT_LIBRARY=DWxSupportingDocuments

# Calendar
VITE_PRESALES_CALENDAR_EMAIL=presales@digitalworkplace.com

# Notification Recipients (comma-separated list)
VITE_MANAGER_EMAILS=manager1@dw.com,manager2@dw.com

# App Settings
VITE_APP_NAME=DWx Traffic Manager
VITE_ENV=development
```

## Required API Permissions

### Delegated Permissions
- Microsoft Graph: User.Read
- Microsoft Graph: Calendars.ReadWrite
- Microsoft Graph: Calendars.ReadWrite.Shared
- Microsoft Graph: Mail.Send
- Microsoft Graph: Sites.ReadWrite.All
- Microsoft Graph: User.Invite.All (for guest invitations)

### Application Permissions
- Microsoft Graph: User.Read.All
- Microsoft Graph: Calendars.ReadWrite

## Implementation Status

### Phase 1: Foundation - COMPLETE
- [x] Clone LP Booking App to new project folder
- [x] Initialize git repository and GitHub remote
- [x] Rebrand: App name to "DWx Traffic Manager"
- [x] Create TypeScript types (ServiceRequest.ts)
- [x] Update environment configuration with all DWx list names

### Phase 2: Core Services - COMPLETE
- [x] ServiceCatalogService.ts - Service catalog CRUD with rich content JSON persistence + fallback defaults
- [x] ServiceRequestService.ts - Funnel orchestration with stage transitions
- [x] SpecialistService.ts - Specialist management and availability checking
- [x] PipelineService.ts - Dashboard metrics, win rates, conversion rates, forecasting

### Phase 3: UI Components - COMPLETE
- [x] LandingPage - Main entry point with Services/Products options
- [x] ProductCatalog - Tabbed view of DWx Apps (15), Web Parts (8), Adaptive Cards (6)
- [x] ServiceCatalog components (ServiceCatalog.tsx, ServiceCard.tsx, ServiceDetails.tsx)
- [x] ServiceDetailPage - Full-page rich service detail view with all content sections
- [x] ServiceRequestForm.tsx - 5-step wizard (Service → Client → Requirements → Schedule → Review)
- [x] ProductRequestForm.tsx - Product demo/trial request form
- [x] MyRequests components (MyRequests.tsx, RequestCard.tsx, RequestDetails.tsx, StageProgressBar.tsx)
- [x] SalesFunnelDashboard (FunnelChart.tsx, PipelineKPIs.tsx, ConversionRatesCard.tsx, RequestsQueue.tsx)
- [x] ServiceManagement - Admin service CRUD list with search and category filter
- [x] ServiceForm - 4-tab form (Basic Info, Content, Engagement Phases, Relations)
- [x] ImportServicesDialog - XLSX/CSV import with template download and preview

### Phase 4: Integration - COMPLETE
- [x] Update App.tsx with all DWx routes
- [x] Update Header with navigation (Services, New Request, My Requests, Pipeline)
- [x] SharePoint list provisioning UI for all DWx lists via Graph API
- [x] Re-provision individual lists capability in admin UI
- [x] Service CRUD with audit logging in Admin panel

### Phase 5: Deployment - IN PROGRESS
- [x] Azure Static Web Apps deployment configured
- [x] GitHub Actions CI/CD pipeline
- [x] Azure AD app registration - COMPLETE
- [x] SharePoint site provisioned - COMPLETE
- [ ] Teams app manifest and package - DEFERRED (will do once app fully built/tested)
- [ ] Test mode configuration for E2E testing - DEFERRED (update testModeConfig.ts when starting E2E)
- [x] Email notification templates (DWx branding) - ALREADY IMPLEMENTED (DWxNotificationService.ts, NotificationService.ts, EmailTemplates.ts all DWx branded)

### Phase 6: 13-Issue Process Remediation - COMPLETE

Deep dive review found 13 process/logic dead ends. All 12 actionable issues fixed (Issue #6 was already implemented).

- [x] **#1 Product requests save to SharePoint** - Created `ProductRequestService.ts` + `ProductRequest.ts` types, wired `ProductRequestForm.tsx`
- [x] **#2 Client LTV updates on Won deals** - Moved LTV update into `updateStage()` for Won transitions
- [x] **#3 Calendar events cleaned up on Lost deals** - `handleStageTransitionActions` now deletes calendar events and clears `CalendarEventId`
- [x] **#4 Specialist admin UI** - Created `SpecialistManagement.tsx` + `SpecialistForm.tsx`, added Specialists tab to AdminPage
- [x] **#5 Specialist CRUD audit logging** - Added `auditService.logCreate/logUpdate` to `SpecialistService.ts`
- [x] ~~#6 Stage transitions audit logging~~ - Already implemented (found at `ServiceRequestService.ts:177-183`)
- [x] **#7 Service toggle audit logging** - Added `auditService.logUpdate` to `ServiceManagement.handleToggleActive()`
- [x] **#8 Orphan protection on entity deletion** - ClientList checks for active service requests before delete; SpecialistManagement warns on active deals
- [x] **#9 MyRequests shows product requests** - Added TabList with "Service Requests" and "Product Requests" tabs
- [x] **#10 Empty stage action handlers filled** - Won/Lost handlers decrement specialist deal counts; Lost cleans up calendar
- [x] **#11 Legacy LP code cleanup** - Deleted `BookingService.ts`, `SharePointProvisioningService.ts`, `SharePointProvisioning.tsx`; moved `ApprovalResult` to `types/Booking.ts`
- [x] **#12 MockGraphService DWx-aware** - Replaced `lpdemo` prefix check with DWx list name matching for all 10 lists
- [x] **#13 Route-level error boundaries** - Each `<Route>` in App.tsx wrapped with `<ErrorBoundary>`

### Phase 7: Deep Dive Assessment — Rounds 1-3 - COMPLETE (v2.2.0)

Comprehensive deep dive identified bugs, missing notifications, and enhancement opportunities organized into 4 rounds.

#### Round 1: Data Integrity Fixes (B1-B5) - COMPLETE

- [x] **B1: Specialist reassignment in ProductRequestService** - `assignSpecialist()` now tracks previous specialist and decrements their deal count on reassignment
- [x] **B2: Terminal status deal count decrement** - `updateStatus()` decrements specialist deal count when transitioning to Completed/Cancelled (with double-decrement guard)
- [x] **B3: Product demo calendar integration** - New `confirmProductDemo()` method creates calendar events via Graph API with Teams meeting, updates status to Confirmed
- [x] **B4: Calendar conflict false negatives** - `checkCalendarConflicts()` returns `error: true` on API failure instead of `{ hasConflict: false }`. ApprovalQueue shows yellow "Unknown" badge with tooltip
- [x] **B5: Weighted pipeline on DealValue update** - New `updateDealInfo()` method recalculates `WeightedPipeline = DealValue * (DealProbability / 100)` with audit logging

#### Round 2: Missing Notifications (N1-N6) - COMPLETE

7 new email templates in EmailTemplates.ts, 6 new methods in DWxNotificationService.ts:

- [x] **N1: Product specialist assignment notifications** - `sendProductSpecialistAssignedNotifications()` notifies AM + specialist
- [x] **N2: Specialist reassignment notice** - `notifySpecialistReassigned()` notifies previous specialist (generic for both entity types)
- [x] **N3: Manager visibility on product status** - `notifyProductRequestStatusChangedManagers()` sends to all configured managers
- [x] **N4: Deal value change alerts** - `notifyDealValueChanged()` with strikethrough previous values
- [x] **N5: Calendar failure escalation** - `notifyCalendarEventFailed()` with manual action checklist for managers
- [x] **N6: Specialist confirmed slot notification** - `notifyProductDemoConfirmedSpecialist()` with preparation checklist

Service integrations: ProductRequestService (N1, N2, N3, N5, N6), ServiceRequestService (N2, N4, N5)

#### Round 3: High-Priority Enhancements (H3 partial) - IN PROGRESS

- [x] **H3: Product Request Details Modal** - Created `ProductRequestDetails.tsx` with full details, status actions, specialist assignment, demo confirmation flow
- [x] **Clickable product cards** - Product request cards in MyRequests.tsx now clickable with hover effects, opens ProductRequestDetails modal
- [ ] H4: Product Request Approval Queue for managers
- [ ] H1: Request inline editing in RequestDetails.tsx
- [ ] H6: Product request status workflow UI
- [ ] H5: Quick-action context menus on cards

### Phase 8: AI-Powered Session Preparation (COMPLETE - v2.5.0)

When a discovery meeting is confirmed, the system automatically creates a session preparation record and guides specialists through meeting preparation using AI-generated content.

- [x] **SessionPreparation types** - Created `src/types/SessionPreparation.ts` with full type definitions
- [x] **SessionPrepService** - CRUD operations for DWxSessionPrep SharePoint list with checklist management
- [x] **AIPreparationService** - Azure OpenAI (GPT-4o) integration for generating:
  - Client profiles (industry context, engagement history, key stakeholders)
  - Talking points (opening, discovery, value proposition, objection handling, closing)
  - Suggested resources (slide decks, case studies, datasheets, demo scripts)
  - Meeting agendas (time-boxed items with descriptions)
- [x] **Session Prep UI Components**:
  - `SessionPrepDialog.tsx` - Main tabbed dialog (Profile, Talking Points, Resources, Agenda, Checklist)
  - `ClientProfileView.tsx` - AI-generated client profile display
  - `TalkingPointsEditor.tsx` - Editable talking points organized by category
  - `ResourcePicker.tsx` - Suggested resources with relevance scores and selection
  - `MeetingAgendaView.tsx` - Timeline view of meeting agenda items
  - `PrepChecklist.tsx` - Pre-meeting checklist with completion tracking
- [x] **Email notifications** - Added `sessionPrepCreated` and `sessionPrepReminder` templates
- [x] **Discovery integration** - `confirmDiscovery()` auto-creates session prep record
- [x] **Audit logging** - SessionPrep entity added to AuditService
- [x] **Infrastructure** - Bicep template for Azure OpenAI deployment (`infrastructure/azure-openai.bicep`)

**Session Prep Workflow:**

1. Manager confirms discovery slot → SessionPrep record created automatically
2. Specialist receives notification with link to prep dialog
3. Specialist clicks "Generate AI Content" → Azure OpenAI generates all content
4. Specialist reviews/edits talking points, selects resources, customizes agenda
5. Specialist completes checklist items (review client history, prepare demo, test equipment, etc.)
6. Status progresses: Not Started → In Progress → Ready
7. Reminder sent 24h before meeting if prep not complete

### Pending / Round 4

- [ ] Round 4: Medium-priority enhancements (M1-M10)
- [ ] Teams app manifest and package
- [ ] Test mode configuration update for E2E testing

## Key Type Definitions

### Service Categories
```typescript
type ServiceCategory =
  | 'Power Platform'
  | 'SPFx Development'
  | 'SharePoint Migration'
  | 'M365 Assessment'
  | 'Copilot Agents'
  | 'MS Viva';
```

### Service Durations
```typescript
type ServiceDuration = '30min' | '1hr' | '2hr' | 'Half-day' | 'Full-day' | 'Multi-day';
```

### Service Complexity
```typescript
type ServiceComplexity = 'Low' | 'Medium' | 'High' | 'Enterprise';
```

### Pricing Models
```typescript
type PricingModel = 'Fixed' | 'Hourly' | 'Project-based' | 'TBD';
```

### Funnel Stages
```typescript
type FunnelStage =
  | 'Lead'
  | 'Qualified'
  | 'Discovery'
  | 'Proposal'
  | 'Negotiation'
  | 'Won'
  | 'Lost';
```

### Interest Levels
```typescript
type InterestLevel = 'Hot' | 'Warm' | 'Cold';
```

### Specialist Roles
```typescript
type SpecialistRole = 'Solution Architect' | 'Technical Specialist' | 'Consultant';
```

### Audit Entities
```typescript
type AuditEntity =
  | 'Booking'
  | 'TeamMember'
  | 'Client'
  | 'Checklist'
  | 'User'
  | 'AccountManager'
  | 'ServiceRequest'
  | 'Service'
  | 'Specialist'
  | 'ProductRequest';
```

### Product Request Status Workflow
```typescript
type ProductRequestStatus = 'Pending Review' | 'Awaiting Approval' | 'Confirmed' | 'Completed' | 'Cancelled';

const STATUS_TRANSITIONS = {
  'Pending Review': ['Awaiting Approval', 'Cancelled'],
  'Awaiting Approval': ['Confirmed', 'Cancelled'],
  'Confirmed': ['Completed', 'Cancelled'],
  'Completed': [],
  'Cancelled': [],
};
```

### Key Service Methods (New in v2.2.0)

| Service | Method | Purpose |
|---------|--------|---------|
| ServiceRequestService | `updateDealInfo()` | Update DealValue/DealProbability + recalculate WeightedPipeline |
| ProductRequestService | `confirmProductDemo()` | Confirm demo slot, create calendar event, update status |
| ProductRequestService | `assignSpecialist()` | Assign/reassign specialist with deal count management |
| DWxNotificationService | `sendProductSpecialistAssignedNotifications()` | Notify AM + specialist of assignment |
| DWxNotificationService | `notifySpecialistReassigned()` | Notify previous specialist of reassignment |
| DWxNotificationService | `notifyDealValueChanged()` | Alert managers of deal value changes |
| DWxNotificationService | `notifyCalendarEventFailed()` | Escalate calendar failures to managers |
| DWxNotificationService | `notifyProductDemoConfirmedSpecialist()` | Notify specialist of confirmed slot |

## Service CRUD Architecture

### Rich Content Persistence

Services have rich content stored as JSON in SharePoint Note columns:

| TypeScript Field | SP Column | Format |
|-----------------|-----------|--------|
| `WhatsIncluded` | `WhatsIncluded_JSON` | `string[]` |
| `EngagementPhases` | `EngagementPhases_JSON` | `{name: string, description: string}[]` |
| `KeyBenefits` | `KeyBenefits_JSON` | `string[]` |
| `IdealFor` | `IdealFor_JSON` | `string[]` |
| `RelatedCategories` | `RelatedCategories_JSON` | `ServiceCategory[]` |

**Fallback Strategy**: If SP JSON columns are empty, `ServiceCatalogService.mapToService()` falls back to matching entry from `DEFAULT_SERVICES` constant in `ServiceRequest.ts`.

### ServiceForm Tabs

1. **Basic Info** - Title, descriptions, category, duration, complexity, pricing, prerequisites, active toggle
2. **Content** - WhatsIncluded, KeyBenefits, IdealFor (textarea, one item per line)
3. **Engagement Phases** - Repeater with useFieldArray (name + description per phase)
4. **Relations** - RequiredRoles multi-select, RelatedCategories multi-select

### Import Format (XLSX/CSV)

- Basic columns: Title, ShortDescription, Description, Category, TypicalDuration, ComplexityLevel, PricingModel, BasePrice, IconName, SortOrder, IsActive, Prerequisites
- Array columns use pipe delimiter: `"item1|item2|item3"`
- Engagement phases: `"Discovery:Requirements|Design:Architecture|Build:Development"`

## External Tenant Support

The app supports Account Managers from an external partner tenant:

1. **Guest User Flow**: Manager invites partner AM via GuestInvitationService
2. **Authentication**: Partner AM logs in via Teams SSO (guest auth)
3. **Tracking**: `AccountManagerTenant` field tracks "Internal" vs "External"
4. **Data Isolation**: Partner AMs see only their own requests

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/types/ServiceRequest.ts` | Core type definitions + DEFAULT_SERVICES with rich content |
| `src/types/Product.ts` | Product catalog types and data (29 products) |
| `src/types/ProductRequest.ts` | Product request entity types + status workflow |
| `src/services/ServiceCatalogService.ts` | Service catalog CRUD with JSON persistence |
| `src/services/ServiceRequestService.ts` | Funnel workflow orchestration + updateDealInfo |
| `src/services/ProductRequestService.ts` | Product request CRUD + confirmProductDemo + specialist assignment |
| `src/services/SpecialistService.ts` | Specialist management, availability, audit |
| `src/services/PipelineService.ts` | Dashboard metrics and analytics |
| `src/services/AuditService.ts` | Audit logging (10 entity types) |
| `src/services/DWxNotificationService.ts` | 18 notification methods (service + product + session prep events) |
| `src/services/EmailTemplates.ts` | 22 DW-branded email templates |
| `src/services/SessionPrepService.ts` | Session prep CRUD + checklist management + completion tracking |
| `src/services/AIPreparationService.ts` | Azure OpenAI integration for AI content generation |
| `src/types/SessionPreparation.ts` | Session prep types (status, checklist, talking points, resources, agenda) |
| `src/services/GraphService.ts` | Graph API + calendar conflict detection with error flag |
| `src/services/DWxSharePointProvisioningService.ts` | All DWx list provisioning via Graph API |
| `src/config/environmentConfig.ts` | Environment config with all 10 DWx list names |
| `src/App.tsx` | Main app with routes + route-level error boundaries |
| `src/components/Admin/AdminPage.tsx` | Admin container with 10 tabs |
| `src/components/Admin/ServiceManagement.tsx` | Service CRUD list UI |
| `src/components/Admin/ServiceForm.tsx` | 4-tab service form dialog |
| `src/components/Admin/SpecialistManagement.tsx` | Specialist CRUD list with workload tracking |
| `src/components/MyRequests/ProductRequestDetails.tsx` | Product request details modal with status actions |
| `src/components/ServiceCatalog/ServiceDetailPage.tsx` | Full-page service detail view |

## Confirmed Design Decisions

| Decision | Answer |
|----------|--------|
| **Partner Tenant** | Same as LP Booking (hallofd.com) - reuse guest invitation system |
| **Service Catalog** | 6 categories: Power Platform, SPFx, Migrations, Assessment, Copilot, Viva |
| **Specialist Assignment** | Manager assigns only - specialists cannot self-assign |
| **Document Upload** | Full upload support - RFPs, requirements, proposals to SharePoint |
| **Currency** | ZAR (South African Rand) |
| **Rich Content Storage** | JSON Note columns in SharePoint with DEFAULT_SERVICES fallback |
| **Service Import Format** | XLSX/CSV with pipe-delimited arrays |

## Product Catalog

The Product Catalog displays DWx offerings in three categories with tabbed navigation:

### DWx Apps (15 Products)

| Product | Category | Description |
|---------|----------|-------------|
| Asset Dashboard | Operations & IT | IT Asset Tracking & Management |
| Building Access | Operations & IT | Access Control & Building Management |
| Contract Manager | Document & Content | Contract Lifecycle Management |
| Employee Directory | HR & People | Staff Directory & Org Chart |
| Employee Onboarding | HR & People | New Hire Onboarding Portal |
| Feedback Hub | Learning & Engagement | Employee Feedback & Surveys |
| Incident Reporter | Operations & IT | Incident Reporting & Tracking |
| Knowledge Base | Document & Content | Enterprise Knowledge Management |
| Leave Manager | HR & People | Leave Requests & Tracking |
| License Pulse | Operations & IT | Software License Management |
| News Hub | Document & Content | Company News & Announcements |
| Org Chart | HR & People | Interactive Org Chart |
| Performance Hub | Learning & Engagement | Performance Reviews & Goals |
| Policy Manager | Document & Content | Policy Governance & Compliance |
| Training Portal | Learning & Engagement | Training & Certifications |

### SharePoint Web Parts (8 Products)

| Product | Category | Description |
|---------|----------|-------------|
| News Carousel | Intranet | News Slider & Announcements |
| Quick Links Grid | Navigation | Custom Quick Links Navigation |
| People Directory | HR & People | Employee Search & Profiles |
| Events Calendar | Intranet | Company Events & Holidays |
| Document Gallery | Intranet | Document Library Display |
| Announcements Banner | Intranet | Full-width Announcement Bar |
| Org Chart Web Part | HR & People | Interactive Org Chart Display |
| FAQ Accordion | Utilities | Collapsible FAQ Sections |

### Adaptive Cards (6 Products)

| Product | Category | Description |
|---------|----------|-------------|
| Leave Request | HR & People | Submit Leave in Teams |
| Approval Card | Workflows | Approval Actions in Chat |
| Incident Alert | Operations & IT | Incident Notifications |
| News Digest | Productivity | Daily News Summary |
| Training Reminder | Learning & Engagement | Training Due Notifications |
| Task Assignment | Workflows | Assign & Track Tasks |

### Product Type System

```typescript
type ProductType = 'app' | 'webpart' | 'adaptive-card';

interface Product {
  id: string;
  name: string;
  subtitle: string;
  type: ProductType;
  category: string;
  version: string;
  brand: string;
  icon: string;
  gradient: string;  // CSS gradient name
}
```

## Dashboard KPIs

| KPI | Calculation |
|-----|-------------|
| Total Pipeline | SUM(DealValue) where stage not Won/Lost |
| Weighted Pipeline | SUM(DealValue × Probability) |
| Win Rate | Won / (Won + Lost) × 100 |
| Avg Deal Size | Total Won Revenue / Won Count |
| Avg Sales Cycle | AVG(Days from Lead to Won) |
| Lead → Qualified | Qualified Count / Lead Count × 100 |
| Hot Leads | COUNT where InterestLevel = Hot |

## Document Upload Feature

Documents are uploaded to `DWxSupportingDocuments` library:

```
DWxSupportingDocuments/
├── {RequestId}/
│   ├── RFPs/
│   ├── Requirements/
│   ├── Proposals/
│   └── Other/
```

**Supported file types**: PDF, DOCX, XLSX, PPTX

## Recent Commit History

```
824fb9a feat: AI-powered session preparation with Azure OpenAI integration (v2.5.0)
835fd53 feat: Deep dive R1-R3 — data integrity fixes, notifications, product request details modal (v2.2.0)
0f96927 feat: Fix broken chains, add product request notifications, frost grey accordion style (v2.1.0)
6c4d547 feat: 13-issue process remediation - fix dead ends, add specialist admin, cleanup legacy code
86e0e24 style: Redesign service request form with V6 accordion + tab layout
58e7bc8 docs: Update CLAUDE.md and create SESSION_STATE.md for agent handoff
432e0e3 feat: Add Service CRUD management with spreadsheet import to Admin panel
af822fc fix: Role selector validation not triggering on selection
b841a82 feat: Add Re-provision button for individual lists in admin UI
519244e fix: Always show Provision All Lists button in admin UI
2da7cd7 fix: Rename LPManagers to DWxManagers and add to provisioning
```
