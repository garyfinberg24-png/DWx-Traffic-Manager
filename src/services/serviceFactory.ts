/**
 * Service Factory - Conditional Service Injection for Test Mode
 *
 * This module provides a unified way to access services that automatically
 * switches between real and mock implementations based on VITE_TEST_MODE.
 *
 * Usage:
 *   import { getAuthService, getGraphService } from './serviceFactory';
 *
 *   const authService = getAuthService();
 *   const graphService = getGraphService();
 */

import { isTestMode } from '../config/testModeConfig';
import { authService as realAuthService } from './AuthService';
import { graphService as realGraphService } from './GraphService';
import { mockAuthService, IAuthService } from './MockAuthService';
import { mockGraphService } from './MockGraphService';

// Type definitions for services
export type AuthServiceType = typeof realAuthService | typeof mockAuthService;
export type GraphServiceType = typeof realGraphService | typeof mockGraphService;

/**
 * Get the appropriate AuthService based on test mode
 */
export const getAuthService = (): IAuthService => {
  if (isTestMode) {
    console.log('[ServiceFactory] Using MockAuthService');
    return mockAuthService;
  }
  return realAuthService;
};

/**
 * Get the appropriate GraphService based on test mode
 */
export const getGraphService = (): GraphServiceType => {
  if (isTestMode) {
    console.log('[ServiceFactory] Using MockGraphService');
    return mockGraphService;
  }
  return realGraphService;
};

// Re-export for convenience - these will be the resolved services
// Note: These are resolved at import time, so use getAuthService/getGraphService
// for dynamic access in components/hooks
export const authServiceInstance = getAuthService();
export const graphServiceInstance = getGraphService();

// Log which services are being used at startup
if (isTestMode) {
  console.log('========================================');
  console.log('[ServiceFactory] TEST MODE ACTIVE');
  console.log('[ServiceFactory] Using mock services:');
  console.log('  - MockAuthService');
  console.log('  - MockGraphService');
  console.log('========================================');
} else {
  console.log('[ServiceFactory] Using real services');
}
