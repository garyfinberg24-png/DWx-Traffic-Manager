export interface BookingTemplate {
  id: string;
  name: string;
  description?: string;
  clientName: string;
  bookingType: 'Demo' | 'Deployment';
  licenseCount: number;
  isPremiumClient: boolean;
  defaultComments?: string;
  createdBy: string;
  createdAt: Date;
}

export interface TemplateFormData {
  name: string;
  description?: string;
  clientName: string;
  bookingType: 'Demo' | 'Deployment';
  licenseCount: number;
  isPremiumClient: boolean;
  defaultComments?: string;
}
