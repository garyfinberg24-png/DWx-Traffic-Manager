/**
 * DWx Traffic Manager - Product Types
 * Types for DWx Apps, HyperParts, HyperCards, and HyperAgents
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
  | 'AI & Automation'
  // HyperParts categories
  | 'Visuals & Branding'
  | 'Communication'
  | 'Content Discovery'
  | 'People & Culture'
  | 'Media & Files'
  | 'Utility'
  | 'Action & Workflow'
  | 'Layout & Structure'
  | 'Engagement'
  | 'Knowledge'
  | 'Events'
  | 'Integration'
  | 'Data & Analytics'
  | 'Project Management';

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

// HyperParts - DWx SPFx Web Parts (20 web parts)
export const HYPERPARTS: Product[] = [
  { id: 'hyper-hero', name: 'HyperHero', subtitle: 'Dynamic Hero Layouts & Animations', description: 'Replaces static layouts with a CSS Grid engine. Supports video backgrounds, Lottie animations, dynamic AI-based content binding, and 10+ grid configurations.', type: 'webpart', category: 'Visuals & Branding', version: 'v1.0.0', icon: '🖼️', gradient: 'royal-purple', brand: 'HYPERPARTS' },
  { id: 'hyper-nav', name: 'HyperNav', subtitle: 'Multi-level Personalized Navigation', description: 'Transcends simple lists with multi-level nesting. Personalized "My Links" based on AD attributes, SVG icon support, and audience visibility at the individual link level.', type: 'webpart', category: 'Navigation', version: 'v1.0.0', icon: '🧭', gradient: 'indigo', brand: 'HYPERPARTS' },
  { id: 'hyper-news', name: 'HyperNews Feed', subtitle: 'Interactive Media Hub with Social Metrics', description: 'Moves from static updates to an interactive media hub. Infinite scroll, in-line modal "Quick Read," estimated read time, and social engagement metrics (likes/views).', type: 'webpart', category: 'Communication', version: 'v1.0.0', icon: '📰', gradient: 'sky', brand: 'HYPERPARTS' },
  { id: 'hyper-rollup', name: 'HyperRollup', subtitle: 'Visual Query Builder & Content Rollup', description: 'Superior version of Highlighted Content. Visual Query Builder for non-devs, custom Handlebars/React result templates, and "Export to CSV/Excel" functionality.', type: 'webpart', category: 'Content Discovery', version: 'v1.0.0', icon: '🔍', gradient: 'emerald', brand: 'HYPERPARTS' },
  { id: 'hyper-profile', name: 'HyperProfile', subtitle: 'Live Directory Cards with Teams Status', description: 'Live, interactive directory cards. Real-time Teams status, integrated "Schedule Meeting" button, Org-chart hover states, and Skill-tag searching.', type: 'webpart', category: 'People & Culture', version: 'v1.0.0', icon: '👤', gradient: 'pink', brand: 'HYPERPARTS' },
  { id: 'hyper-explorer', name: 'HyperExplorer', subtitle: 'Advanced File Previewer & ZIP Export', description: 'Advanced file interaction. Multi-file previewer, folder breadcrumbs within the part, "Download as ZIP" capability, and integrated PDF annotation.', type: 'webpart', category: 'Media & Files', version: 'v1.0.0', icon: '📁', gradient: 'coral', brand: 'HYPERPARTS' },
  { id: 'hyper-local', name: 'HyperLocal', subtitle: 'Weather, Clocks & Currency Converter', description: 'Context-aware utility. IP-based weather, multiple world clocks, live currency conversion, and stock ticker integration with corporate branding.', type: 'webpart', category: 'Utility', version: 'v1.0.0', icon: '🌍', gradient: 'teal', brand: 'HYPERPARTS' },
  { id: 'hyper-action', name: 'HyperAction', subtitle: 'Intelligent Multi-step Call-to-Action', description: 'Intelligent Call-to-Action. Multi-step buttons (logic-based), Power Automate triggers on click, and conditional button text based on user permissions.', type: 'webpart', category: 'Action & Workflow', version: 'v1.0.0', icon: '⚡', gradient: 'amber', brand: 'HYPERPARTS' },
  { id: 'hyper-tabs', name: 'HyperTabs', subtitle: 'Containerized Tabbed/Accordion Layout', description: 'A containerized layout part. Allows users to host other web parts inside a tabbed or accordion interface to maximize vertical screen real estate.', type: 'webpart', category: 'Layout & Structure', version: 'v1.0.0', icon: '📑', gradient: 'slate', brand: 'HYPERPARTS' },
  { id: 'hyper-poll', name: 'HyperPoll', subtitle: 'Real-time In-page Voting & Charts', description: 'Real-time feedback engine. In-page voting with animated Chart.js results; no redirect to MS Forms; supports anonymous or tracked entries.', type: 'webpart', category: 'Engagement', version: 'v1.0.0', icon: '📊', gradient: 'rose', brand: 'HYPERPARTS' },
  { id: 'hyper-ticker', name: 'HyperTicker', subtitle: 'Breaking News Marquee & Alerts', description: 'Global alert marquee. Scrolling "Breaking News" bar for the top of the site; supports Emergency Alert levels and manual or RSS feed inputs.', type: 'webpart', category: 'Communication', version: 'v1.0.0', icon: '📢', gradient: 'ocean-depth', brand: 'HYPERPARTS' },
  { id: 'hyper-recognition', name: 'HyperRecognition', subtitle: 'Peer Kudos & Wall of Fame', description: 'Peer-to-peer social recognition. A "Wall of Fame" for kudos and anniversaries; integrated with SharePoint lists and Microsoft Teams notifications.', type: 'webpart', category: 'People & Culture', version: 'v1.0.0', icon: '⭐', gradient: 'violet', brand: 'HYPERPARTS' },
  { id: 'hyper-faq', name: 'HyperFAQ', subtitle: 'Searchable Knowledge Base with Voting', description: 'Intelligent knowledge base. Searchable accordion with "Was this helpful?" voting; auto-ranks most popular questions; "Ask a Guru" submission form.', type: 'webpart', category: 'Knowledge', version: 'v1.0.0', icon: '❓', gradient: 'corporate-blue', brand: 'HYPERPARTS' },
  { id: 'hyper-events', name: 'HyperEvents Pro', subtitle: 'Unified Calendar with Outlook Sync', description: 'Unified scheduling. Aggregates Personal, Exchange, and SharePoint calendars; "Add to Outlook" 1-click sync; color-coding by event type.', type: 'webpart', category: 'Events', version: 'v1.0.0', icon: '📅', gradient: 'cyan', brand: 'HYPERPARTS' },
  { id: 'hyper-breadcrumb', name: 'HyperBreadcrumb', subtitle: 'Dynamic Hub-Site Path Detection', description: 'Dynamic site-pathing. Automatically detects Hub-Site hierarchy; customizable separators; supports "breadcrumb-injection" for deep-level pages.', type: 'webpart', category: 'Navigation', version: 'v1.0.0', icon: '🔗', gradient: 'violet', brand: 'HYPERPARTS' },
  { id: 'hyper-feedback', name: 'HyperFeedback', subtitle: 'Floating Screenshot & Ticket Widget', description: 'Internal Support/UX widget. Floating widget to capture screenshots and page metadata; automatically logs tickets to a SharePoint List or DevOps.', type: 'webpart', category: 'Utility', version: 'v1.0.0', icon: '💬', gradient: 'forest-teal', brand: 'HYPERPARTS' },
  { id: 'hyper-birthdays', name: 'HyperBirthdays', subtitle: 'Automated Celebration Carousel', description: 'Automated celebration carousel. Syncs with Entra ID (Azure AD); automated "Happy Birthday" or "Work Anniversary" cards with 1-click Teams messaging.', type: 'webpart', category: 'People & Culture', version: 'v1.0.0', icon: '🎂', gradient: 'lime', brand: 'HYPERPARTS' },
  { id: 'hyper-external', name: 'HyperExternal', subtitle: 'Secure SSO IFrame Wrapper', description: "Secure IFrame 2.0. Authentication-aware wrapper for legacy apps; SSO support; custom header/footer injection to match SharePoint's UI.", type: 'webpart', category: 'Integration', version: 'v1.0.0', icon: '🔌', gradient: 'blue-gray', brand: 'HYPERPARTS' },
  { id: 'hyper-metrics', name: 'HyperMetrics', subtitle: 'Real-time KPI & Power BI Display', description: 'Real-time KPI display. Connects to Power BI or Excel; displays "Goal vs. Actual" progress bars and color-coded status indicators.', type: 'webpart', category: 'Data & Analytics', version: 'v1.0.0', icon: '📈', gradient: 'charcoal', brand: 'HYPERPARTS' },
  { id: 'hyper-timeline', name: 'HyperTimeline', subtitle: 'Interactive Project Roadmap Visualizer', description: 'Project roadmap visualizer. Interactive horizontal/vertical timeline for project milestones; supports hover-over details and "Click to view document."', type: 'webpart', category: 'Project Management', version: 'v1.0.0', icon: '📋', gradient: 'ocean-depth', brand: 'HYPERPARTS' },
];

/** @deprecated Use HYPERPARTS instead */
export const WEBPARTS = HYPERPARTS;

// HyperCards - Adaptive Cards for Teams (6 cards)
export const HYPERCARDS: Product[] = [
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
    brand: 'HYPERCARDS',
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
    brand: 'HYPERCARDS',
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
    brand: 'HYPERCARDS',
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
    brand: 'HYPERCARDS',
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
    brand: 'HYPERCARDS',
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
    brand: 'HYPERCARDS',
  },
];

// HyperAgents - Copilot Studio Agents (10 agents)
export const HYPERAGENTS: Product[] = [
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
    brand: 'HYPERAGENTS',
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
    brand: 'HYPERAGENTS',
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
    brand: 'HYPERAGENTS',
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
    brand: 'HYPERAGENTS',
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
    brand: 'HYPERAGENTS',
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
    brand: 'HYPERAGENTS',
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
    brand: 'HYPERAGENTS',
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
    brand: 'HYPERAGENTS',
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
    brand: 'HYPERAGENTS',
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
    brand: 'HYPERAGENTS',
  },
];

/** @deprecated Use HYPERCARDS instead */
export const ADAPTIVE_CARDS = HYPERCARDS;

/** @deprecated Use HYPERAGENTS instead */
export const DWX_AGENTS = HYPERAGENTS;

// Get all products
export const getAllProducts = (): Product[] => {
  return [...DWX_APPS, ...HYPERPARTS, ...HYPERCARDS, ...HYPERAGENTS];
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
