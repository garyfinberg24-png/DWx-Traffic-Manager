/**
 * DWx Traffic Manager - AI Chat Types
 * Types for the DWx Copilot side panel chat feature
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatContext {
  currentPage: string;
  userRole: 'manager' | 'account_manager' | 'user';
  userName: string;
}

export interface QuickAction {
  label: string;
  prompt: string;
}

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'How does the sales funnel work?',
    prompt: 'Explain how the DWx Traffic Manager sales funnel works, including all the stages from Lead to Won/Lost.',
  },
  {
    label: 'What services does DWx offer?',
    prompt: 'What services does Digital Workplace offer through this app? Give me an overview of each service category.',
  },
  {
    label: 'Tips for qualifying a lead',
    prompt: 'What are some best practices for qualifying a lead in the DWx sales process? How do I move a deal from Lead to Qualified?',
  },
  {
    label: 'Prepare for a discovery meeting',
    prompt: 'How should I prepare for a discovery meeting with a client? What steps should I follow in the app?',
  },
];

/** Maximum messages to keep in conversation history for API calls */
export const MAX_CHAT_HISTORY = 20;

/** LocalStorage key for persisting chat history */
export const CHAT_STORAGE_KEY = 'dwx-chat-history';
