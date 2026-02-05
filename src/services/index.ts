// Export services via the service factory for test mode support
export { getAuthService, getGraphService, authServiceInstance as authService, graphServiceInstance as graphService } from './serviceFactory';
export { sharePointService } from './SharePointService';
export { powerAutomateService } from './PowerAutomateService';
export { dashboardService } from './DashboardService';
export { notificationService } from './NotificationService';
export { referenceDataService } from './ReferenceDataService';
export { accountManagerService } from './AccountManagerService';
export { auditService } from './AuditService';
export { documentService } from './DocumentService';
export { managerService } from './ManagerService';
export { guestInvitationService } from './GuestInvitationService';
export { gamificationService } from './GamificationService';
export { productRequestService } from './ProductRequestService';

// Re-export individual services for direct access when needed
export { authService as realAuthService } from './AuthService';
export { graphService as realGraphService } from './GraphService';
export { mockAuthService } from './MockAuthService';
export { mockGraphService } from './MockGraphService';
