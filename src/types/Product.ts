/**
 * DWx Traffic Manager - Product Types
 * Types for DWx Apps, Web Parts, and Adaptive Cards
 */

export type ProductType = 'app' | 'webpart' | 'adaptive-card' | 'agent';

export type ProductCategory =
  | 'Document & Content'
  | 'HR & People'
  | 'Operations & IT'
  | 'Learning & Engagement'
  | 'Intranet'
  | 'Navigation'
  | 'Utilities'
  | 'Workflows'
  | 'Productivity'
  | 'AI & Automation';

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  type: ProductType;
  category: ProductCategory;
  version: string;
  icon: string;
  gradient: string;
  brand: string;
}

// DWx Apps (15 apps)
export const DWX_APPS: Product[] = [
  {
    id: 'asset-dashboard',
    name: 'Asset Dashboard',
    subtitle: 'IT Asset Tracking & Management',
    description: 'Comprehensive IT asset tracking with lifecycle management, depreciation, and reporting.',
    type: 'app',
    category: 'Operations & IT',
    version: 'v2.1.0',
    icon: '📊',
    gradient: 'corporate-blue',
    brand: 'FIRST DIGITAL',
  },
  {
    id: 'cv-management',
    name: 'CV Management',
    subtitle: 'Candidate Resume Repository',
    description: 'Centralized resume management system with search, tagging, and candidate tracking.',
    type: 'app',
    category: 'HR & People',
    version: 'v1.8.0',
    icon: '📄',
    gradient: 'coral',
    brand: 'FIRST DIGITAL',
  },
  {
    id: 'document-hub',
    name: 'Document Hub',
    subtitle: 'Enterprise Document Management',
    description: 'Centralized document management with versioning, workflows, and secure sharing.',
    type: 'app',
    category: 'Document & Content',
    version: 'v3.0.0',
    icon: '📁',
    gradient: 'rose',
    brand: 'FIRST DIGITAL',
  },
  {
    id: 'external-sharing-hub',
    name: 'External Sharing Hub',
    subtitle: 'Secure External Collaboration',
    description: 'Secure file sharing with external partners including access controls and audit trails.',
    type: 'app',
    category: 'Document & Content',
    version: 'v1.5.0',
    icon: '🔗',
    gradient: 'ocean-depth',
    brand: 'FIRST DIGITAL',
  },
  {
    id: 'gamification',
    name: 'Gamification',
    subtitle: 'Rewards & Recognition',
    description: 'Employee engagement through points, badges, leaderboards, and rewards programs.',
    type: 'app',
    category: 'Learning & Engagement',
    version: 'v2.0.0',
    icon: '🏆',
    gradient: 'royal-purple',
    brand: 'FIRST DIGITAL',
  },
  {
    id: 'integration-hub',
    name: 'Integration Hub',
    subtitle: 'Connect Enterprise Systems',
    description: 'Centralized integration platform connecting your business applications seamlessly.',
    type: 'app',
    category: 'Operations & IT',
    version: 'v2.5.0',
    icon: '🔌',
    gradient: 'indigo',
    brand: 'FIRST DIGITAL',
  },
  {
    id: 'license-management',
    name: 'License Management',
    subtitle: 'Software License Tracking',
    description: 'Track software licenses, renewals, compliance, and optimize license spending.',
    type: 'app',
    category: 'Operations & IT',
    version: 'v1.9.0',
    icon: '🔑',
    gradient: 'forest-teal',
    brand: 'FIRST DIGITAL',
  },
  {
    id: 'procurement-manager',
    name: 'Procurement Manager',
    subtitle: 'Purchase Order Workflows',
    description: 'End-to-end procurement with requisitions, approvals, POs, and vendor management.',
    type: 'app',
    category: 'Operations & IT',
    version: 'v2.2.0',
    icon: '🛒',
    gradient: 'emerald',
    brand: 'FIRST DIGITAL',
  },
  {
    id: 'quiz-builder',
    name: 'Quiz Builder',
    subtitle: 'Interactive Assessments',
    description: 'Build interactive quizzes and assessments with scoring, analytics, and certificates.',
    type: 'app',
    category: 'Learning & Engagement',
    version: 'v1.6.0',
    icon: '❓',
    gradient: 'amber',
    brand: 'FIRST DIGITAL',
  },
  {
    id: 'reports-builder',
    name: 'Reports Builder',
    subtitle: 'Dynamic Report Generation',
    description: 'Create custom reports with drag-and-drop builder, scheduling, and distribution.',
    type: 'app',
    category: 'Operations & IT',
    version: 'v2.8.0',
    icon: '📈',
    gradient: 'sky',
    brand: 'FIRST DIGITAL',
  },
  {
    id: 'survey-management',
    name: 'Survey Management',
    subtitle: 'Employee Feedback Platform',
    description: 'Create and distribute surveys with analytics, anonymous options, and reporting.',
    type: 'app',
    category: 'Learning & Engagement',
    version: 'v1.7.0',
    icon: '📋',
    gradient: 'violet',
    brand: 'FIRST DIGITAL',
  },
  {
    id: 'recruitment-manager',
    name: 'Recruitment Manager',
    subtitle: 'Talent Acquisition Platform',
    description: 'End-to-end recruitment with job postings, applicant tracking, and interview scheduling.',
    type: 'app',
    category: 'HR & People',
    version: 'v2.3.0',
    icon: '👥',
    gradient: 'pink',
    brand: 'FIRST DIGITAL',
  },
  {
    id: 'training-skills',
    name: 'Training & Skills',
    subtitle: 'Learning Management System',
    description: 'Comprehensive LMS with courses, certifications, skills tracking, and learning paths.',
    type: 'app',
    category: 'Learning & Engagement',
    version: 'v1.4.0',
    icon: '🎓',
    gradient: 'cyan',
    brand: 'FIRST DIGITAL',
  },
  {
    id: 'contract-manager',
    name: 'Contract Manager',
    subtitle: 'Contract Lifecycle Management',
    description: 'Full contract lifecycle from creation to renewal with templates, approvals, and alerts.',
    type: 'app',
    category: 'Document & Content',
    version: 'v2.0.0',
    icon: '📝',
    gradient: 'slate',
    brand: 'FIRST DIGITAL',
  },
  {
    id: 'policy-manager',
    name: 'Policy Manager',
    subtitle: 'Policy Governance & Compliance',
    description: 'Centralized policy management with acknowledgments, versioning, and compliance tracking.',
    type: 'app',
    category: 'Document & Content',
    version: 'v1.2.0',
    icon: '📜',
    gradient: 'charcoal',
    brand: 'FIRST DIGITAL',
  },
  {
    id: 'license-pulse',
    name: 'License Pulse',
    subtitle: 'M365 License Analytics & Power BI Reporting',
    description: 'Comprehensive M365 license analytics with Power BI dashboards, usage insights, cost optimization recommendations, and license allocation tracking.',
    type: 'app',
    category: 'Operations & IT',
    version: 'v1.0.0',
    icon: '📊',
    gradient: 'teal',
    brand: 'FIRST DIGITAL',
  },
];

// SharePoint Web Parts (8 web parts)
export const WEBPARTS: Product[] = [
  {
    id: 'news-carousel',
    name: 'News Carousel',
    subtitle: 'Animated News Slider',
    description: 'Dynamic news carousel with animations, filtering, and customizable layouts.',
    type: 'webpart',
    category: 'Intranet',
    version: 'v1.5.0',
    icon: '📰',
    gradient: 'royal-purple',
    brand: 'SHAREPOINT',
  },
  {
    id: 'employee-directory',
    name: 'Employee Directory',
    subtitle: 'Staff Search & Profiles',
    description: 'Searchable employee directory with profiles, org hierarchy, and contact details.',
    type: 'webpart',
    category: 'HR & People',
    version: 'v2.1.0',
    icon: '👤',
    gradient: 'indigo',
    brand: 'SHAREPOINT',
  },
  {
    id: 'quick-links',
    name: 'Quick Links',
    subtitle: 'Customizable Link Tiles',
    description: 'Configurable quick links web part with icons, grouping, and audience targeting.',
    type: 'webpart',
    category: 'Navigation',
    version: 'v1.8.0',
    icon: '🔗',
    gradient: 'violet',
    brand: 'SHAREPOINT',
  },
  {
    id: 'celebrations',
    name: 'Celebrations',
    subtitle: 'Birthdays & Anniversaries',
    description: 'Display upcoming birthdays and work anniversaries with celebration features.',
    type: 'webpart',
    category: 'HR & People',
    version: 'v1.3.0',
    icon: '🎂',
    gradient: 'pink',
    brand: 'SHAREPOINT',
  },
  {
    id: 'org-chart',
    name: 'Org Chart',
    subtitle: 'Interactive Organization Tree',
    description: 'Visual organization chart with drill-down, search, and profile integration.',
    type: 'webpart',
    category: 'HR & People',
    version: 'v2.0.0',
    icon: '🏢',
    gradient: 'ocean-depth',
    brand: 'SHAREPOINT',
  },
  {
    id: 'weather-widget',
    name: 'Weather Widget',
    subtitle: 'Multi-location Forecast',
    description: 'Weather forecasts for multiple office locations with configurable display options.',
    type: 'webpart',
    category: 'Utilities',
    version: 'v1.2.0',
    icon: '⛅',
    gradient: 'sky',
    brand: 'SHAREPOINT',
  },
  {
    id: 'kpi-dashboard',
    name: 'KPI Dashboard',
    subtitle: 'Real-time Metrics Display',
    description: 'Configurable KPI tiles with data from SharePoint lists or external sources.',
    type: 'webpart',
    category: 'Operations & IT',
    version: 'v1.6.0',
    icon: '📈',
    gradient: 'emerald',
    brand: 'SHAREPOINT',
  },
  {
    id: 'events-calendar',
    name: 'Events Calendar',
    subtitle: 'Company Events & Holidays',
    description: 'Company-wide events calendar with filtering, reminders, and Teams integration.',
    type: 'webpart',
    category: 'Intranet',
    version: 'v1.9.0',
    icon: '📅',
    gradient: 'amber',
    brand: 'SHAREPOINT',
  },
];

// Adaptive Cards for Teams (6 cards)
export const ADAPTIVE_CARDS: Product[] = [
  {
    id: 'leave-request-card',
    name: 'Leave Request Card',
    subtitle: 'Submit & Approve Leave',
    description: 'Interactive leave request card with manager approval workflow integration.',
    type: 'adaptive-card',
    category: 'HR & People',
    version: 'v1.2.0',
    icon: '🏖️',
    gradient: 'forest-teal',
    brand: 'TEAMS',
  },
  {
    id: 'approval-card',
    name: 'Approval Card',
    subtitle: 'Multi-stage Approvals',
    description: 'Generic approval card supporting multi-stage workflows with comments.',
    type: 'adaptive-card',
    category: 'Workflows',
    version: 'v1.5.0',
    icon: '✅',
    gradient: 'teal',
    brand: 'TEAMS',
  },
  {
    id: 'incident-report',
    name: 'Incident Report',
    subtitle: 'Report & Track Issues',
    description: 'Incident reporting card with severity levels, assignments, and status tracking.',
    type: 'adaptive-card',
    category: 'Operations & IT',
    version: 'v1.1.0',
    icon: '⚠️',
    gradient: 'blue-gray',
    brand: 'TEAMS',
  },
  {
    id: 'feedback-card',
    name: 'Feedback Card',
    subtitle: 'Quick Pulse Surveys',
    description: 'Quick feedback collection with emoji ratings and optional comments.',
    type: 'adaptive-card',
    category: 'Learning & Engagement',
    version: 'v1.3.0',
    icon: '💬',
    gradient: 'lime',
    brand: 'TEAMS',
  },
  {
    id: 'meeting-summary',
    name: 'Meeting Summary',
    subtitle: 'Auto-generated Notes',
    description: 'Post-meeting summary card with action items, decisions, and follow-ups.',
    type: 'adaptive-card',
    category: 'Productivity',
    version: 'v1.0.0',
    icon: '📝',
    gradient: 'cyan',
    brand: 'TEAMS',
  },
  {
    id: 'task-assignment',
    name: 'Task Assignment',
    subtitle: 'Assign & Track Tasks',
    description: 'Task assignment card with due dates, priority, and completion tracking.',
    type: 'adaptive-card',
    category: 'Productivity',
    version: 'v1.4.0',
    icon: '📋',
    gradient: 'coral',
    brand: 'TEAMS',
  },
];

// DWx Agents (Copilot Studio Agents - 10 agents)
export const DWX_AGENTS: Product[] = [
  {
    id: 'it-service-desk-assistant',
    name: 'IT Service Desk Assistant',
    subtitle: 'AI-Powered IT Support',
    description: 'Intelligent IT helpdesk agent that handles common IT queries, troubleshooting, password resets, and ticket creation.',
    type: 'agent',
    category: 'Operations & IT',
    version: 'v1.0.0',
    icon: '🤖',
    gradient: 'corporate-blue',
    brand: 'COPILOT STUDIO',
  },
  {
    id: 'access-identity-requests',
    name: 'Access & Identity Requests',
    subtitle: 'Automated Access Management',
    description: 'Self-service agent for requesting system access, role changes, and identity verification workflows.',
    type: 'agent',
    category: 'Operations & IT',
    version: 'v1.0.0',
    icon: '🔐',
    gradient: 'indigo',
    brand: 'COPILOT STUDIO',
  },
  {
    id: 'hr-policy-leave-advisor',
    name: 'HR Policy & Leave Advisor',
    subtitle: 'HR Self-Service Assistant',
    description: 'Answer HR policy questions, guide leave applications, and provide benefits information to employees.',
    type: 'agent',
    category: 'HR & People',
    version: 'v1.0.0',
    icon: '👥',
    gradient: 'pink',
    brand: 'COPILOT STUDIO',
  },
  {
    id: 'employee-onboarding-concierge',
    name: 'Employee Onboarding Concierge',
    subtitle: 'New Hire Welcome Assistant',
    description: 'Guide new employees through onboarding tasks, document completion, and orientation scheduling.',
    type: 'agent',
    category: 'HR & People',
    version: 'v1.0.0',
    icon: '🎯',
    gradient: 'emerald',
    brand: 'COPILOT STUDIO',
  },
  {
    id: 'procurement-helpdesk',
    name: 'Procurement Helpdesk',
    subtitle: 'Purchase Request Assistant',
    description: 'Assist with purchase requisitions, vendor inquiries, approval status, and procurement policy guidance.',
    type: 'agent',
    category: 'Operations & IT',
    version: 'v1.0.0',
    icon: '🛒',
    gradient: 'amber',
    brand: 'COPILOT STUDIO',
  },
  {
    id: 'supplier-query-assistant',
    name: 'Supplier Query Assistant',
    subtitle: 'Vendor Communication Bot',
    description: 'Handle supplier inquiries, payment status checks, and vendor registration assistance.',
    type: 'agent',
    category: 'Operations & IT',
    version: 'v1.0.0',
    icon: '🏭',
    gradient: 'forest-teal',
    brand: 'COPILOT STUDIO',
  },
  {
    id: 'contract-policy-search',
    name: 'Contract & Policy Search Copilot',
    subtitle: 'Document Intelligence Agent',
    description: 'Search and retrieve information from contracts, policies, and legal documents using natural language.',
    type: 'agent',
    category: 'Document & Content',
    version: 'v1.0.0',
    icon: '📑',
    gradient: 'royal-purple',
    brand: 'COPILOT STUDIO',
  },
  {
    id: 'asset-device-lifecycle',
    name: 'Asset & Device Lifecycle Assistant',
    subtitle: 'IT Asset Management Bot',
    description: 'Track device assignments, request hardware, report issues, and manage asset lifecycle queries.',
    type: 'agent',
    category: 'Operations & IT',
    version: 'v1.0.0',
    icon: '💻',
    gradient: 'slate',
    brand: 'COPILOT STUDIO',
  },
  {
    id: 'travel-expense-policy',
    name: 'Travel & Expense Policy Guide',
    subtitle: 'T&E Assistant',
    description: 'Guide employees on travel policies, expense claim procedures, and per diem rates.',
    type: 'agent',
    category: 'Operations & IT',
    version: 'v1.0.0',
    icon: '✈️',
    gradient: 'sky',
    brand: 'COPILOT STUDIO',
  },
  {
    id: 'internal-knowledge-navigator',
    name: 'Internal Knowledge Navigator',
    subtitle: 'Enterprise Search Copilot',
    description: 'Navigate internal knowledge bases, wikis, and documentation to find answers across the organization.',
    type: 'agent',
    category: 'AI & Automation',
    version: 'v1.0.0',
    icon: '🧭',
    gradient: 'teal',
    brand: 'COPILOT STUDIO',
  },
];

// Get all products
export const getAllProducts = (): Product[] => {
  return [...DWX_APPS, ...WEBPARTS, ...ADAPTIVE_CARDS, ...DWX_AGENTS];
};

// Get products by type
export const getProductsByType = (type: ProductType): Product[] => {
  return getAllProducts().filter((p) => p.type === type);
};

// Get products by category
export const getProductsByCategory = (category: ProductCategory): Product[] => {
  return getAllProducts().filter((p) => p.category === category);
};

// Get categories for a product type
export const getCategoriesForType = (type: ProductType): ProductCategory[] => {
  const products = getProductsByType(type);
  const categories = new Set(products.map((p) => p.category));
  return Array.from(categories);
};
