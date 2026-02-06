import { Configuration, LogLevel } from '@azure/msal-browser';
import { config } from './environmentConfig';

export const msalConfig: Configuration = {
  auth: {
    clientId: config.azure.clientId,
    // Use specific tenant ID for Teams SSO - more reliable than 'organizations'
    // External users can still be invited as guests to this tenant
    authority: `https://login.microsoftonline.com/${config.azure.tenantId}`,
    // Known authority for token validation
    knownAuthorities: ['login.microsoftonline.com'],
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    // Use localStorage for better persistence in Teams Desktop
    // sessionStorage can have issues in iframes
    cacheLocation: 'localStorage',
    // Enable cookies as fallback for cross-site scenarios in Teams
    storeAuthStateInCookie: true,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          case LogLevel.Info:
            if (config.app.isDevelopment) {
              console.info(message);
            }
            return;
          case LogLevel.Verbose:
            if (config.app.isDevelopment) {
              console.debug(message);
            }
            return;
          default:
            return;
        }
      },
      logLevel: config.app.isDevelopment ? LogLevel.Verbose : LogLevel.Warning,
    },
    // Increase iframe timeout for slower networks/SharePoint token acquisition
    iframeHashTimeout: 10000, // 10 seconds (default is 6 seconds)
    loadFrameTimeout: 10000, // 10 seconds for loading the iframe
  },
};

export const loginRequest = {
  scopes: ['User.Read'],
};

export const graphScopes = {
  // Include Sites.ReadWrite.All for SharePoint list operations via Graph API
  // Calendars.ReadWrite.Shared enables access to shared mailbox calendars (pre-sales calendar)
  // User.Invite.All enables inviting external/guest users to the tenant
  // User.Read.All enables listing all users in the tenant directory (for "Book on Behalf" and Entra ID browsing)
  scopes: [
    'User.Read',
    'User.Read.All',
    'Calendars.ReadWrite',
    'Calendars.ReadWrite.Shared',
    'Mail.Send',
    'Sites.ReadWrite.All',
    'User.Invite.All',
  ],
};
