import {
  PublicClientApplication,
  AccountInfo,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';
import * as microsoftTeams from '@microsoft/teams-js';
import { msalConfig, loginRequest, graphScopes } from '../config/msalConfig';
import { User } from '../types';

class AuthService {
  private msalInstance: PublicClientApplication;
  private account: AccountInfo | null = null;
  private initialized: boolean = false;
  private userPhotoUrl: string | null = null;
  private isTeamsEnvironment: boolean = false;
  private teamsInitialized: boolean = false;

  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig);
  }

  // Initialize Teams SDK and detect if running in Teams
  private async initializeTeams(): Promise<boolean> {
    if (this.teamsInitialized) {
      return this.isTeamsEnvironment;
    }

    try {
      await microsoftTeams.app.initialize();
      this.isTeamsEnvironment = true;
      this.teamsInitialized = true;
      console.log('Teams SDK initialized successfully');
      return true;
    } catch {
      this.isTeamsEnvironment = false;
      this.teamsInitialized = true;
      console.log('Not running in Teams environment');
      return false;
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Try to initialize Teams SDK first
    await this.initializeTeams();

    await this.msalInstance.initialize();

    // Handle redirect response (for non-Teams browser flow)
    const response = await this.msalInstance.handleRedirectPromise();
    if (response) {
      this.account = response.account;
      this.msalInstance.setActiveAccount(this.account);
    } else {
      // Check for existing account
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        this.account = accounts[0];
        this.msalInstance.setActiveAccount(this.account);
      }
    }

    this.initialized = true;

    // If user is already authenticated, pre-acquire tokens silently
    if (this.account) {
      try {
        // Pre-acquire Graph token
        await this.getGraphToken();
        console.debug('Graph token pre-acquired during initialization');
      } catch (error) {
        console.warn('Failed to pre-acquire Graph token:', error);
      }

    }
  }

  async login(): Promise<void> {
    try {
      // In Teams, use Teams SSO to get an access token directly
      if (this.isTeamsEnvironment) {
        console.log('Using Teams SSO authentication flow');
        await this.loginWithTeamsSso();
        return;
      }

      // Outside Teams, use standard MSAL popup
      const response = await this.msalInstance.loginPopup(loginRequest);
      this.account = response.account;
      this.msalInstance.setActiveAccount(this.account);

    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Authentication failed. Please try again.');
    }
  }

  // Teams SSO authentication - uses Teams SDK to get token directly
  private async loginWithTeamsSso(): Promise<void> {
    // Step 1: Get Teams SSO token
    let loginHint: string;

    try {
      console.log('Starting Teams SSO authentication...');
      const teamsToken = await microsoftTeams.authentication.getAuthToken();
      console.log('Teams SSO token obtained successfully');

      // Decode the JWT to get the user info (for loginHint)
      const tokenParts = teamsToken.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      loginHint = payload.preferred_username || payload.upn || payload.email;
      const userOid = payload.oid;
      const userTid = payload.tid;

      console.log('Teams token decoded - User:', loginHint, 'OID:', userOid, 'TID:', userTid);
    } catch (teamsError: unknown) {
      const errorDetails = teamsError instanceof Error ? teamsError.message : String(teamsError);
      console.error('Failed to get Teams SSO token:', errorDetails);
      throw new Error('Failed to get Teams authentication token. Please try again.');
    }

    // Step 2: Try MSAL ssoSilent (works when user has already consented)
    console.log('Attempting MSAL ssoSilent with loginHint:', loginHint);
    try {
      const ssoResponse = await this.msalInstance.ssoSilent({
        scopes: loginRequest.scopes,
        loginHint: loginHint,
      });

      this.account = ssoResponse.account;
      this.msalInstance.setActiveAccount(this.account);
      console.log('Teams SSO with MSAL succeeded for:', this.account?.username);
      return;
    } catch (ssoError: unknown) {
      const errorMessage = ssoError instanceof Error ? ssoError.message : String(ssoError);
      console.warn('MSAL ssoSilent failed:', errorMessage);
      // Continue to fallback methods
    }

    // Step 3: Try acquireTokenSilent if we have a matching account
    console.log('Checking for existing accounts...');
    try {
      const accounts = this.msalInstance.getAllAccounts();
      console.log('Found', accounts.length, 'accounts in cache');

      const matchingAccount = accounts.find(
        (acc) => acc.username.toLowerCase() === loginHint.toLowerCase()
      );

      if (matchingAccount) {
        console.log('Found matching account, trying silent token acquisition...');
        const tokenResponse = await this.msalInstance.acquireTokenSilent({
          scopes: loginRequest.scopes,
          account: matchingAccount,
          forceRefresh: true,
        });
        this.account = tokenResponse.account;
        this.msalInstance.setActiveAccount(this.account);
        console.log('Silent token acquisition succeeded for:', this.account?.username);
        return;
      }
    } catch (silentError: unknown) {
      const errorMessage = silentError instanceof Error ? silentError.message : String(silentError);
      console.warn('Silent token acquisition failed:', errorMessage);
    }

    // Step 4: Use Teams authentication dialog with interactive login
    // This will show a login dialog in Teams Desktop where users can authenticate
    console.log('Trying Teams authentication dialog with interactive login...');
    try {
      // Use response_type=id_token to get an ID token that MSAL can use
      // Use prompt=login to force showing the login dialog (required for Teams Desktop)
      const authUrl = `https://login.microsoftonline.com/${msalConfig.auth.authority?.split('/').pop()}/oauth2/v2.0/authorize?` +
        `client_id=${msalConfig.auth.clientId}` +
        `&response_type=id_token` +
        `&response_mode=fragment` +
        `&redirect_uri=${encodeURIComponent(window.location.origin + '/auth-end.html')}` +
        `&scope=${encodeURIComponent('openid profile ' + loginRequest.scopes.join(' '))}` +
        `&login_hint=${encodeURIComponent(loginHint)}` +
        `&nonce=${Math.random().toString(36).substring(2)}` +
        `&state=${Math.random().toString(36).substring(2)}`;

      console.log('Auth URL (interactive):', authUrl);

      const result = await microsoftTeams.authentication.authenticate({
        url: authUrl,
        width: 600,
        height: 535,
      });

      console.log('Teams auth dialog result:', result);

      // After successful interactive auth, the user should now have a session
      // Try ssoSilent again which should now work
      try {
        const ssoResponse = await this.msalInstance.ssoSilent({
          scopes: loginRequest.scopes,
          loginHint: loginHint,
        });

        this.account = ssoResponse.account;
        this.msalInstance.setActiveAccount(this.account);
        console.log('Teams auth dialog flow succeeded for:', this.account?.username);
        return;
      } catch (postAuthError) {
        console.warn('ssoSilent after dialog failed, trying acquireTokenSilent...', postAuthError);

        // Check accounts again after the dialog
        const accounts = this.msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          const matchingAccount = accounts.find(
            (acc) => acc.username.toLowerCase() === loginHint.toLowerCase()
          ) || accounts[0];

          this.account = matchingAccount;
          this.msalInstance.setActiveAccount(this.account);
          console.log('Using account from cache after dialog:', this.account?.username);
          return;
        }
      }
    } catch (teamsAuthError: unknown) {
      const errorMessage = teamsAuthError instanceof Error ? teamsAuthError.message : String(teamsAuthError);
      console.warn('Teams auth dialog failed:', errorMessage);
    }

    // Step 5: Try MSAL loginPopup as last resort (may work in Teams Web)
    console.log('Trying MSAL loginPopup as fallback...');
    try {
      const response = await this.msalInstance.loginPopup({
        ...loginRequest,
        loginHint: loginHint,
      });
      this.account = response.account;
      this.msalInstance.setActiveAccount(this.account);
      console.log('MSAL popup succeeded for:', this.account?.username);
      return;
    } catch (popupError: unknown) {
      const errorMessage = popupError instanceof Error ? popupError.message : String(popupError);
      console.error('MSAL popup failed:', errorMessage);
    }

    // All methods failed
    throw new Error(
      'Authentication failed. Please try using Teams Web (teams.microsoft.com) instead of Teams Desktop, ' +
      'or contact your administrator.'
    );
  }

  async loginRedirect(): Promise<void> {
    try {
      await this.msalInstance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('Login redirect failed:', error);
      throw new Error('Authentication failed. Please try again.');
    }
  }

  async logout(): Promise<void> {
    try {
      // Revoke photo URL to prevent memory leak
      this.revokeUserPhoto();

      const accountToLogout = this.account;
      this.account = null;

      // In Teams, just clear local state (no redirect possible in iframe)
      if (this.isTeamsEnvironment) {
        this.msalInstance.setActiveAccount(null);
        console.log('Logged out from Teams (local state cleared)');
        return;
      }

      // Outside Teams, use popup logout
      await this.msalInstance.logoutPopup({
        postLogoutRedirectUri: window.location.origin,
        account: accountToLogout,
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  async getToken(scopes: string[]): Promise<string> {
    if (!this.account) {
      throw new Error('No authenticated account');
    }

    try {
      console.debug('Acquiring token for scopes:', scopes);
      const response = await this.msalInstance.acquireTokenSilent({
        scopes,
        account: this.account,
      });
      console.debug('Token acquired successfully for scopes:', scopes);
      return response.accessToken;
    } catch (error) {
      console.warn('Silent token acquisition failed for scopes:', scopes, error);
      if (error instanceof InteractionRequiredAuthError) {
        // Silent token acquisition failed, try interactive
        console.debug('Attempting interactive token acquisition for scopes:', scopes);

        // In Teams, try Teams SSO first, then fall back to popup for consent
        if (this.isTeamsEnvironment) {
          try {
            // Re-authenticate via Teams SSO
            await this.loginWithTeamsSso();
            // After re-auth, try silent again
            const retryResponse = await this.msalInstance.acquireTokenSilent({
              scopes,
              account: this.account!,
            });
            return retryResponse.accessToken;
          } catch (ssoError) {
            // Teams SSO didn't work (possibly needs consent for new scopes)
            // Fall back to popup which can prompt for consent
            console.warn('Teams SSO retry failed, falling back to popup for consent:', ssoError);
            const popupResponse = await this.msalInstance.acquireTokenPopup({
              scopes,
              account: this.account!,
            });
            return popupResponse.accessToken;
          }
        }

        // Outside Teams, use popup
        const response = await this.msalInstance.acquireTokenPopup({
          scopes,
          account: this.account,
        });
        console.debug('Interactive token acquired successfully for scopes:', scopes);
        return response.accessToken;
      }
      throw error;
    }
  }

  async getGraphToken(): Promise<string> {
    return this.getToken(graphScopes.scopes);
  }

  isAuthenticated(): boolean {
    return this.account !== null;
  }

  getAccount(): AccountInfo | null {
    return this.account;
  }

  getMsalInstance(): PublicClientApplication {
    return this.msalInstance;
  }

  async getUserProfile(): Promise<User> {
    if (!this.account) {
      throw new Error('No authenticated account');
    }

    return {
      id: this.account.localAccountId,
      displayName: this.account.name || '',
      email: this.account.username,
    };
  }

  // Get user photo from Graph API
  // Caches the blob URL to prevent memory leaks from repeated calls
  async getUserPhoto(): Promise<string | null> {
    // Return cached URL if available
    if (this.userPhotoUrl) {
      return this.userPhotoUrl;
    }

    try {
      const token = await this.getGraphToken();
      const response = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        this.userPhotoUrl = URL.createObjectURL(blob);
        return this.userPhotoUrl;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Revoke the cached photo URL to free memory (call on logout)
  revokeUserPhoto(): void {
    if (this.userPhotoUrl) {
      URL.revokeObjectURL(this.userPhotoUrl);
      this.userPhotoUrl = null;
    }
  }
}

export const authService = new AuthService();
