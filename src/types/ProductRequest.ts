/**
 * DWx Traffic Manager - Product Request Types
 * Types for product demo and trial deployment requests (DWxProductRequests list)
 */

export type ProductRequestStatus = 'Pending Review' | 'Awaiting Approval' | 'Confirmed' | 'Completed' | 'Cancelled';
export type ProductRequestType = 'Demo' | 'Trial Deployment';

export interface ProductRequest {
  Id: number;
  Title: string;
  ProductId: string;
  ProductName: string;
  ProductType: 'App' | 'Web Part' | 'Adaptive Card' | 'Agent';
  ProductCategory?: string;
  RequestType: ProductRequestType;
  AccountManagerName: string;
  AccountManagerEmail: string;
  AccountManagerTenant?: string;
  ClientName: string;
  ContactName: string;
  ContactEmail: string;
  ContactPhone?: string;
  Industry?: string;
  CompanySize?: string;
  IsPremiumClient: boolean;
  Status: ProductRequestStatus;
  LicenseCount?: number;
  EstimatedValue?: number;
  ProposedSlot1?: string;
  ProposedSlot2?: string;
  ProposedSlot3?: string;
  ConfirmedDateTime?: string;
  CalendarEventId?: string;
  AssignedSpecialistName?: string;
  AssignedSpecialistEmail?: string;
  AssignedSpecialistRole?: string;
  ProductRequirements?: string; // JSON
  Comments?: string;
  Outcome?: string;
  NextSteps?: string;
  Created: string;
  Modified?: string;
}

export interface CreateProductRequestInput {
  ProductId: string;
  ProductName: string;
  ProductType: 'App' | 'Web Part' | 'Adaptive Card' | 'Agent';
  ProductCategory?: string;
  RequestType: ProductRequestType;
  ClientName: string;
  ContactName: string;
  ContactEmail: string;
  ContactPhone?: string;
  Industry?: string;
  CompanySize?: string;
  IsPremiumClient?: boolean;
  LicenseCount?: number;
  EstimatedValue?: number;
  ProposedSlot1: string;
  ProposedSlot2?: string;
  ProposedSlot3?: string;
  ProductRequirements?: string;
  Comments?: string;
}

export interface ProductRequestResult {
  success: boolean;
  request?: ProductRequest;
  error?: string;
  warnings?: string[];
}

export interface ProductRequestFilters {
  accountManagerEmail?: string;
  status?: ProductRequestStatus[];
  productType?: string;
}
