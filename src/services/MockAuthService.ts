/**
 * MockAuthService - Mock Authentication Service for E2E Testing
 *
 * This service mimics the AuthService interface but bypasses MSAL authentication.
 * Used when VITE_TEST_MODE=true to enable automated testing with TestSprite.
 */

import { User } from '../types';
import { getMockUser, mockAccessToken, isTestMode } from '../config/testModeConfig';

// Interface matching AuthService methods used by the application
export interface IAuthService {
  initialize(): Promise<void>;
  login(): Promise<void>;
  loginRedirect(): Promise<void>;
  logout(): Promise<void>;
  getToken(scopes: string[]): Promise<string>;
  getGraphToken(): Promise<string>;
  isAuthenticated(): boolean;
  getAccount(): unknown;
  getMsalInstance(): unknown;
  getUserProfile(): Promise<User>;
  getUserPhoto(): Promise<string | null>;
  revokeUserPhoto(): void;
}

class MockAuthService implements IAuthService {
  private initialized: boolean = false;
  private authenticated: boolean = false;

  constructor() {
    if (isTestMode) {
      console.log('[MockAuthService] Initialized in test mode');
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Simulate async initialization
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Auto-authenticate in test mode
    this.authenticated = true;
    this.initialized = true;

    console.log('[MockAuthService] Initialization complete - user auto-authenticated');
  }

  async login(): Promise<void> {
    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    this.authenticated = true;
    console.log('[MockAuthService] Mock login successful');
  }

  async loginRedirect(): Promise<void> {
    // In test mode, redirect login just sets authenticated state
    await new Promise((resolve) => setTimeout(resolve, 200));
    this.authenticated = true;
    console.log('[MockAuthService] Mock redirect login successful');
  }

  async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.authenticated = false;
    console.log('[MockAuthService] Mock logout successful');
  }

  async getToken(scopes: string[]): Promise<string> {
    if (!this.authenticated) {
      throw new Error('No authenticated account');
    }
    console.log('[MockAuthService] Returning mock token for scopes:', scopes);
    return mockAccessToken;
  }

  async getGraphToken(): Promise<string> {
    return this.getToken(['User.Read', 'Calendars.ReadWrite', 'Mail.Send']);
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  getAccount(): unknown {
    if (!this.authenticated) return null;

    const user = getMockUser();
    return {
      homeAccountId: user.id,
      localAccountId: user.id,
      username: user.email,
      name: user.displayName,
      tenantId: 'mock-tenant-id',
      environment: 'login.microsoftonline.com',
    };
  }

  getMsalInstance(): unknown {
    // Return a mock MSAL instance that won't break MsalProvider
    // This is a minimal mock that satisfies MsalProvider requirements
    return {
      initialize: async () => {},
      handleRedirectPromise: async () => null,
      getAllAccounts: () => (this.authenticated ? [this.getAccount()] : []),
      getActiveAccount: () => (this.authenticated ? this.getAccount() : null),
      setActiveAccount: () => {},
      acquireTokenSilent: async () => ({ accessToken: mockAccessToken }),
      acquireTokenPopup: async () => ({ accessToken: mockAccessToken }),
      loginPopup: async () => ({ account: this.getAccount() }),
      loginRedirect: async () => {},
      logoutPopup: async () => {},
      logoutRedirect: async () => {},
      // Event handling for MsalProvider
      addEventCallback: () => 'mock-callback-id',
      removeEventCallback: () => {},
      enableAccountStorageEvents: () => {},
      disableAccountStorageEvents: () => {},
      getConfiguration: () => ({
        auth: {
          clientId: 'mock-client-id',
          authority: 'https://login.microsoftonline.com/mock-tenant-id',
        },
      }),
    };
  }

  async getUserProfile(): Promise<User> {
    if (!this.authenticated) {
      throw new Error('No authenticated account');
    }
    return getMockUser();
  }

  async getUserPhoto(): Promise<string | null> {
    // Return a placeholder avatar URL for testing
    // Using a simple SVG data URI as placeholder
    const placeholderAvatar = `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <rect width="96" height="96" fill="#0078d4"/>
        <text x="48" y="60" font-family="Arial" font-size="40" fill="white" text-anchor="middle">
          ${getMockUser().displayName.charAt(0).toUpperCase()}
        </text>
      </svg>
    `)}`;

    return placeholderAvatar;
  }

  revokeUserPhoto(): void {
    // No-op in mock mode
    console.log('[MockAuthService] Mock photo URL revoked');
  }

  // Test-only method to force logout state (useful for testing login flows)
  _forceLogout(): void {
    this.authenticated = false;
  }

  // Test-only method to force login state
  _forceLogin(): void {
    this.authenticated = true;
  }
}

// Export singleton instance
export const mockAuthService = new MockAuthService();
