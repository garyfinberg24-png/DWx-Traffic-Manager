export const config = {
  sharepoint: {
    siteUrl: import.meta.env.VITE_SHAREPOINT_SITE_URL || '',
    listName: import.meta.env.VITE_LIST_NAME || 'LPDemoScheduler',
    documentLibrary: import.meta.env.VITE_DOCUMENT_LIBRARY || 'LPSupportingDocuments',
  },
  powerAutomate: {
    flowUrl: import.meta.env.VITE_POWER_AUTOMATE_URL || '',
  },
  calendar: {
    demoEmail: import.meta.env.VITE_DEMO_CALENDAR_EMAIL || '',
  },
  azure: {
    clientId: import.meta.env.VITE_CLIENT_ID || '',
    tenantId: import.meta.env.VITE_TENANT_ID || '',
  },
  notifications: {
    // Manager emails for notifications (comma-separated list in env var)
    managerEmails: (import.meta.env.VITE_MANAGER_EMAILS || '')
      .split(',')
      .map((email: string) => email.trim())
      .filter((email: string) => email.length > 0),
  },
  app: {
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
