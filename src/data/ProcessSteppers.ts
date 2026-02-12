/**
 * DWx Traffic Manager - Visual Process Stepper Data
 * 6 workflow definitions for visual process diagrams.
 * v2.18.0
 */

import type { ProcessStepperData, ProcessMapInfo } from '../types/ProcessStepper';

// ============================================================================
// 1. Sales Funnel (7 stages, Won/Lost branching)
// ============================================================================

export const SALES_FUNNEL_STEPPER: ProcessStepperData = {
  id: 'sales-funnel',
  title: 'Sales Funnel',
  description: 'The 7-stage journey from initial lead to deal closure, with Won/Lost branching at every stage.',
  nodes: [
    { id: 'lead', label: 'Lead', description: 'Initial inquiry captured by Account Manager', color: '#6B7280', type: 'normal', iconName: 'PersonAdd', metadata: { percentage: 100, duration: '1-3 days' } },
    { id: 'qualified', label: 'Qualified', description: 'Interest validated — AM confirms client fit and budget', color: '#3B82F6', type: 'normal', iconName: 'CheckmarkCircle', metadata: { percentage: 80, duration: '2-5 days' } },
    { id: 'discovery', label: 'Discovery', description: 'Discovery session scheduled and conducted with specialist', color: '#8B5CF6', type: 'normal', iconName: 'Calendar', metadata: { percentage: 60, duration: '3-7 days' } },
    { id: 'proposal', label: 'Proposal', description: 'Formal proposal prepared, reviewed, and sent to client', color: '#F59E0B', type: 'normal', iconName: 'Document', metadata: { percentage: 45, duration: '5-14 days' } },
    { id: 'negotiation', label: 'Negotiation', description: 'Terms being finalized — pricing, scope, timeline', color: '#EC4899', type: 'normal', iconName: 'Chat', metadata: { percentage: 30, duration: '3-10 days' } },
    { id: 'won', label: 'Won', description: 'Contract signed — deal closed successfully', color: '#10B981', type: 'terminal-success', iconName: 'Trophy', metadata: { percentage: 20 } },
    { id: 'lost', label: 'Lost', description: 'Opportunity closed — post-mortem triggered', color: '#EF4444', type: 'terminal-failure', iconName: 'Dismiss' },
  ],
  connectors: [
    { from: 'lead', to: 'qualified', label: 'Qualify', style: 'solid' },
    { from: 'qualified', to: 'discovery', label: 'Schedule', style: 'solid' },
    { from: 'discovery', to: 'proposal', label: 'Prepare', style: 'solid' },
    { from: 'proposal', to: 'negotiation', label: 'Send', style: 'solid' },
    { from: 'negotiation', to: 'won', label: 'Close', style: 'solid' },
    { from: 'lead', to: 'lost', style: 'dashed', isConditional: true },
    { from: 'qualified', to: 'lost', style: 'dashed', isConditional: true },
    { from: 'discovery', to: 'lost', style: 'dashed', isConditional: true },
    { from: 'proposal', to: 'lost', style: 'dashed', isConditional: true },
    { from: 'negotiation', to: 'lost', style: 'dashed', isConditional: true },
  ],
  recommendedStyles: ['funnel', 'linear', 'flowchart'],
};

// ============================================================================
// 2. Product Request (5 stages, Cancelled branch)
// ============================================================================

export const PRODUCT_REQUEST_STEPPER: ProcessStepperData = {
  id: 'product-request',
  title: 'Product Request',
  description: 'Demo and trial deployment request workflow — from submission through approval to completion.',
  nodes: [
    { id: 'pending', label: 'Pending Review', description: 'Request submitted — awaiting manager review', color: '#6B7280', type: 'normal', iconName: 'Clock', metadata: { percentage: 100, duration: '1-2 days' } },
    { id: 'awaiting', label: 'Awaiting Approval', description: 'Manager reviewed — specialist being assigned', color: '#F59E0B', type: 'normal', iconName: 'PersonAvailable', metadata: { percentage: 75, duration: '1-3 days' } },
    { id: 'confirmed', label: 'Confirmed', description: 'Demo/trial date confirmed with calendar event', color: '#3B82F6', type: 'normal', iconName: 'CalendarCheckmark', metadata: { percentage: 50, duration: '1-7 days' } },
    { id: 'completed', label: 'Completed', description: 'Demo delivered or trial concluded', color: '#10B981', type: 'terminal-success', iconName: 'CheckmarkCircle', metadata: { percentage: 25 } },
    { id: 'cancelled', label: 'Cancelled', description: 'Request cancelled at any stage', color: '#EF4444', type: 'terminal-failure', iconName: 'Dismiss' },
  ],
  connectors: [
    { from: 'pending', to: 'awaiting', label: 'Review', style: 'solid' },
    { from: 'awaiting', to: 'confirmed', label: 'Approve', style: 'solid' },
    { from: 'confirmed', to: 'completed', label: 'Complete', style: 'solid' },
    { from: 'pending', to: 'cancelled', style: 'dashed', isConditional: true },
    { from: 'awaiting', to: 'cancelled', style: 'dashed', isConditional: true },
    { from: 'confirmed', to: 'cancelled', style: 'dashed', isConditional: true },
  ],
  recommendedStyles: ['linear', 'cards', 'timeline'],
};

// ============================================================================
// 3. Proposal Workflow (7 stages, Revision loop)
// ============================================================================

export const PROPOSAL_WORKFLOW_STEPPER: ProcessStepperData = {
  id: 'proposal-workflow',
  title: 'Proposal Workflow',
  description: 'Internal proposal lifecycle from drafting through review and approval to client delivery.',
  nodes: [
    { id: 'draft', label: 'Draft', description: 'Proposal being written — AI can generate initial content', color: '#6B7280', type: 'normal', iconName: 'Edit', metadata: { percentage: 100, duration: '2-5 days' } },
    { id: 'review', label: 'Internal Review', description: 'Manager reviewing proposal content and pricing', color: '#F59E0B', type: 'normal', iconName: 'Eye', metadata: { percentage: 80, duration: '1-3 days' } },
    { id: 'revision', label: 'Revision Requested', description: 'Manager requested changes — returns to editing', color: '#EF4444', type: 'lateral', iconName: 'ArrowUndo', metadata: { duration: '1-2 days' } },
    { id: 'approved', label: 'Approved', description: 'Proposal approved internally — ready to send', color: '#10B981', type: 'normal', iconName: 'CheckmarkCircle', metadata: { percentage: 50, duration: '< 1 day' } },
    { id: 'sent', label: 'Sent to Client', description: 'Proposal delivered to client for consideration', color: '#3B82F6', type: 'normal', iconName: 'Send', metadata: { percentage: 35, duration: '3-14 days' } },
    { id: 'accepted', label: 'Accepted', description: 'Client accepted the proposal — deal progresses', color: '#10B981', type: 'terminal-success', iconName: 'Trophy', metadata: { percentage: 20 } },
    { id: 'declined', label: 'Declined', description: 'Client declined — feedback captured', color: '#EF4444', type: 'terminal-failure', iconName: 'Dismiss' },
  ],
  connectors: [
    { from: 'draft', to: 'review', label: 'Submit', style: 'solid' },
    { from: 'review', to: 'approved', label: 'Approve', style: 'solid' },
    { from: 'review', to: 'revision', label: 'Request Changes', style: 'dashed', isConditional: true },
    { from: 'revision', to: 'review', label: 'Resubmit', style: 'dashed' },
    { from: 'approved', to: 'sent', label: 'Send', style: 'solid' },
    { from: 'sent', to: 'accepted', label: 'Accept', style: 'solid' },
    { from: 'sent', to: 'declined', style: 'dashed', isConditional: true },
  ],
  recommendedStyles: ['flowchart', 'timeline', 'linear'],
};

// ============================================================================
// 4. Post Mortem (5 stages, back transitions)
// ============================================================================

export const POST_MORTEM_STEPPER: ProcessStepperData = {
  id: 'post-mortem',
  title: 'Post Mortem',
  description: 'Review process for completed deals — AI analysis, issue tracking, lessons learned, and action items.',
  nodes: [
    { id: 'draft', label: 'Draft', description: 'Auto-created on Won/Lost — AI analysis available', color: '#6B7280', type: 'normal', iconName: 'Edit', metadata: { percentage: 100, duration: '1-3 days' } },
    { id: 'under-review', label: 'Under Review', description: 'Manager reviewing issues, lessons, and AI insights', color: '#F59E0B', type: 'normal', iconName: 'Eye', metadata: { percentage: 75, duration: '2-5 days' } },
    { id: 'review-complete', label: 'Review Complete', description: 'Review finished — action items identified', color: '#3B82F6', type: 'normal', iconName: 'CheckmarkCircle', metadata: { percentage: 50, duration: '1-2 days' } },
    { id: 'actions', label: 'Actions In Progress', description: 'Action items being worked on by assigned team members', color: '#8B5CF6', type: 'normal', iconName: 'TaskList', metadata: { percentage: 25, duration: '1-4 weeks' } },
    { id: 'closed', label: 'Closed', description: 'All actions completed — post-mortem archived', color: '#10B981', type: 'terminal-success', iconName: 'Archive' },
  ],
  connectors: [
    { from: 'draft', to: 'under-review', label: 'Submit', style: 'solid' },
    { from: 'under-review', to: 'review-complete', label: 'Complete Review', style: 'solid' },
    { from: 'under-review', to: 'draft', label: 'Revision', style: 'dashed' },
    { from: 'review-complete', to: 'actions', label: 'Start Actions', style: 'solid' },
    { from: 'review-complete', to: 'draft', label: 'Reopen', style: 'dashed' },
    { from: 'actions', to: 'closed', label: 'All Done', style: 'solid' },
    { from: 'actions', to: 'review-complete', label: 'Re-review', style: 'dashed' },
  ],
  recommendedStyles: ['timeline', 'flowchart', 'cards'],
};

// ============================================================================
// 5. Delivery Handover (6 stages, On Hold lateral)
// ============================================================================

export const DELIVERY_HANDOVER_STEPPER: ProcessStepperData = {
  id: 'delivery-handover',
  title: 'Delivery Handover',
  description: 'Transition from won deal to active delivery — team assignment, scope transfer, and kickoff.',
  nodes: [
    { id: 'pending', label: 'Pending', description: 'Won deal awaiting handover initiation', color: '#9CA3AF', type: 'normal', iconName: 'Clock', metadata: { percentage: 100, duration: '1-3 days' } },
    { id: 'in-progress', label: 'In Progress', description: 'Handover package being prepared — team assigned, scope documented', color: '#F59E0B', type: 'normal', iconName: 'TaskList', metadata: { percentage: 80, duration: '3-7 days' } },
    { id: 'kickoff', label: 'Kickoff Scheduled', description: 'Client kickoff meeting scheduled with delivery team', color: '#3B82F6', type: 'normal', iconName: 'Calendar', metadata: { percentage: 55, duration: '1-5 days' } },
    { id: 'delivered', label: 'Delivered', description: 'Handover package delivered — project execution begins', color: '#8B5CF6', type: 'normal', iconName: 'Rocket', metadata: { percentage: 30, duration: 'Ongoing' } },
    { id: 'closed', label: 'Closed', description: 'Delivery complete — handover fully closed', color: '#10B981', type: 'terminal-success', iconName: 'CheckmarkCircle' },
    { id: 'on-hold', label: 'On Hold', description: 'Handover paused — client delay, resource issue, or scope change', color: '#EF4444', type: 'lateral', iconName: 'Pause' },
  ],
  connectors: [
    { from: 'pending', to: 'in-progress', label: 'Start', style: 'solid' },
    { from: 'in-progress', to: 'kickoff', label: 'Schedule', style: 'solid' },
    { from: 'kickoff', to: 'delivered', label: 'Execute', style: 'solid' },
    { from: 'delivered', to: 'closed', label: 'Close', style: 'solid' },
    { from: 'pending', to: 'on-hold', label: 'Hold', style: 'dashed', isConditional: true },
    { from: 'in-progress', to: 'on-hold', label: 'Hold', style: 'dashed', isConditional: true },
    { from: 'on-hold', to: 'pending', label: 'Resume', style: 'dashed' },
    { from: 'on-hold', to: 'in-progress', label: 'Resume', style: 'dashed' },
  ],
  recommendedStyles: ['linear', 'timeline', 'flowchart'],
};

// ============================================================================
// 6. Session Prep (3 stages, simple linear)
// ============================================================================

export const SESSION_PREP_STEPPER: ProcessStepperData = {
  id: 'session-prep',
  title: 'Session Preparation',
  description: 'Specialist preparation workflow for discovery meetings — AI-powered content generation.',
  nodes: [
    { id: 'not-started', label: 'Not Started', description: 'Prep record auto-created when discovery is confirmed', color: '#6B7280', type: 'normal', iconName: 'Clock', metadata: { percentage: 100, duration: 'Auto-created' } },
    { id: 'in-progress', label: 'In Progress', description: 'Specialist reviewing AI content, customizing talking points, selecting resources', color: '#F59E0B', type: 'normal', iconName: 'Edit', metadata: { percentage: 50, duration: '1-3 days' } },
    { id: 'ready', label: 'Ready', description: 'All checklist items complete — specialist prepared for meeting', color: '#10B981', type: 'terminal-success', iconName: 'CheckmarkCircle' },
  ],
  connectors: [
    { from: 'not-started', to: 'in-progress', label: 'Begin Prep', style: 'solid' },
    { from: 'in-progress', to: 'ready', label: 'Mark Ready', style: 'solid' },
  ],
  recommendedStyles: ['linear', 'cards', 'timeline'],
};

// ============================================================================
// Lookup Helpers
// ============================================================================

const STEPPER_MAP: Record<string, ProcessStepperData> = {
  'sales-funnel': SALES_FUNNEL_STEPPER,
  'product-request': PRODUCT_REQUEST_STEPPER,
  'proposal-workflow': PROPOSAL_WORKFLOW_STEPPER,
  'post-mortem': POST_MORTEM_STEPPER,
  'delivery-handover': DELIVERY_HANDOVER_STEPPER,
  'session-prep': SESSION_PREP_STEPPER,
};

export function getStepperData(key: string): ProcessStepperData | undefined {
  return STEPPER_MAP[key];
}

export const ALL_PROCESS_STEPPERS: ProcessStepperData[] = Object.values(STEPPER_MAP);

// ============================================================================
// Process Map Gallery Items
// ============================================================================

export const PROCESS_MAP_ITEMS: ProcessMapInfo[] = [
  {
    id: 'sales-funnel',
    title: 'Sales Funnel',
    description: '7-stage deal progression with Won/Lost branching',
    category: 'Sales Pipeline',
    categoryColor: '#EC4899',
    dataKey: 'sales-funnel',
    recommendedStyle: 'funnel',
  },
  {
    id: 'product-request',
    title: 'Product Request',
    description: 'Demo/trial request from submission to completion',
    category: 'Requests',
    categoryColor: '#8B5CF6',
    dataKey: 'product-request',
    recommendedStyle: 'linear',
  },
  {
    id: 'proposal-workflow',
    title: 'Proposal Workflow',
    description: 'Internal approval with revision loop',
    category: 'Sales Pipeline',
    categoryColor: '#EC4899',
    dataKey: 'proposal-workflow',
    recommendedStyle: 'flowchart',
  },
  {
    id: 'post-mortem',
    title: 'Post Mortem',
    description: 'Deal review with AI analysis and action tracking',
    category: 'Analytics',
    categoryColor: '#1E6B7B',
    dataKey: 'post-mortem',
    recommendedStyle: 'timeline',
  },
  {
    id: 'delivery-handover',
    title: 'Delivery Handover',
    description: 'Won deal transition to active delivery team',
    category: 'Delivery',
    categoryColor: '#10B981',
    dataKey: 'delivery-handover',
    recommendedStyle: 'linear',
  },
  {
    id: 'session-prep',
    title: 'Session Preparation',
    description: 'Specialist prep for discovery meetings',
    category: 'Requests',
    categoryColor: '#8B5CF6',
    dataKey: 'session-prep',
    recommendedStyle: 'cards',
  },
];
