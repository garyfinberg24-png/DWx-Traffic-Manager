/**
 * DWx Traffic Manager - Session Preparation Types
 * Types for AI-powered session preparation workflow
 */

import { MeetingNotes } from './MeetingNotes';

export type { MeetingNotes, MeetingNoteSentiment } from './MeetingNotes';

// ============================================================================
// Session Preparation Status
// ============================================================================

export type SessionPrepStatus = 'Not Started' | 'In Progress' | 'Ready';

// ============================================================================
// Checklist Categories
// ============================================================================

export type PrepChecklistCategory = 'research' | 'technical' | 'resources' | 'logistics';

export interface PrepChecklistItem {
  id: string;
  category: PrepChecklistCategory;
  label: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

// Default checklist items for new session preparations
export const DEFAULT_PREP_CHECKLIST: Omit<PrepChecklistItem, 'id'>[] = [
  // Research
  { category: 'research', label: 'Review company background and industry', completed: false },
  { category: 'research', label: 'Identify key stakeholders and decision makers', completed: false },
  { category: 'research', label: 'Review previous engagement history', completed: false },
  { category: 'research', label: 'Research recent company news and developments', completed: false },
  // Technical
  { category: 'technical', label: 'Confirm technical prerequisites with client', completed: false },
  { category: 'technical', label: 'Prepare demo environment', completed: false },
  { category: 'technical', label: 'Test all demo scenarios', completed: false },
  // Resources
  { category: 'resources', label: 'Select appropriate slide deck', completed: false },
  { category: 'resources', label: 'Prepare relevant case studies', completed: false },
  { category: 'resources', label: 'Gather pricing/proposal materials', completed: false },
  // Logistics
  { category: 'logistics', label: 'Confirm meeting time with all attendees', completed: false },
  { category: 'logistics', label: 'Test meeting link and audio/video', completed: false },
  { category: 'logistics', label: 'Prepare recording consent if needed', completed: false },
];

// ============================================================================
// Client Profile (AI-Generated)
// ============================================================================

export interface EngagementSummary {
  id: number;
  serviceName: string;
  outcome: 'Won' | 'Lost' | 'Pending';
  date: string;
  value: number;
  notes?: string;
}

export interface ClientProfile {
  companyOverview: string;
  industry: string;
  companySize: string;
  keyStakeholders: string[];
  previousEngagements: EngagementSummary[];
  recentNews: string[];
  potentialPainPoints: string[];
  competitorContext: string;
  generatedAt: string;
}

// ============================================================================
// Talking Points (AI-Generated)
// ============================================================================

export type TalkingPointCategory = 'opening' | 'discovery' | 'value_prop' | 'objection' | 'closing';

export interface TalkingPoint {
  id: string;
  category: TalkingPointCategory;
  content: string;
  isCustom: boolean;
  order: number;
}

export const TALKING_POINT_CATEGORIES: Record<TalkingPointCategory, { label: string; description: string; icon: string }> = {
  opening: {
    label: 'Opening',
    description: 'Ice breakers and rapport building',
    icon: 'HandWave',
  },
  discovery: {
    label: 'Discovery Questions',
    description: 'Questions to understand their needs',
    icon: 'QuestionCircle',
  },
  value_prop: {
    label: 'Value Propositions',
    description: 'Key benefits and differentiators',
    icon: 'Lightbulb',
  },
  objection: {
    label: 'Objection Handling',
    description: 'Responses to common concerns',
    icon: 'Shield',
  },
  closing: {
    label: 'Closing',
    description: 'Next steps and call to action',
    icon: 'Checkmark',
  },
};

// ============================================================================
// Suggested Resources (AI-Generated)
// ============================================================================

export type ResourceType = 'slide_deck' | 'case_study' | 'datasheet' | 'demo_script' | 'proposal_template' | 'video';

export interface SuggestedResource {
  id: string;
  name: string;
  type: ResourceType;
  url: string;
  relevanceScore: number; // 0-100
  reason: string;
  selected: boolean;
}

export const RESOURCE_TYPE_LABELS: Record<ResourceType, { label: string; icon: string }> = {
  slide_deck: { label: 'Slide Deck', icon: 'Presentation' },
  case_study: { label: 'Case Study', icon: 'Document' },
  datasheet: { label: 'Datasheet', icon: 'Table' },
  demo_script: { label: 'Demo Script', icon: 'Script' },
  proposal_template: { label: 'Proposal Template', icon: 'DocumentBulletList' },
  video: { label: 'Video', icon: 'Video' },
};

// ============================================================================
// Meeting Agenda (AI-Generated)
// ============================================================================

export interface AgendaItem {
  id: string;
  title: string;
  duration: number; // minutes
  description: string;
  order: number;
}

export interface MeetingAgenda {
  totalDuration: number;
  items: AgendaItem[];
  generatedAt: string;
}

// ============================================================================
// Main Session Preparation Entity
// ============================================================================

export interface SessionPreparation {
  Id: number;
  Title: string;
  ServiceRequestId: number;
  SpecialistEmail: string;
  SpecialistName: string;
  Status: SessionPrepStatus;

  // AI-generated content
  ClientProfile: ClientProfile | null;
  TalkingPoints: TalkingPoint[];
  SuggestedResources: SuggestedResource[];
  MeetingAgenda: MeetingAgenda | null;

  // Manual checklist
  ChecklistItems: PrepChecklistItem[];

  // Meeting notes (post-discovery)
  MeetingNotes: MeetingNotes | null;

  // Metadata
  AIGeneratedAt: string | null;
  CompletedAt: string | null;
  ReminderSent: boolean;

  // SharePoint fields
  Created: string;
  Modified: string;
  CreatedBy: string;
  ModifiedBy: string;
}

// ============================================================================
// Input Types for Creating/Updating
// ============================================================================

export interface CreateSessionPrepInput {
  serviceRequestId: number;
  specialistEmail: string;
  specialistName: string;
}

export interface UpdateSessionPrepInput {
  status?: SessionPrepStatus;
  clientProfile?: ClientProfile;
  talkingPoints?: TalkingPoint[];
  suggestedResources?: SuggestedResource[];
  meetingAgenda?: MeetingAgenda;
  checklistItems?: PrepChecklistItem[];
  aiGeneratedAt?: string;
  completedAt?: string;
  reminderSent?: boolean;
  meetingNotes?: MeetingNotes;
}

// ============================================================================
// Service Result Types
// ============================================================================

export interface SessionPrepResult {
  success: boolean;
  sessionPrep?: SessionPreparation;
  error?: string;
}

// ============================================================================
// AI Generation Request/Response Types
// ============================================================================

export interface AIGenerationContext {
  clientName: string;
  clientIndustry: string;
  clientSize: string;
  isPremium: boolean;
  serviceName: string;
  serviceCategory: string;
  servicePrerequisites: string[];
  serviceEngagementPhases: string[];
  dealValue: number;
  accountManagerName: string;
  previousEngagements: EngagementSummary[];
  meetingDuration: number;
  meetingDateTime: string;
  additionalNotes?: string;
}

export interface AIGenerationResult {
  success: boolean;
  clientProfile?: ClientProfile;
  talkingPoints?: TalkingPoint[];
  suggestedResources?: SuggestedResource[];
  meetingAgenda?: MeetingAgenda;
  error?: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface SessionPrepNotification {
  type: 'prep_created' | 'prep_reminder' | 'prep_complete';
  sessionPrepId: number;
  serviceRequestId: number;
  specialistEmail: string;
  specialistName: string;
  clientName: string;
  meetingDateTime: string;
  meetingTitle: string;
}
