/**
 * DWx Traffic Manager - Product Catalog
 * V1 Hero with integrated header + glassmorphic tab pills
 * All 4 tabs share a unified hero that transitions gradient per tab
 */

import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  Card,
  Button,
  makeStyles,
  shorthands,
  DialogSurface,
  Dialog,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  Apps24Regular,
  PuzzlePiece24Regular,
  CardUi24Regular,
  BotRegular,
  Dismiss24Regular,
  // Product icon imports
  ChartMultiple24Regular,
  DocumentPersonRegular,
  FolderOpen24Regular,
  LinkMultiple24Regular,
  Trophy24Regular,
  PlugConnected24Regular,
  Key24Regular,
  Cart24Regular,
  QuestionCircle24Regular,
  DataBarVertical24Regular,
  ClipboardTask24Regular,
  PeopleTeam24Regular,
  HatGraduation24Regular,
  DocumentEdit24Regular,
  Shield24Regular,
  Pulse24Regular,
  // HyperParts icons
  Image24Regular,
  CompassNorthwest24Regular,
  News24Regular,
  Search24Regular,
  Person24Regular,
  DocumentFolder24Regular,
  Globe24Regular,
  Flash24Regular,
  TabDesktop24Regular,
  Poll24Regular,
  Megaphone24Regular,
  Star24Regular,
  BookOpen24Regular,
  CalendarLtr24Regular,
  Navigation24Regular,
  ChatBubblesQuestion24Regular,
  Gift24Regular,
  WindowShield24Regular,
  DataTrending24Regular,
  Timeline24Regular,
  // HyperCards icons
  CalendarPerson24Regular,
  CheckmarkCircle24Regular,
  Warning24Regular,
  ChatMultiple24Regular,
  Notepad24Regular,
  TaskListSquareLtr24Regular,
  // HyperAgents icons
  BotSparkle24Regular,
  LockClosed24Regular,
  PeopleSearch24Regular,
  PersonArrowRight24Regular,
  BuildingShop24Regular,
  DocumentSearch24Regular,
  DesktopPulse24Regular,
  Airplane24Regular,
  LibraryRegular,
} from '@fluentui/react-icons';
import {
  Product,
  ProductType,
  DWX_APPS,
  HYPERPARTS,
  HYPERCARDS,
  HYPERAGENTS,
  getCategoriesForType,
} from '../../types/Product';
import { DW_COLORS } from '../../utils/buttonStyles';
import { useHeroCollapse } from '../../hooks/useHeroCollapse';
import { HeroCollapseToggle } from '../Common/HeroCollapseToggle';

// ============================================================
// Product Icon Mapping — Professional SVG line icons per product
// ============================================================
const PRODUCT_ICONS: Record<string, React.ReactElement> = {
  // DWx Apps (16)
  'asset-dashboard': <ChartMultiple24Regular />,
  'cv-management': <DocumentPersonRegular />,
  'document-hub': <FolderOpen24Regular />,
  'external-sharing-hub': <LinkMultiple24Regular />,
  'gamification': <Trophy24Regular />,
  'integration-hub': <PlugConnected24Regular />,
  'license-management': <Key24Regular />,
  'procurement-manager': <Cart24Regular />,
  'quiz-builder': <QuestionCircle24Regular />,
  'reports-builder': <DataBarVertical24Regular />,
  'survey-management': <ClipboardTask24Regular />,
  'recruitment-manager': <PeopleTeam24Regular />,
  'training-skills': <HatGraduation24Regular />,
  'contract-manager': <DocumentEdit24Regular />,
  'policy-manager': <Shield24Regular />,
  'license-pulse': <Pulse24Regular />,
  // HyperParts (20)
  'hyper-hero': <Image24Regular />,
  'hyper-nav': <CompassNorthwest24Regular />,
  'hyper-news': <News24Regular />,
  'hyper-rollup': <Search24Regular />,
  'hyper-profile': <Person24Regular />,
  'hyper-explorer': <DocumentFolder24Regular />,
  'hyper-local': <Globe24Regular />,
  'hyper-action': <Flash24Regular />,
  'hyper-tabs': <TabDesktop24Regular />,
  'hyper-poll': <Poll24Regular />,
  'hyper-ticker': <Megaphone24Regular />,
  'hyper-recognition': <Star24Regular />,
  'hyper-faq': <BookOpen24Regular />,
  'hyper-events': <CalendarLtr24Regular />,
  'hyper-breadcrumb': <Navigation24Regular />,
  'hyper-feedback': <ChatBubblesQuestion24Regular />,
  'hyper-birthdays': <Gift24Regular />,
  'hyper-external': <WindowShield24Regular />,
  'hyper-metrics': <DataTrending24Regular />,
  'hyper-timeline': <Timeline24Regular />,
  // HyperCards (6)
  'leave-request-card': <CalendarPerson24Regular />,
  'approval-card': <CheckmarkCircle24Regular />,
  'incident-report': <Warning24Regular />,
  'feedback-card': <ChatMultiple24Regular />,
  'meeting-summary': <Notepad24Regular />,
  'task-assignment': <TaskListSquareLtr24Regular />,
  // HyperAgents (10)
  'it-service-desk-assistant': <BotSparkle24Regular />,
  'access-identity-requests': <LockClosed24Regular />,
  'hr-policy-leave-advisor': <PeopleSearch24Regular />,
  'employee-onboarding-concierge': <PersonArrowRight24Regular />,
  'procurement-helpdesk': <Cart24Regular />,
  'supplier-query-assistant': <BuildingShop24Regular />,
  'contract-policy-search': <DocumentSearch24Regular />,
  'asset-device-lifecycle': <DesktopPulse24Regular />,
  'travel-expense-policy': <Airplane24Regular />,
  'internal-knowledge-navigator': <LibraryRegular />,
};

// ============================================================
// Tab Configuration
// ============================================================

interface TabData {
  label: string;
  icon: React.ReactNode;
  products: Product[];
  color: string;
  heroTitle: string;
  heroAccent: string;
  heroDescription: string;
  heroGradient: string;
  accentColor: string;
  stats: { value: string; label: string }[];
  features: string[];
}

type TabValue = 'apps' | 'webparts' | 'cards' | 'agents';

const TAB_CONFIG: Record<TabValue, TabData> = {
  apps: {
    label: 'DWx Apps',
    icon: <Apps24Regular />,
    products: DWX_APPS,
    color: DW_COLORS.primary,
    heroTitle: 'DWx Application',
    heroAccent: 'Suite',
    heroDescription:
      '16 enterprise-grade SPFx applications covering HR, Operations, Document Management, and Employee Engagement — built on Fluent UI v9 and Microsoft Graph.',
    heroGradient: 'linear-gradient(135deg, #0d3a5c 0%, #1a5a8a 50%, #2a7ab0 100%)',
    accentColor: '#7dd3fc',
    stats: [
      { value: '16', label: 'Apps' },
      { value: '5', label: 'Categories' },
      { value: 'SPFx 1.18+', label: 'Framework' },
      { value: 'Fluent v9', label: 'Design System' },
    ],
    features: [
      'Built on SharePoint Framework (SPFx) 1.18+',
      'Fluent UI v9 responsive design system',
      'Role-based access control (RBAC)',
      'Microsoft Graph API integration',
      'Power Automate workflow connectors',
      'Export to Excel / PDF reporting',
      'Multi-language support (i18n)',
      'Teams personal app integration',
    ],
  },
  webparts: {
    label: 'HyperParts',
    icon: <PuzzlePiece24Regular />,
    products: HYPERPARTS,
    color: '#7c3aed',
    heroTitle: 'The HyperParts',
    heroAccent: 'Suite',
    heroDescription:
      '20 next-gen SPFx web parts engineered for Hyper-Performance, Hyper-Flexibility, and Hyper-Integration — transforming your intranet into an interactive command center.',
    heroGradient: 'linear-gradient(135deg, #1e1040 0%, #4c1d95 50%, #7c3aed 100%)',
    accentColor: '#c4b5fd',
    stats: [
      { value: '20', label: 'Web Parts' },
      { value: '15', label: 'Categories' },
      { value: 'SPFx 1.18+', label: 'Framework' },
      { value: 'Fluent v9', label: 'Design System' },
    ],
    features: [
      'SPFx 1.18+ with React 18 support',
      'Fluent UI v9 design system',
      'Property pane configuration UI',
      'Adaptive responsive layouts',
      'Web part connections support',
      'Theme-aware styling',
      'Section backgrounds support',
      'Performance optimized with lazy loading',
    ],
  },
  cards: {
    label: 'HyperCards',
    icon: <CardUi24Regular />,
    products: HYPERCARDS,
    color: '#0d9488',
    heroTitle: 'The HyperCards',
    heroAccent: 'Collection',
    heroDescription:
      '6 interactive HyperCards for Microsoft Teams — enabling leave requests, approvals, incident reporting, and task management directly within chat and channels.',
    heroGradient: 'linear-gradient(135deg, #064e3b 0%, #0d9488 50%, #14b8a6 100%)',
    accentColor: '#5eead4',
    stats: [
      { value: '6', label: 'Cards' },
      { value: '4', label: 'Categories' },
      { value: 'Teams SDK', label: 'Platform' },
      { value: 'v1.5', label: 'Schema' },
    ],
    features: [
      'HyperCard schema v1.5',
      'Microsoft Teams SDK integration',
      'Bot Framework messaging support',
      'Universal Actions for multi-platform',
      'Data binding with templating',
      'Refresh and auto-update support',
      'Accessibility compliant (WCAG 2.1)',
      'Power Automate trigger integration',
    ],
  },
  agents: {
    label: 'HyperAgents',
    icon: <BotRegular />,
    products: HYPERAGENTS,
    color: '#6366f1',
    heroTitle: 'The HyperAgents',
    heroAccent: 'Collection',
    heroDescription:
      '10 intelligent Copilot Studio agents powered by GPT-4o — automating IT support, HR inquiries, procurement, and knowledge discovery across your organization.',
    heroGradient: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #6366f1 100%)',
    accentColor: '#a5b4fc',
    stats: [
      { value: '10', label: 'Agents' },
      { value: '5', label: 'Categories' },
      { value: 'Copilot Studio', label: 'Platform' },
      { value: 'GPT-4o', label: 'AI Model' },
    ],
    features: [
      'Built on Copilot Studio platform',
      'GPT-4o language model integration',
      'Microsoft Graph knowledge grounding',
      'HyperCard response rendering',
      'Multi-turn conversation support',
      'Power Automate plugin actions',
      'SharePoint knowledge base indexing',
      'Teams channel and chat deployment',
    ],
  },
};

// ============================================================
// Styles
// ============================================================

const useStyles = makeStyles({
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    ...shorthands.padding('0', '64px', '24px'),
  },
  heroWrapper: {
    position: 'relative',
    marginBottom: '20px',
  },
  // V1 Hero with integrated header + tabs
  heroBanner: {
    ...shorthands.borderRadius('0', '0', '16px', '16px'),
    ...shorthands.padding('0'),
    position: 'relative',
    ...shorthands.overflow('hidden'),
    transitionProperty: 'background, max-height',
    transitionDuration: '0.4s',
    transitionTimingFunction: 'ease',
  },
  heroExpanded: {
    maxHeight: '400px',
  },
  heroCollapsed: {
    maxHeight: '56px',
  },
  collapsedStrip: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px'),
    ...shorthands.padding('0', '32px'),
    height: '56px',
    position: 'relative',
    zIndex: 2,
  },
  collapsedTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'white',
  },
  collapsedBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    ...shorthands.padding('3px', '10px'),
    ...shorthands.borderRadius('10px'),
  },
  collapsedTabPill: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.2)',
    ...shorthands.padding('4px', '14px'),
    ...shorthands.borderRadius('14px'),
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.3)'),
    cursor: 'pointer',
  },
  collapsedTabPillInactive: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    fontSize: '12px',
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    backgroundColor: 'transparent',
    ...shorthands.padding('4px', '14px'),
    ...shorthands.borderRadius('14px'),
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.15)'),
    cursor: 'pointer',
  },
  heroDecoration: {
    position: 'absolute',
    top: '-80px',
    right: '-40px',
    width: '300px',
    height: '300px',
    ...shorthands.borderRadius('50%'),
    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  // Page header row inside the hero
  heroHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    ...shorthands.padding('20px', '32px', '0'),
    position: 'relative',
    zIndex: 2,
  },
  heroHeaderTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: 'white',
    letterSpacing: '-0.3px',
  },
  heroHeaderSubtitle: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    marginTop: '2px',
  },
  backButtonHero: {
    ...shorthands.padding('6px', '14px'),
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.25)'),
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.85)',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  // Glassmorphic tab row
  tabsRow: {
    display: 'flex',
    gap: '6px',
    ...shorthands.padding('20px', '32px', '0'),
    position: 'relative',
    zIndex: 2,
  },
  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    ...shorthands.padding('8px', '20px'),
    ...shorthands.borderRadius('20px'),
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.25)'),
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    backdropFilter: 'blur(8px)',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    color: 'white',
    ...shorthands.borderColor('rgba(255,255,255,0.45)'),
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  tabCount: {
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.2)',
    ...shorthands.padding('1px', '8px'),
    ...shorthands.borderRadius('10px'),
    minWidth: '22px',
    textAlign: 'center',
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  // Hero content row (icon + title + description | stats)
  heroContentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
    ...shorthands.padding('18px', '32px', '22px'),
    position: 'relative',
    zIndex: 2,
  },
  heroLeft: {
    flex: '1',
    minWidth: '0',
  },
  heroTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  heroIcon: {
    width: '36px',
    height: '36px',
    ...shorthands.borderRadius('10px'),
    backgroundColor: 'rgba(255,255,255,0.1)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.15)'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'white',
    letterSpacing: '-0.3px',
  },
  heroDesc: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: 'rgba(255,255,255,0.7)',
    maxWidth: '700px',
  },
  heroStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flexShrink: 0,
    paddingLeft: '32px',
    ...shorthands.borderLeft('1px', 'solid', 'rgba(255,255,255,0.12)'),
  },
  heroStat: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  heroStatValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'white',
    whiteSpace: 'nowrap',
  },
  heroStatLabel: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },

  // Scrollable pills filter (for HyperParts)
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  filterPillsScroll: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    flex: '1',
    scrollbarWidth: 'none',
  },
  filterPill: {
    ...shorthands.padding('8px', '16px'),
    ...shorthands.borderRadius('20px'),
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    ...shorthands.border('1px', 'solid', '#d0d0d0'),
    backgroundColor: 'white',
    color: '#333333',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  filterPillActive: {
    color: 'white',
  },
  pillCount: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '16px',
    height: '16px',
    ...shorthands.borderRadius('8px'),
    fontSize: '10px',
    marginLeft: '4px',
    ...shorthands.padding('0', '4px'),
  },
  pillCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    color: 'white',
  },
  pillCountInactive: {
    backgroundColor: '#f0f0f0',
    color: '#888888',
  },

  // Category chips filter (for non-HyperParts tabs)
  categorySection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  categoryLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#6c757d',
    marginBottom: '12px',
  },
  categoryChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  categoryChip: {
    ...shorthands.padding('8px', '16px'),
    ...shorthands.borderRadius('20px'),
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    ...shorthands.border('1px', 'solid', '#d0d0d0'),
    backgroundColor: 'white',
    color: '#333333',
  },

  // Products grid
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px',
  },

  // Product card — fixed height with pinned button
  productCard: {
    ...shorthands.borderRadius('12px'),
    ...shorthands.overflow('hidden'),
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    ...shorthands.border('1px', 'solid', '#e0e0e0'),
    display: 'flex',
    flexDirection: 'column',
    height: '260px',
  },
  productImage: {
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...shorthands.overflow('hidden'),
    flexShrink: 0,
  },
  productSplash: {
    textAlign: 'center',
    color: 'white',
    ...shorthands.padding('12px'),
  },
  productBrand: {
    fontSize: '8px',
    letterSpacing: '1.5px',
    opacity: 0.8,
    marginBottom: '2px',
  },
  productDwx: {
    fontSize: '16px',
    fontWeight: '800',
    marginBottom: '4px',
  },
  productDwxSpan: {
    color: 'rgba(255,255,255,0.7)',
  },
  productSplashIcon: {
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productVersion: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('10px'),
    fontSize: '10px',
    color: 'white',
    fontWeight: '500',
  },
  productContent: {
    ...shorthands.padding('12px'),
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    minHeight: '0',
  },
  productTypeTag: {
    display: 'inline-block',
    fontSize: '10px',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('8px'),
    marginBottom: '6px',
    fontWeight: '500',
    alignSelf: 'flex-start',
  },
  appTag: {
    backgroundColor: '#e8f4fc',
    color: '#1a5a8a',
  },
  webpartTag: {
    backgroundColor: '#f3e8ff',
    color: '#7c3aed',
  },
  cardTag: {
    backgroundColor: '#e6fffa',
    color: '#0d9488',
  },
  agentTag: {
    backgroundColor: '#eef2ff',
    color: '#6366f1',
  },
  productTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#333333',
    marginBottom: '2px',
    lineHeight: '1.2',
  },
  productSubtitle: {
    fontSize: '11px',
    color: '#6c757d',
    lineHeight: '1.3',
  },
  productFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: '8px',
    ...shorthands.borderTop('1px', 'solid', '#f0f0f0'),
    marginTop: 'auto',
  },
  requestBtn: {
    ...shorthands.padding('6px', '12px'),
    fontSize: '11px',
  },

  // Product Detail Modal
  modalSurface: {
    maxWidth: '560px',
    width: '100%',
    maxHeight: '85vh',
    ...shorthands.padding('0'),
    ...shorthands.borderRadius('12px'),
    ...shorthands.overflow('hidden'),
    ...shorthands.border('none'),
  },
  modalHero: {
    ...shorthands.padding('20px', '24px'),
    position: 'relative',
    ...shorthands.overflow('hidden'),
    ...shorthands.margin('0'),
  },
  modalHeroDecoration: {
    position: 'absolute',
    top: '-40px',
    right: '-20px',
    width: '140px',
    height: '140px',
    ...shorthands.borderRadius('50%'),
    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  modalHeroContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  modalHeroIcon: {
    width: '48px',
    height: '48px',
    ...shorthands.borderRadius('12px'),
    backgroundColor: 'rgba(255,255,255,0.12)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.2)'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    flexShrink: 0,
  },
  modalHeroBadge: {
    position: 'absolute',
    top: '14px',
    right: '48px',
    fontSize: '10px',
    backgroundColor: 'rgba(255,255,255,0.18)',
    ...shorthands.padding('3px', '10px'),
    ...shorthands.borderRadius('10px'),
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    letterSpacing: '0.3px',
    textTransform: 'uppercase' as const,
    zIndex: 2,
  },
  modalHeroTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'white',
    lineHeight: '1.2',
    ...shorthands.margin('0'),
    ...shorthands.padding('0'),
  },
  modalHeroSubtitle: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    marginTop: '1px',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    zIndex: 2,
    ...shorthands.border('none'),
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    ...shorthands.borderRadius('6px'),
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transitionProperty: 'background',
    transitionDuration: '0.15s',
  },
  modalBody: {
    ...shorthands.padding('16px', '24px', '20px'),
  },
  modalMeta: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '14px',
  },
  modalMetaItem: {
    fontSize: '11px',
    color: '#666',
    backgroundColor: '#f5f5f5',
    ...shorthands.padding('3px', '10px'),
    ...shorthands.borderRadius('4px'),
  },
  modalDescription: {
    fontSize: '13px',
    lineHeight: '1.65',
    color: '#444',
    marginBottom: '16px',
  },
  modalFeaturesTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  modalFeaturesList: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '5px',
    marginBottom: '16px',
    listStyleType: 'none',
    ...shorthands.padding('0'),
  },
  modalFeatureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
    fontSize: '12px',
    color: '#555',
    lineHeight: '1.5',
  },
  modalFeatureDot: {
    width: '5px',
    height: '5px',
    ...shorthands.borderRadius('50%'),
    flexShrink: 0,
    marginTop: '6px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    paddingTop: '12px',
    ...shorthands.borderTop('1px', 'solid', '#eee'),
  },

  // Gradient classes
  'gradient-slate': { background: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)' },
  'gradient-corporate-blue': { background: 'linear-gradient(135deg, #1a5a8a 0%, #0d3a5c 100%)' },
  'gradient-charcoal': { background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)' },
  'gradient-ocean-depth': { background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)' },
  'gradient-royal-purple': { background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' },
  'gradient-forest-teal': { background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' },
  'gradient-coral': { background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' },
  'gradient-rose': { background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)' },
  'gradient-indigo': { background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' },
  'gradient-emerald': { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  'gradient-amber': { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
  'gradient-sky': { background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' },
  'gradient-violet': { background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' },
  'gradient-cyan': { background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
  'gradient-pink': { background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' },
  'gradient-blue-gray': { background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)' },
  'gradient-teal': { background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' },
  'gradient-lime': { background: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)' },
});

// ============================================================
// Tag label mapping
// ============================================================

const TAG_LABELS: Record<ProductType, string> = {
  app: 'DWx App',
  webpart: 'HyperPart',
  'adaptive-card': 'HyperCard',
  agent: 'HyperAgent',
};

// ============================================================
// Component
// ============================================================

export const ProductCatalog: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { isCollapsed, toggle } = useHeroCollapse('products');
  const [activeTab, setActiveTab] = useState<TabValue>('apps');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const pillsRef = useRef<HTMLDivElement>(null);

  const currentConfig = TAB_CONFIG[activeTab];
  const isHyperParts = activeTab === 'webparts';

  const categories = useMemo(() => {
    const typeMap: Record<TabValue, ProductType> = {
      apps: 'app',
      webparts: 'webpart',
      cards: 'adaptive-card',
      agents: 'agent',
    };
    return getCategoriesForType(typeMap[activeTab]);
  }, [activeTab]);

  const filteredProducts = useMemo(() => {
    let products = currentConfig.products;
    if (selectedCategory !== 'all') {
      products = products.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return products;
  }, [currentConfig.products, selectedCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    currentConfig.products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [currentConfig.products]);

  const handleTabClick = (tab: TabValue) => {
    setActiveTab(tab);
    setSelectedCategory('all');
    setSearchQuery('');
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleRequestDemo = (product: Product) => {
    navigate('/product-request', { state: { productRequest: product } });
  };

  const handleCardClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const getGradientClass = (gradient: string): string => {
    const gradientMap: Record<string, string> = {
      slate: styles['gradient-slate'],
      'corporate-blue': styles['gradient-corporate-blue'],
      charcoal: styles['gradient-charcoal'],
      'ocean-depth': styles['gradient-ocean-depth'],
      'royal-purple': styles['gradient-royal-purple'],
      'forest-teal': styles['gradient-forest-teal'],
      coral: styles['gradient-coral'],
      rose: styles['gradient-rose'],
      indigo: styles['gradient-indigo'],
      emerald: styles['gradient-emerald'],
      amber: styles['gradient-amber'],
      sky: styles['gradient-sky'],
      violet: styles['gradient-violet'],
      cyan: styles['gradient-cyan'],
      pink: styles['gradient-pink'],
      'blue-gray': styles['gradient-blue-gray'],
      teal: styles['gradient-teal'],
      lime: styles['gradient-lime'],
    };
    return gradientMap[gradient] || styles['gradient-corporate-blue'];
  };

  const getTagClass = (type: ProductType): string => {
    switch (type) {
      case 'app':
        return styles.appTag;
      case 'webpart':
        return styles.webpartTag;
      case 'adaptive-card':
        return styles.cardTag;
      case 'agent':
        return styles.agentTag;
      default:
        return styles.appTag;
    }
  };

  return (
    <div className={styles.container}>
      {/* V1 Hero Banner — Header + Tabs + Content all inside the gradient */}
      <div className={styles.heroWrapper}>
        <div
          className={`${styles.heroBanner} ${isCollapsed ? styles.heroCollapsed : styles.heroExpanded}`}
          style={{ background: currentConfig.heroGradient }}
        >
          <div className={styles.heroDecoration} />

          {isCollapsed ? (
            <div className={styles.collapsedStrip}>
              <span className={styles.collapsedTitle}>Products</span>
              {(Object.entries(TAB_CONFIG) as [TabValue, TabData][]).map(([key, config]) => (
                <button
                  key={key}
                  className={activeTab === key ? styles.collapsedTabPill : styles.collapsedTabPillInactive}
                  onClick={() => handleTabClick(key)}
                >
                  {config.label}
                </button>
              ))}
              <span className={styles.collapsedBadge}>{currentConfig.products.length} items</span>
            </div>
          ) : (
            <>
              {/* Page header row */}
              <div className={styles.heroHeaderRow}>
                <div>
                  <div className={styles.heroHeaderTitle}>Product Catalog</div>
                  <div className={styles.heroHeaderSubtitle}>
                    DWx Apps, HyperParts, HyperCards, and HyperAgents for your digital workplace
                  </div>
                </div>
                <button
                  className={styles.backButtonHero}
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft24Regular style={{ fontSize: '16px' }} />
                  Back to Home
                </button>
              </div>

              {/* Glassmorphic tab pills */}
              <div className={styles.tabsRow}>
                {(Object.entries(TAB_CONFIG) as [TabValue, TabData][]).map(([key, config]) => (
                  <button
                    key={key}
                    className={`${styles.tabBtn} ${activeTab === key ? styles.tabBtnActive : ''}`}
                    onClick={() => handleTabClick(key)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '16px' }}>{config.icon}</span>
                    <span>{config.label}</span>
                    <span className={`${styles.tabCount} ${activeTab === key ? styles.tabCountActive : ''}`}>
                      {config.products.length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Tab-specific content row */}
              <div className={styles.heroContentRow}>
                <div className={isHyperParts ? styles.heroLeft : undefined} style={!isHyperParts ? { flex: 1 } : undefined}>
                  <div className={styles.heroTop}>
                    <div className={styles.heroIcon}>
                      <span style={{ color: currentConfig.accentColor, fontSize: '18px', display: 'flex' }}>
                        {currentConfig.icon}
                      </span>
                    </div>
                    <Text className={styles.heroTitle}>
                      {currentConfig.heroTitle}{' '}
                      <span style={{ color: currentConfig.accentColor }}>{currentConfig.heroAccent}</span>
                    </Text>
                  </div>
                  <div className={styles.heroDesc}>{currentConfig.heroDescription}</div>
                </div>
                {isHyperParts && (
                  <div className={styles.heroStats}>
                    {currentConfig.stats.map((stat, i) => (
                      <div key={i} className={styles.heroStat}>
                        <Text className={styles.heroStatValue}>{stat.value}</Text>
                        <Text className={styles.heroStatLabel}>{stat.label}</Text>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <HeroCollapseToggle isCollapsed={isCollapsed} onToggle={toggle} />
      </div>

      {/* Filter area — pills for HyperParts, chips for others */}
      {isHyperParts ? (
        <div className={styles.filterBar}>
          <div
            ref={pillsRef}
            className={styles.filterPillsScroll}
            style={{
              maskImage: 'linear-gradient(to right, black 90%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent 100%)',
            }}
          >
            <button
              className={`${styles.filterPill} ${selectedCategory === 'all' ? styles.filterPillActive : ''}`}
              onClick={() => handleCategoryClick('all')}
              style={
                selectedCategory === 'all'
                  ? { backgroundColor: currentConfig.color, borderColor: currentConfig.color }
                  : undefined
              }
            >
              All
              <span
                className={`${styles.pillCount} ${selectedCategory === 'all' ? styles.pillCountActive : styles.pillCountInactive}`}
              >
                {currentConfig.products.length}
              </span>
            </button>
            {categories.map((category) => (
              <button
                key={category}
                className={`${styles.filterPill} ${selectedCategory === category ? styles.filterPillActive : ''}`}
                onClick={() => handleCategoryClick(category)}
                style={
                  selectedCategory === category
                    ? { backgroundColor: currentConfig.color, borderColor: currentConfig.color }
                    : undefined
                }
              >
                {category}
                <span
                  className={`${styles.pillCount} ${selectedCategory === category ? styles.pillCountActive : styles.pillCountInactive}`}
                >
                  {categoryCounts[category] || 0}
                </span>
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search HyperParts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '7px 12px 7px 34px',
              borderRadius: '8px',
              border: '1px solid #d0d0d0',
              fontSize: '13px',
              color: '#333',
              width: '240px',
              flexShrink: 0,
              outline: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='11' cy='11' r='7' stroke='%239ca3af' stroke-width='2'/%3E%3Cline x1='16.5' y1='16.5' x2='21' y2='21' stroke='%239ca3af' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: '10px center',
            }}
          />
        </div>
      ) : (
        <div className={styles.categorySection}>
          <div className={styles.categoryChips}>
            <button
              className={styles.categoryChip}
              onClick={() => handleCategoryClick('all')}
              style={
                selectedCategory === 'all'
                  ? { backgroundColor: currentConfig.color, borderColor: currentConfig.color, color: 'white' }
                  : undefined
              }
            >
              All {currentConfig.label}
            </button>
            {categories.map((category) => (
              <button
                key={category}
                className={styles.categoryChip}
                onClick={() => handleCategoryClick(category)}
                style={
                  selectedCategory === category
                    ? { backgroundColor: currentConfig.color, borderColor: currentConfig.color, color: 'white' }
                    : undefined
                }
              >
                {category}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder={`Search ${currentConfig.label}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '7px 12px 7px 34px',
              borderRadius: '8px',
              border: '1px solid #d0d0d0',
              fontSize: '13px',
              color: '#333',
              width: '240px',
              flexShrink: 0,
              outline: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='11' cy='11' r='7' stroke='%239ca3af' stroke-width='2'/%3E%3Cline x1='16.5' y1='16.5' x2='21' y2='21' stroke='%239ca3af' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: '10px center',
            }}
          />
        </div>
      )}

      {/* Products Grid */}
      <div className={styles.productsGrid}>
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            className={styles.productCard}
            onClick={() => handleCardClick(product)}
          >
            <div className={`${styles.productImage} ${getGradientClass(product.gradient)}`}>
              <span className={styles.productVersion}>{product.version}</span>
              <div className={styles.productSplash}>
                <div className={styles.productBrand}>{product.brand}</div>
                <div className={styles.productDwx}>
                  DW<span className={styles.productDwxSpan}>x</span>
                </div>
                <div className={styles.productSplashIcon}>{PRODUCT_ICONS[product.id] || product.icon}</div>
              </div>
            </div>
            <div className={styles.productContent}>
              <span className={`${styles.productTypeTag} ${getTagClass(product.type)}`}>{product.category}</span>
              <Text className={styles.productTitle} block>
                {product.name}
              </Text>
              <Text className={styles.productSubtitle} block>
                {product.subtitle}
              </Text>
              <div className={styles.productFooter}>
                <Button
                  appearance="primary"
                  size="small"
                  className={styles.requestBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRequestDemo(product);
                  }}
                  style={{ backgroundColor: currentConfig.color }}
                >
                  Request Demo
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Product Detail Modal */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={(_, data) => {
          if (!data.open) setSelectedProduct(null);
        }}
      >
        <DialogSurface className={styles.modalSurface} aria-label="Product details">
          {selectedProduct && (
            <>
              {/* Modal gradient hero */}
              <div
                className={styles.modalHero}
                style={{ background: currentConfig.heroGradient }}
              >
                <div className={styles.modalHeroDecoration} />
                <button
                  className={styles.modalCloseBtn}
                  onClick={() => setSelectedProduct(null)}
                  aria-label="Close"
                >
                  <Dismiss24Regular />
                </button>
                <div className={styles.modalHeroBadge}>
                  {TAG_LABELS[selectedProduct.type]} &bull; {selectedProduct.category}
                </div>
                <div className={styles.modalHeroContent}>
                  <div className={styles.modalHeroIcon}>{PRODUCT_ICONS[selectedProduct.id] || selectedProduct.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.modalHeroTitle}>
                      {selectedProduct.name}
                    </div>
                    <div className={styles.modalHeroSubtitle}>{selectedProduct.subtitle}</div>
                  </div>
                </div>
              </div>

              {/* Modal body */}
              <div className={styles.modalBody}>
                {/* Metadata chips */}
                <div className={styles.modalMeta}>
                  <span className={styles.modalMetaItem}>
                    <strong>Version:</strong> {selectedProduct.version}
                  </span>
                  <span className={styles.modalMetaItem}>
                    <strong>Brand:</strong> {selectedProduct.brand}
                  </span>
                  <span className={styles.modalMetaItem}>
                    <strong>Category:</strong> {selectedProduct.category}
                  </span>
                  <span className={styles.modalMetaItem}>
                    <strong>Type:</strong> {TAG_LABELS[selectedProduct.type]}
                  </span>
                </div>

                {/* Description */}
                <div className={styles.modalDescription}>{selectedProduct.description}</div>

                {/* Key Features */}
                <div className={styles.modalFeaturesTitle}>Key Features</div>
                <div className={styles.modalFeaturesList}>
                  {currentConfig.features.map((feature, i) => (
                    <div key={i} className={styles.modalFeatureItem}>
                      <div
                        className={styles.modalFeatureDot}
                        style={{ backgroundColor: currentConfig.color }}
                      />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Footer actions */}
                <div className={styles.modalFooter}>
                  <Button size="small" appearance="secondary" onClick={() => setSelectedProduct(null)}>
                    Close
                  </Button>
                  <Button
                    size="small"
                    appearance="primary"
                    onClick={() => {
                      handleRequestDemo(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    style={{ backgroundColor: currentConfig.color }}
                  >
                    Request Demo
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default ProductCatalog;
