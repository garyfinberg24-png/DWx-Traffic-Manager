# SharePoint Columns for Service Checklists (v2.13.0)

Service Checklists replaced the legacy LP Booking "Deployment Checklist" in v2.13.0. Checklists are now per-service templates managed in Admin, with per-deal copies for completion tracking.

## Architecture

| List | Column | Type | Purpose |
|------|--------|------|---------|
| `DWxServices` | `Checklist_JSON` | Note (Multi-line text) | Per-service checklist template |
| `DWxServiceRequests` | `DealChecklist_JSON` | Note (Multi-line text) | Per-deal checklist with completion tracking |

Both columns are provisioned automatically via the SP Provisioning tool in Admin > System > SP Provisioning.

## Template Checklist JSON Structure (DWxServices.Checklist_JSON)

```json
[
  {
    "id": "default_1",
    "label": "Tenant Access Confirmed",
    "description": "Client has granted admin/contributor access to the target M365 tenant.",
    "isRequired": true,
    "sortOrder": 1
  },
  {
    "id": "default_2",
    "label": "Business Requirements Documented",
    "description": "Functional requirements have been gathered and signed off by the client.",
    "isRequired": true,
    "sortOrder": 2
  }
]
```

### TypeScript Interface

```typescript
interface ServiceChecklistItem {
  id: string;
  label: string;
  description: string;
  isRequired: boolean;
  sortOrder: number;
}
```

## Deal Checklist JSON Structure (DWxServiceRequests.DealChecklist_JSON)

```json
[
  {
    "id": "default_1",
    "label": "Tenant Access Confirmed",
    "description": "Client has granted admin/contributor access to the target M365 tenant.",
    "isRequired": true,
    "sortOrder": 1,
    "isCompleted": true,
    "completedBy": "Gary Finberg",
    "completedAt": "2026-02-08T10:30:00.000Z"
  },
  {
    "id": "default_2",
    "label": "Business Requirements Documented",
    "description": "Functional requirements have been gathered and signed off by the client.",
    "isRequired": true,
    "sortOrder": 2,
    "isCompleted": false
  }
]
```

### TypeScript Interface

```typescript
interface DealChecklistItem extends ServiceChecklistItem {
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: string;
}
```

## Default Checklists (12 Service Categories)

Each service category has 5-8 default checklist items defined in `src/types/Checklist.ts` (`DEFAULT_SERVICE_CHECKLISTS`). These are used as fallback when a service has no custom checklist saved.

| Category | Items | Key Items |
|----------|-------|-----------|
| Power Platform | 6 | Tenant access, requirements, data sources, environment, security, licensing |
| SPFx Development | 6 | SP access, app catalog, dev environment, design specs, test plan, API perms |
| SharePoint Migration | 7 | Source audit, content inventory, user mapping, migration tool, rollback, comms, target site |
| M365 Assessment | 5 | Tenant admin access, scope, stakeholder interviews, documentation, secure score |
| Copilot Agents | 6 | Copilot licences, plugin permissions, compliance, test users, training, knowledge sources |
| MS Viva | 5 | Viva licences, dashboard design, home site, champions, success metrics |
| Training | 5 | Audience, topics, training environment, logistics, materials |
| Proposal | 5 | Client requirements, solution approach, pricing, template, review deadline |
| Tender | 7 | Tender document, compliance, submission deadline, response team, pricing, references, legal |
| Ad-Hoc Support | 4 | Issue description, access, priority, hours budget |
| SLA | 5 | SLA document, service hours, monitoring, escalation contacts, quarterly review |
| Strategic Advisory | 6 | Executive sponsor, current state, objectives, roadmap timeframe, workshop, budget |

## Workflow

1. **Admin manages templates**: Admin > Checklist tab > Select service category > Add/edit/reorder items > Save
2. **Auto-copy on deal creation**: When a deal is created via `ServiceRequestService.createRequest()`, the service's checklist template is copied to the deal as `DealChecklist_JSON`
3. **Completion tracking**: Specialist/manager checks off items in the deal's Checklist tab (RequestDetails.tsx)
4. **Progress bar**: Shows completion percentage (completed / total items)
5. **Required items**: Marked with asterisk; `ChecklistSummary.isComplete` is true only when all required items are done
6. **Read-only for terminal deals**: Won/Lost deals show checklist in read-only mode

## Related Files

| File | Purpose |
|------|---------|
| `src/types/Checklist.ts` | Type definitions + DEFAULT_SERVICE_CHECKLISTS + serialization helpers |
| `src/components/Admin/ChecklistManagement.tsx` | Admin template editor UI |
| `src/components/MyRequests/DealChecklist.tsx` | Deal-level checklist display |
| `src/components/MyRequests/RequestDetails.tsx` | Checklist tab integration |
| `src/services/ServiceCatalogService.ts` | `getServiceChecklist()` / `updateServiceChecklist()` |
| `src/services/ServiceRequestService.ts` | `createDealChecklist()` on create + `updateDealChecklist()` |
| `src/services/DWxSharePointProvisioningService.ts` | Column definitions for both lists |
