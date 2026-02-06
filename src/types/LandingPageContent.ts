/**
 * DWx Traffic Manager - Landing Page Content Types
 * Type definitions for admin-manageable landing page content
 * stored in DWxLandingPageContent SharePoint list.
 */

// ============================================================================
// Content Section Types
// ============================================================================

export interface LandingPageStat {
  value: string;
  label: string;
}

export interface LandingPageTeamMember {
  name: string;
  role: string;
  spec: string;
  img: number;
  specFull: string;
  engagements: string;
  years: string;
  quote: string;
  highlightWords: string[];
  inspiration: string;
  hobbies: { emoji: string; label: string }[];
  websites: string[];
}

export interface LandingPageTestimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  avatarUrl: string;
  rating: number;
}

export interface LandingPageMastheadText {
  title: string;
  titleAccent: string;
  lead: string;
}

export interface LandingPageTeamPanelText {
  title: string;
  titleAccent: string;
  subtitle: string;
}

export interface LandingPageFooterText {
  brandTitle: string;
  brandTitleAccent: string;
  brandDescription: string;
  copyright: string;
}

export interface LandingPageFooterResource {
  label: string;
  route: string;
}

// ============================================================================
// Content Section Keys & SharePoint Entity
// ============================================================================

export type ContentSectionKey =
  | 'slogans'
  | 'whatWeDo'
  | 'teamMembers'
  | 'stats'
  | 'testimonial'
  | 'mastheadText'
  | 'teamPanelText'
  | 'footerText'
  | 'footerServices'
  | 'footerProducts'
  | 'footerResources';

export interface ContentSection {
  Id?: number;
  Title: ContentSectionKey;
  Content_JSON: string;
  SortOrder: number;
  IsActive: boolean;
}

export interface LandingPageContent {
  slogans: string[];
  whatWeDo: string[];
  teamMembers: LandingPageTeamMember[];
  stats: LandingPageStat[];
  testimonial: LandingPageTestimonial;
  mastheadText: LandingPageMastheadText;
  teamPanelText: LandingPageTeamPanelText;
  footerText: LandingPageFooterText;
  footerServices: string[];
  footerProducts: string[];
  footerResources: LandingPageFooterResource[];
}

// ============================================================================
// Default Landing Page Content (fallback when SharePoint data unavailable)
// ============================================================================

export const DEFAULT_LANDING_PAGE_CONTENT: LandingPageContent = {
  slogans: [
    'Your Next Deal Starts Here',
    'From Lead to Launch, Streamlined',
    'Pre-Sales, Perfected',
    'Move Deals Forward, Not Paperwork',
    'Smart Scheduling. Smarter Selling.',
    'Close Faster. Know More. Win Often.',
    'Where Discovery Meets Delivery',
    'Digital Workplace. Accelerated.',
  ],

  whatWeDo: [
    'Custom Power Apps & Copilot agents',
    'SPFx web parts & Teams apps',
    'SharePoint migrations',
    'M365 governance & assessments',
    'Tender responses & proposals',
    'Managed support & SLA',
    'Strategic advisory & roadmapping',
    'Training & change management',
    'Microsoft Viva suite rollouts',
    'Intranet design & branding',
    'Power BI dashboards & reporting',
    'Security & compliance reviews',
  ],

  teamMembers: [
    {
      name: 'Gary Finberg', role: 'Solution Architect', spec: 'Power Platform \u2022 SPFx \u2022 Copilot', img: 11,
      specFull: 'Power Platform \u2022 SPFx \u2022 Copilot Agents',
      engagements: '40+', years: '12+',
      quote: 'I\'m driven by the belief that great technology should feel invisible \u2014 it just works. Every engagement is a chance to solve a puzzle, collaborate with brilliant people, and deliver something the client didn\'t think was possible.',
      highlightWords: ['works'],
      inspiration: 'Seeing a client\'s face light up during a demo. Collaborating with the team to crack a tough architecture problem at the whiteboard. Shipping solutions that genuinely make people\'s work lives easier.',
      hobbies: [
        { emoji: '\uD83E\uDD3C', label: 'Mountain Biking' },
        { emoji: '\u2615', label: 'Specialty Coffee' },
        { emoji: '\uD83C\uDFA7', label: 'Tech Podcasts' },
        { emoji: '\uD83D\uDCBB', label: 'Open Source' },
        { emoji: '\uD83C\uDF0E', label: 'Travel' },
      ],
      websites: ['Microsoft Learn \u2014 Power Platform', 'PnP Community \u2014 sp-dev-fx-webparts', 'Hacker News \u2014 tech & startups'],
    },
    {
      name: 'Chris Botha', role: 'Technical Specialist', spec: 'SharePoint \u2022 Migrations', img: 12,
      specFull: 'SharePoint \u2022 Migrations \u2022 Hybrid',
      engagements: '35+', years: '10+',
      quote: 'There\'s a real craft to migrating thousands of sites without users ever noticing. I love the precision it demands \u2014 planning every detail, testing every edge case, and then watching it all land perfectly on go-live day.',
      highlightWords: ['precision'],
      inspiration: 'Complex migration puzzles that everyone says can\'t be done. The satisfaction of zero-downtime cutovers. Building tooling that saves the team hundreds of hours on the next project.',
      hobbies: [
        { emoji: '\uD83C\uDFC8', label: 'Rugby' },
        { emoji: '\uD83C\uDF74', label: 'Braai Master' },
        { emoji: '\uD83D\uDCF7', label: 'Photography' },
        { emoji: '\uD83C\uDFB6', label: 'Live Music' },
      ],
      websites: ['SharePoint Maven \u2014 migration guides', 'Microsoft Tech Community', 'Stack Overflow \u2014 SharePoint'],
    },
    {
      name: 'Shaaira Omar', role: 'Consultant', spec: 'M365 \u2022 Governance', img: 45,
      specFull: 'M365 \u2022 Governance \u2022 Compliance',
      engagements: '25+', years: '8+',
      quote: 'Governance isn\'t about saying no \u2014 it\'s about creating the guardrails that let everyone say yes with confidence. I help organisations unlock M365\'s full potential while keeping their data safe and compliant.',
      highlightWords: ['no', 'yes'],
      inspiration: 'Helping clients realise that governance can be an enabler, not a blocker. Turning chaotic tenant sprawl into a clean, well-structured environment that teams actually enjoy using.',
      hobbies: [
        { emoji: '\uD83D\uDCDA', label: 'Reading' },
        { emoji: '\uD83C\uDF69', label: 'Baking' },
        { emoji: '\uD83D\uDEB2', label: 'Cycling' },
        { emoji: '\uD83C\uDF31', label: 'Gardening' },
        { emoji: '\uD83C\uDF08', label: 'Art & Design' },
      ],
      websites: ['Microsoft Purview documentation', 'Practical 365 \u2014 governance deep dives', 'The Verge \u2014 tech culture'],
    },
    {
      name: 'Wimpie Baard', role: 'Solution Architect', spec: 'Copilot \u2022 AI \u2022 Viva', img: 14,
      specFull: 'Copilot \u2022 AI \u2022 Viva Suite',
      engagements: '30+', years: '11+',
      quote: 'AI is only as good as the problems you point it at. I love working with clients to find the real pain points \u2014 the ones where Copilot or a custom agent can save hours every week and make people genuinely excited about their tools.',
      highlightWords: ['real'],
      inspiration: 'The AI revolution happening inside Microsoft 365 right now. Building Copilot agents that feel like magic to the end user. Helping traditional businesses take their first confident steps into AI.',
      hobbies: [
        { emoji: '\u26F3', label: 'Golf' },
        { emoji: '\uD83D\uDC36', label: 'Dog Dad' },
        { emoji: '\uD83C\uDFAC', label: 'Sci-Fi Films' },
        { emoji: '\uD83D\uDCBB', label: 'Side Projects' },
        { emoji: '\uD83C\uDF77', label: 'Wine Tasting' },
      ],
      websites: ['Microsoft Copilot Studio docs', 'AI Blog \u2014 Microsoft Research', 'Ars Technica \u2014 AI coverage'],
    },
    {
      name: 'Gulzar Ismail', role: 'Consultant', spec: 'Training \u2022 Change Mgmt', img: 59,
      specFull: 'Training \u2022 Change Mgmt \u2022 Adoption',
      engagements: '20+', years: '9+',
      quote: 'The best technology in the world is worthless if people don\'t use it. I specialise in the human side of digital transformation \u2014 getting buy-in, building confidence, and making sure every rollout sticks.',
      highlightWords: ['use'],
      inspiration: 'Watching the \'light-bulb moment\' when a sceptical user discovers a feature that changes their day. Designing training programmes that people actually enjoy attending. Turning resistance into enthusiasm.',
      hobbies: [
        { emoji: '\u26BD', label: 'Football' },
        { emoji: '\uD83C\uDF73', label: 'Cooking' },
        { emoji: '\uD83D\uDCDA', label: 'History Books' },
        { emoji: '\uD83D\uDE97', label: 'Road Trips' },
        { emoji: '\uD83C\uDFA7', label: 'Podcasts' },
      ],
      websites: ['Prosci \u2014 change management', 'LinkedIn Learning', 'Harvard Business Review'],
    },
  ],

  stats: [
    { value: '12', label: 'Service Areas' },
    { value: '29', label: 'Products' },
    { value: '50+', label: 'Engagements' },
  ],

  testimonial: {
    quote: 'The DWx team transformed how we approach our M365 engagements. Their discovery process is thorough, the specialists really understand the platform, and turnaround on proposals is consistently fast. It\u2019s made a real difference to our pipeline.',
    name: 'Sindy Kotse',
    role: 'Senior Account Manager',
    company: 'First Technology Group',
    avatarUrl: 'https://i.pravatar.cc/88?img=47',
    rating: 5,
  },

  mastheadText: {
    title: 'Your Digital',
    titleAccent: 'Partner',
    lead: 'Digital Workplace is First Technology Group\u2019s Microsoft 365 practice. We combine deep platform expertise with business acumen to deliver solutions that drive real productivity gains \u2014 from Power Platform apps to enterprise Copilot agents.',
  },

  teamPanelText: {
    title: 'Your',
    titleAccent: 'DWx',
    subtitle: 'One team, one mission \u2014 we collaborate across disciplines to deliver precision-engineered solutions. From first discovery to final deployment, every engagement is a partnership built on trust, expertise, and a shared drive for excellence.',
  },

  footerText: {
    brandTitle: 'Digital',
    brandTitleAccent: 'Workplace',
    brandDescription: 'A practice of First Technology Group. We design, build, and support modern workplace solutions on the Microsoft 365 platform \u2014 serving organisations across South Africa and the United Kingdom.',
    copyright: '\u00a9 2026 First Technology Group \u2022 Digital Workplace',
  },

  footerServices: ['Power Platform', 'SPFx Development', 'SharePoint Migration', 'M365 Assessment', 'Copilot Agents', 'Microsoft Viva'],

  footerProducts: ['DWx Business Apps', 'SharePoint Web Parts', 'Teams Adaptive Cards', 'License Pulse', 'Knowledge Base'],

  footerResources: [
    { label: 'Submit a Request', route: '/request' },
    { label: 'My Requests', route: '/requests' },
    { label: 'Contact the Team', route: '/services' },
    { label: 'About DWx', route: '/' },
  ],
};
