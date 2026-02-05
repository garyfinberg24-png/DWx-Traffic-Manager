# DWx Traffic Manager - Session State

> Last updated: 2026-02-05
> Last commit: `432e0e3` feat: Add Service CRUD management with spreadsheet import to Admin panel

## Current State Summary

The DWx Traffic Manager is a fully functional React/TypeScript Teams app with:

- **10 SharePoint lists** all properly provisioned via Graph API
- **Full service catalog** with 6 service categories, rich content detail pages, and admin CRUD
- **Sales funnel** with 7 stages (Lead through Won/Lost)
- **Product catalog** with 29 products across 3 types (Apps, Web Parts, Adaptive Cards)
- **Admin panel** with 9 tabs covering all entity management
- **Build status**: Clean - `npx tsc --noEmit` and `npm run build` both pass

## What Was Just Completed (This Session)

### 1. Role Selection Validation Fix (commit `af822fc`)

Fixed a bug in `TeamMemberForm.tsx` where role chips appeared visually selected but react-hook-form validation didn't recognize them. Root cause: `setValue` calls missing `{ shouldValidate: true }`.

### 2. Service CRUD Management + Spreadsheet Import (commit `432e0e3`)

Full implementation of service CRUD in the Admin panel. This was an 8-step implementation:

**Backend changes (3 files modified):**

- `DWxSharePointProvisioningService.ts` - Added 5 JSON Note columns (WhatsIncluded_JSON, EngagementPhases_JSON, KeyBenefits_JSON, IdealFor_JSON, RelatedCategories_JSON). Fixed Category choices from abbreviated to full TypeScript type names. Updated seed data to include rich content.
- `ServiceCatalogService.ts` - Updated createService/updateService to write rich content JSON. Added deleteService method. Updated mapToService to read from SP JSON columns first, falling back to DEFAULT_SERVICES.
- `AuditService.ts` - Added 'Service' to AuditEntity type union.

**New components (3 files created):**

- `ServiceManagement.tsx` - Admin list component with search, category filter, table with CRUD actions (edit, activate/deactivate, delete), audit logging, toast notifications.
- `ServiceForm.tsx` - 4-tab dialog form: Basic Info, Content (textareas with one-item-per-line), Engagement Phases (repeater via useFieldArray), Relations (multi-select chips). Uses react-hook-form + yup.
- `ImportServicesDialog.tsx` - XLSX/CSV import with template download, preview validation, progress tracking. Uses pipe-delimited format for arrays.

**Integration (2 files modified):**

- `AdminPage.tsx` - Added "Services" tab (9th tab, positioned between Clients and Manager Access).
- `Admin/index.ts` - Added exports for ServiceManagement, ServiceForm, ImportServicesDialog.

## What Was NOT Done / Still Pending

### High Priority

- [ ] **Azure AD app registration** - No Azure AD app configured for DWx yet
- [ ] **SharePoint site provisioning** - Production SP site not yet created
- [ ] **Teams app manifest** - No Teams manifest package created for DWx
- [ ] **Test mode for E2E testing** - testModeConfig.ts exists but not updated for DWx entities

### Medium Priority

- [ ] **Email notification templates** - DW-branded notification emails not fully implemented
- [ ] **SpecialistManagement admin UI** - No admin CRUD for specialists (specialists are managed but no dedicated admin tab)
- [ ] **Service Detail Page edit button** - ServiceDetailPage shows rich content but doesn't have a direct "Edit" link to admin

### Low Priority / Nice-to-Have

- [ ] **Teams Adaptive Card notifications** - Requires Power Automate flow
- [ ] **Mobile experience optimization**
- [ ] **Code splitting** - Bundle is 3MB (Vite warns about chunk size)

## Architecture Notes for Next Agent

### Key Patterns

1. **Service Factory**: All services are created via `serviceFactory.ts` which checks `isTestMode()` and returns mock or real implementations.

2. **Admin Component Pattern**: Admin CRUD components follow a consistent pattern:
   - `*List.tsx` or `*Management.tsx` - Table with search/filter + action menus
   - `*Form.tsx` - Dialog form with react-hook-form + yup validation
   - `Import*Dialog.tsx` - XLSX import with 3 phases (upload, preview, import)
   - All use `ConfirmDialog` for destructive actions
   - All integrate with `auditService` for change tracking
   - All use `useToast()` for success/error notifications

3. **Rich Content Fallback**: `ServiceCatalogService.mapToService()` reads JSON columns from SharePoint first, then falls back to matching `DEFAULT_SERVICES` by title. This means the app works even before SP columns are populated.

4. **SharePoint Provisioning**: `DWxSharePointProvisioning.tsx` creates all 10 lists via Graph API. Each list has a "Re-provision" button to add missing columns to existing lists.

5. **List Name Config**: All 10 SharePoint list names are configured in `environmentConfig.ts` with env var overrides and sensible defaults (DWx-prefixed).

### File Naming Conventions

- Services: `src/services/{EntityName}Service.ts`
- Types: `src/types/{Domain}.ts`
- Components: `src/components/{Feature}/{ComponentName}.tsx`
- Each component folder has an `index.ts` barrel export

### Known Quirks

- The project still has some legacy LP Booking code (BookingService.ts, SharePointProvisioningService.ts, MyBookings/) that hasn't been fully removed
- `SharePointProvisioning.tsx` (old LP version) coexists with `DWxSharePointProvisioning.tsx` (new Graph API version)
- The `yupResolver` in ServiceForm.tsx uses `as any` cast due to TypeScript generic inference issues between yup and react-hook-form

## Recent Commit History

```text
432e0e3 feat: Add Service CRUD management with spreadsheet import to Admin panel
af822fc fix: Role selector validation not triggering on selection
b841a82 feat: Add Re-provision button for individual lists in admin UI
519244e fix: Always show Provision All Lists button in admin UI
2da7cd7 fix: Rename LPManagers to DWxManagers and add to provisioning
9c42bb0 fix: Add DWxTeamMembers and DWxAccountManagers to provisioning UI
b16887c fix: Use DWx-prefixed list names and add missing list provisioning
4e9a861 feat: Add full-page service detail view with rich content
8450fc0 fix: Rewrite SP provisioning to use Graph API, reinstate admin tab
e425dbd style: Standardize page layout with 64px horizontal padding
3f6ea80 feat: Add PowerShell provisioning scripts, remove in-app provisioning
962f1cc feat: Add DWxProductRequests list to SharePoint provisioning
```

## Quick Start for New Agent

1. Working directory: `c:\Projects\DWx-Traffic-Manager`
2. Read `CLAUDE.md` for full project context
3. Run `npm run build` to verify clean state
4. Key entry points:
   - `src/App.tsx` - Routes and providers
   - `src/components/Admin/AdminPage.tsx` - Admin panel (9 tabs)
   - `src/config/environmentConfig.ts` - All SP list names and config
   - `src/types/ServiceRequest.ts` - Core types + DEFAULT_SERVICES data
   - `src/services/DWxSharePointProvisioningService.ts` - All list schemas
