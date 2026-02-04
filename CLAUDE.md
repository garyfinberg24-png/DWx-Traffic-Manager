# DWx Traffic Manager - Agent Context

## Project Overview

**DWx Traffic Manager** is a Microsoft Teams application for Digital Workplace that serves as an intelligent traffic manager for pre-sales coordination, information gathering, and time scheduling. It enables Account Managers, Business Development Managers, and Sales Team members to book pre-sales sessions with technical specialists, manage a sales funnel, and track deal progression.

**Project Origin**: Cloned from LP Booking App (v1.7.5) - a production Teams app for License Pulse demo scheduling.

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

### Backend/Integration
- **Authentication**: MSAL (Microsoft Authentication Library) + Teams SSO
- **Data Storage**: SharePoint Online via Microsoft Graph API
- **Calendar Operations**: Microsoft Graph API
- **Email**: Microsoft Graph API

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
| Category | Choice | Power Platform, SPFx, Migrations, Assessment, Copilot, Viva |
| TypicalDuration | Choice | 30min, 1hr, 2hr, Half-day, Full-day, Multi-day |
| ComplexityLevel | Choice | Low, Medium, High, Enterprise |
| PricingModel | Choice | Fixed, Hourly, Project-based, TBD |
| BasePrice | Number | Starting price (ZAR) |
| RequiredRoles | Multi-line | JSON array of specialist roles |
| Prerequisites | Multi-line | Client requirements |
| IsActive | Yes/No | Currently offered |
| SortOrder | Number | Display order |
| IconName | Text | Fluent UI icon name |

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

## Project Structure

```text
DWx-Traffic-Manager/
├── src/
│   ├── components/
│   │   ├── LandingPage/             # NEW - Main entry point
│   │   │   ├── LandingPage.tsx      # Services/Products entry cards
│   │   │   └── index.ts
│   │   ├── ProductCatalog/          # NEW - DWx Product browsing
│   │   │   ├── ProductCatalog.tsx   # Tabbed view (Apps/WebParts/Cards)
│   │   │   └── index.ts
│   │   ├── ServiceCatalog/          # Service browsing
│   │   │   ├── ServiceCatalog.tsx   # Grid view of services
│   │   │   ├── ServiceCard.tsx      # Service display card
│   │   │   └── ServiceDetails.tsx   # Service modal
│   │   ├── ServiceRequest/          # Request creation (adapted from BookingForm)
│   │   │   └── ServiceRequestForm.tsx # Multi-step wizard
│   │   ├── MyRequests/              # Request list (adapted from MyBookings)
│   │   │   ├── MyRequests.tsx       # List with stage filtering
│   │   │   ├── RequestCard.tsx      # Request card with stage badge
│   │   │   └── RequestDetails.tsx   # Full request modal
│   │   ├── SalesFunnel/             # Sales funnel dashboard
│   │   │   ├── SalesFunnelDashboard.tsx
│   │   │   ├── FunnelChart.tsx
│   │   │   ├── PipelineKPIs.tsx
│   │   │   └── ConversionRatesCard.tsx
│   │   ├── Admin/                   # EXTENDED from LP Booking
│   │   │   ├── SharePointProvisioning.tsx # DWx list provisioning
│   │   │   └── ... (reused admin components)
│   │   ├── Common/                  # REUSED from LP Booking
│   │   └── LoginPage/               # REUSED from LP Booking
│   ├── services/
│   │   ├── ServiceCatalogService.ts     # NEW - Service CRUD
│   │   ├── ServiceRequestService.ts     # NEW - Funnel orchestration
│   │   ├── SpecialistService.ts         # NEW - Specialist management
│   │   ├── PipelineService.ts           # NEW - Analytics calculations
│   │   ├── AuthService.ts               # REUSED
│   │   ├── GraphService.ts              # EXTENDED for new lists
│   │   ├── AuditService.ts              # REUSED
│   │   ├── ManagerService.ts            # REUSED
│   │   ├── GuestInvitationService.ts    # REUSED
│   │   ├── NotificationService.ts       # EXTENDED for DW branding
│   │   └── ... (other reused services)
│   ├── contexts/
│   │   ├── AuthContext.tsx              # REUSED
│   │   ├── ServiceRequestContext.tsx    # NEW
│   │   └── ... (other reused contexts)
│   ├── types/
│   │   ├── ServiceRequest.ts            # Core DWx types
│   │   ├── Product.ts                   # NEW - Product catalog types (29 products)
│   │   └── ... (reused types)
│   ├── config/
│   │   ├── environmentConfig.ts         # UPDATED for DWx
│   │   └── msalConfig.ts                # REUSED
│   └── App.tsx                          # UPDATED with new routes
├── appPackage/
│   └── manifest.json                    # DWx Traffic Manager manifest
├── .env.local                           # DW tenant configuration
├── package.json                         # Updated app name
└── CLAUDE.md                            # This file
```

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
- [x] Initialize git repository
- [x] Create GitHub remote repository
- [x] Rebrand: App name to "DWx Traffic Manager"
- [x] Create TypeScript types (ServiceRequest.ts)
- [x] Update environment configuration

### Phase 2: Core Services - COMPLETE
- [x] ServiceCatalogService.ts - Service catalog CRUD with fallback defaults
- [x] ServiceRequestService.ts - Funnel orchestration with stage transitions
- [x] SpecialistService.ts - Specialist management and availability checking
- [x] PipelineService.ts - Dashboard metrics, win rates, conversion rates, forecasting

### Phase 3: UI Components - COMPLETE
- [x] LandingPage - Main entry point with Services/Products options
- [x] ProductCatalog - Tabbed view of DWx Apps (15), Web Parts (8), Adaptive Cards (6)
- [x] ServiceCatalog components (ServiceCatalog.tsx, ServiceCard.tsx, ServiceDetails.tsx)
- [x] ServiceRequestForm.tsx - 5-step wizard (Service → Client → Requirements → Schedule → Review)
- [x] MyRequests components (MyRequests.tsx, RequestCard.tsx, RequestDetails.tsx, StageProgressBar.tsx)
- [x] SalesFunnelDashboard (FunnelChart.tsx, PipelineKPIs.tsx, ConversionRatesCard.tsx, RequestsQueue.tsx)
- [ ] Admin components (ServiceManagement, SpecialistManagement) - PENDING

### Phase 4: Integration - COMPLETE
- [x] Update App.tsx with new routes (/, /services, /products, /request, /requests, /pipeline)
- [x] Update Header with new navigation (Services, New Request, My Requests, Pipeline)
- [x] SharePoint list provisioning UI for DWx lists (Admin → SharePoint Provisioning)
- [ ] Test mode configuration for E2E testing - PENDING
- [ ] Email notification templates (DW branding) - PENDING

### Phase 5: Deployment - IN PROGRESS
- [x] Azure Static Web Apps deployment configured
- [x] GitHub Actions CI/CD pipeline
- [ ] Azure AD app registration - PENDING
- [ ] SharePoint site and list provisioning in production - PENDING
- [ ] Teams app manifest and package - PENDING

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

## External Tenant Support

The app supports Account Managers from an external partner tenant:

1. **Guest User Flow**: Manager invites partner AM via GuestInvitationService
2. **Authentication**: Partner AM logs in via Teams SSO (guest auth)
3. **Tracking**: `AccountManagerTenant` field tracks "Internal" vs "External"
4. **Data Isolation**: Partner AMs see only their own requests

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/types/ServiceRequest.ts` | Core type definitions for all DWx entities |
| `src/types/Product.ts` | Product catalog types and data (29 products) |
| `src/services/ServiceCatalogService.ts` | Service catalog CRUD operations |
| `src/services/ServiceRequestService.ts` | Funnel workflow orchestration |
| `src/services/SpecialistService.ts` | Specialist management and availability |
| `src/services/PipelineService.ts` | Dashboard metrics and analytics |
| `src/config/environmentConfig.ts` | Environment configuration with DWx lists |
| `src/App.tsx` | Main app with DWx routes |
| `src/components/LandingPage/` | Main entry with Services/Products cards |
| `src/components/ProductCatalog/` | Tabbed product catalog (Apps, WebParts, Cards) |
| `src/components/ServiceCatalog/` | Service catalog UI (ServiceCatalog, ServiceCard, ServiceDetails) |
| `src/components/ServiceRequest/` | Request wizard (ServiceRequestForm) |
| `src/components/MyRequests/` | Request list (MyRequests, RequestCard, RequestDetails, StageProgressBar) |
| `src/components/SalesFunnel/` | Dashboard (SalesFunnelDashboard, FunnelChart, PipelineKPIs, ConversionRatesCard, RequestsQueue) |
| `src/components/Common/Header.tsx` | Navigation header with DWx branding |
| `mockups/` | HTML mockups for design reference |

## Confirmed Design Decisions

| Decision | Answer |
|----------|--------|
| **Partner Tenant** | Same as LP Booking (hallofd.com) - reuse guest invitation system |
| **Service Catalog** | 6 services: Power Platform, SPFx, Migrations, Assessment, Copilot, Viva |
| **Specialist Assignment** | Manager assigns only - specialists cannot self-assign |
| **Document Upload** | Full upload support - RFPs, requirements, proposals to SharePoint |
| **Currency** | ZAR (South African Rand) |

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

## Application Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/` | LandingPage | All users |
| `/services` | ServiceCatalog | All users |
| `/products` | ProductCatalog | All users |
| `/request` | ServiceRequestForm | All users |
| `/requests` | MyRequests | All users (own only) |
| `/pipeline` | SalesFunnelDashboard | Managers only |
| `/admin` | AdminPage | Managers only |
| `/admin/services` | ServiceManagement | Managers only |
| `/admin/specialists` | SpecialistManagement | Managers only |

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
