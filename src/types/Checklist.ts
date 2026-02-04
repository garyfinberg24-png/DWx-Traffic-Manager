// Deployment Readiness Checklist Types
// Required to be completed 3 days before a Trial Deployment booking

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: string;
}

export interface DeploymentChecklist {
  bookingId: number;
  clientName: string;
  deploymentDate: string;
  dueDate: string; // 3 days before deployment
  isOverdue: boolean;
  isComplete: boolean;
  completedCount: number;
  totalCount: number;
  items: ChecklistItem[];
  lastUpdated?: string;
  lastUpdatedBy?: string;
}

// Default checklist items for Trial Deployment
export const DEFAULT_CHECKLIST_ITEMS: Omit<ChecklistItem, 'isCompleted' | 'completedBy' | 'completedAt'>[] = [
  {
    id: 'bom',
    label: 'Bill of Materials Available',
    description: 'The Bill of Materials (BOM) document has been prepared and is available for the deployment team.',
  },
  {
    id: 'licenses',
    label: 'Licenses Provisioned',
    description: 'All required licenses have been provisioned for the client environment.',
  },
  {
    id: 'service_account',
    label: 'Service Account Provisioned',
    description: 'The service account has been created and configured with appropriate permissions.',
  },
  {
    id: 'environment',
    label: 'Environment Created',
    description: 'The deployment environment (dev/test/prod) has been set up and configured.',
  },
  {
    id: 'powerbi_workspace',
    label: 'Power BI Workspace Created',
    description: 'The Power BI workspace has been created and access has been granted to relevant users.',
  },
];

// Checklist status for display
export type ChecklistStatus = 'pending' | 'in_progress' | 'complete' | 'overdue';

export const getChecklistStatus = (checklist: DeploymentChecklist): ChecklistStatus => {
  if (checklist.isComplete) return 'complete';
  if (checklist.isOverdue) return 'overdue';
  if (checklist.completedCount > 0) return 'in_progress';
  return 'pending';
};

// Helper to create a new checklist from booking
export const createChecklistFromBooking = (
  bookingId: number,
  clientName: string,
  deploymentDate: string
): DeploymentChecklist => {
  const depDate = new Date(deploymentDate);
  const dueDate = new Date(depDate);
  dueDate.setDate(dueDate.getDate() - 3); // 3 days before deployment

  const items: ChecklistItem[] = DEFAULT_CHECKLIST_ITEMS.map((item) => ({
    ...item,
    isCompleted: false,
  }));

  return {
    bookingId,
    clientName,
    deploymentDate,
    dueDate: dueDate.toISOString(),
    isOverdue: new Date() > dueDate,
    isComplete: false,
    completedCount: 0,
    totalCount: items.length,
    items,
  };
};

// Serialize checklist items to JSON string for SharePoint storage
export const serializeChecklistItems = (items: ChecklistItem[]): string => {
  return JSON.stringify(items);
};

// Deserialize checklist items from SharePoint JSON string
export const deserializeChecklistItems = (json: string | null): ChecklistItem[] => {
  if (!json) {
    return DEFAULT_CHECKLIST_ITEMS.map((item) => ({
      ...item,
      isCompleted: false,
    }));
  }
  try {
    return JSON.parse(json);
  } catch {
    return DEFAULT_CHECKLIST_ITEMS.map((item) => ({
      ...item,
      isCompleted: false,
    }));
  }
};
