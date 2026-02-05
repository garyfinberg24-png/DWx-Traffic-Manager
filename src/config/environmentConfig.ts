/**
 * DWx Traffic Manager - Environment Configuration
 */
export const config = {
  // SharePoint Lists Configuration
  sharepoint: {
    siteUrl: import.meta.env.VITE_SHAREPOINT_SITE_URL || '',
    // Service Requests list (main entity)
    listName: import.meta.env.VITE_LIST_NAME || 'DWxServiceRequests',
    // Service Catalog list
    servicesListName: import.meta.env.VITE_SERVICES_LIST || 'DWxServices',
    // Clients list
    clientsListName: import.meta.env.VITE_CLIENTS_LIST || 'DWxClients',
    // Specialists list
    specialistsListName: import.meta.env.VITE_SPECIALISTS_LIST || 'DWxSpecialists',
    // Team Members list
    teamMembersListName: import.meta.env.VITE_TEAM_MEMBERS_LIST || 'DWxTeamMembers',
    // Account Managers list
    accountManagersListName: import.meta.env.VITE_ACCOUNT_MANAGERS_LIST || 'DWxAccountManagers',
    // Managers list (access control)
    managersListName: import.meta.env.VITE_MANAGERS_LIST || 'DWxManagers',
    // Audit Log list
    auditLogListName: import.meta.env.VITE_AUDIT_LOG_LIST || 'DWxAuditLog',
    // Product Requests list
    productRequestsListName: import.meta.env.VITE_PRODUCT_REQUESTS_LIST || 'DWxProductRequests',
    // Document library for uploads
    documentLibrary: import.meta.env.VITE_DOCUMENT_LIBRARY || 'DWxSupportingDocuments',
  },
  // Power Automate (optional - for Teams notifications)
  powerAutomate: {
    flowUrl: import.meta.env.VITE_POWER_AUTOMATE_URL || '',
  },
  // Calendar Configuration
  calendar: {
    // Pre-sales calendar for discovery meetings
    presalesEmail: import.meta.env.VITE_PRESALES_CALENDAR_EMAIL || '',
    // Legacy alias for compatibility
    demoEmail: import.meta.env.VITE_PRESALES_CALENDAR_EMAIL || import.meta.env.VITE_DEMO_CALENDAR_EMAIL || '',
  },
  // Azure AD Configuration
  azure: {
    clientId: import.meta.env.VITE_CLIENT_ID || '',
    tenantId: import.meta.env.VITE_TENANT_ID || '',
  },
  // Notification Settings
  notifications: {
    // Manager emails for notifications (comma-separated list in env var)
    managerEmails: (import.meta.env.VITE_MANAGER_EMAILS || '')
      .split(',')
      .map((email: string) => email.trim())
      .filter((email: string) => email.length > 0),
  },
  // Application Settings
  app: {
    name: import.meta.env.VITE_APP_NAME || 'DWx Traffic Manager',
    environment: import.meta.env.VITE_ENV || 'development',
    isDevelopment: import.meta.env.VITE_ENV === 'development',
  },
};

// Validate configuration
export function validateConfig(): { isValid: boolean; missing: string[] } {
  const required = [
    { key: 'VITE_CLIENT_ID', value: config.azure.clientId },
    { key: 'VITE_TENANT_ID', value: config.azure.tenantId },
    { key: 'VITE_SHAREPOINT_SITE_URL', value: config.sharepoint.siteUrl },
  ];

  const missing = required.filter((item) => !item.value).map((item) => item.key);

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}

// Log warning if Power Automate URL is not configured
export function checkPowerAutomateConfig(): boolean {
  if (!config.powerAutomate.flowUrl) {
    console.warn(
      'Power Automate Flow URL is not configured. Form submissions will not work until configured.'
    );
    return false;
  }
  return true;
}
