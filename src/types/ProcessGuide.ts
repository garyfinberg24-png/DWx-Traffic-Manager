/**
 * DWx Traffic Manager - Process Guide Types
 * Interactive step-by-step walkthrough system for managers and account managers.
 * v2.18.0
 */

// ============================================================================
// Core Types
// ============================================================================

export type GuideCategory =
  | 'getting-started'
  | 'requests'
  | 'pipeline'
  | 'delivery'
  | 'admin'
  | 'reporting';

export type GuideRole = 'account_manager' | 'manager' | 'all';

export type GuideDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * A single step within a process guide
 */
export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  iconName: string;
  tips: string[];
  warningText?: string;
  successCriteria?: string;
  actionButton?: {
    label: string;
    route: string;
  };
}

/**
 * Complete process guide definition
 */
export interface ProcessGuide {
  id: string;
  title: string;
  shortDescription: string;
  category: GuideCategory;
  roles: GuideRole[];
  iconName: string;
  estimatedMinutes: number;
  difficulty: GuideDifficulty;
  steps: ProcessStep[];
  isRecommended?: boolean;
  sortOrder: number;
}

/**
 * User progress tracking (persisted in localStorage)
 */
export interface GuideProgress {
  guideId: string;
  completed: boolean;
  completedAt?: string;
  currentStep: number;
  lastViewedAt: string;
}

// ============================================================================
// Category Metadata
// ============================================================================

export interface GuideCategoryInfo {
  id: GuideCategory;
  label: string;
  color: string;
  description: string;
}

export const GUIDE_CATEGORIES: GuideCategoryInfo[] = [
  { id: 'getting-started', label: 'Getting Started', color: '#0078D4', description: 'New to DWx? Start here' },
  { id: 'requests', label: 'Requests & Bookings', color: '#8B5CF6', description: 'Creating and managing requests' },
  { id: 'pipeline', label: 'Sales Pipeline', color: '#EC4899', description: 'Managing deals through the funnel' },
  { id: 'delivery', label: 'Delivery & Handover', color: '#10B981', description: 'Won deal delivery and handover' },
  { id: 'admin', label: 'Administration', color: '#F59E0B', description: 'System settings and team management' },
  { id: 'reporting', label: 'Reports & Analytics', color: '#1E6B7B', description: 'Metrics, KPIs, and reporting' },
];

export const DIFFICULTY_COLORS: Record<GuideDifficulty, { bg: string; text: string }> = {
  beginner: { bg: '#d1fae5', text: '#065f46' },
  intermediate: { bg: '#dbeafe', text: '#1e40af' },
  advanced: { bg: '#fef3c7', text: '#92400e' },
};

// ============================================================================
// Storage
// ============================================================================

export const GUIDE_STORAGE_KEY = 'dwx_process_guides_progress';

export function loadGuideProgress(): Record<string, GuideProgress> {
  try {
    const stored = localStorage.getItem(GUIDE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveGuideProgress(progress: Record<string, GuideProgress>): void {
  try {
    localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Silent fail — non-critical feature
  }
}
