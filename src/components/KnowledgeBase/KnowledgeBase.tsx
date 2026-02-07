/**
 * DWx Traffic Manager - Knowledge Base (V3 Magazine / Editorial)
 * Full-width editorial layout with hero banner, featured articles,
 * FAQ numbered cards, and glossary grid with alphabet bar.
 * Hero width matches Products page pattern (1400px container).
 * Route: /knowledge-base
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  makeStyles,
  shorthands,
  Spinner,
} from '@fluentui/react-components';
import {
  BookOpen24Regular,
  SearchRegular,
  ArrowLeft24Regular,
} from '@fluentui/react-icons';
import { KBEntry } from '../../types/KnowledgeBase';
import { knowledgeBaseService } from '../../services/KnowledgeBaseService';
import { FAQSection } from './FAQSection';
import { GlossarySection } from './GlossarySection';
import { ArticleSection } from './ArticleSection';
import { useHeroCollapse } from '../../hooks/useHeroCollapse';
import { HeroCollapseToggle } from '../Common/HeroCollapseToggle';

type KBSection = 'articles' | 'faq' | 'glossary';

// Category badge color map
const CATEGORY_GRADIENTS: Record<string, string> = {
  Process: 'linear-gradient(135deg, #0d3a5c, #1e6b7b)',
  Services: 'linear-gradient(135deg, #1e6b7b, #2a8d6e)',
  Technical: 'linear-gradient(135deg, #1a5a8a, #3a7bd5)',
  Products: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
  General: 'linear-gradient(135deg, #0d3a5c, #1a5a8a)',
  Commercial: 'linear-gradient(135deg, #1e6b7b, #1a5a8a)',
};

const useStyles = makeStyles({
  // Container matches Products page: 1400px max, 0 64px 24px padding
  container: {
    maxWidth: '1400px',
    ...shorthands.margin('0', 'auto'),
    ...shorthands.padding('0', '64px', '24px'),
  },

  heroWrapper: {
    position: 'relative',
    marginBottom: '20px',
  },
  // Hero banner inside container with rounded bottom corners (Products pattern)
  heroBanner: {
    ...shorthands.borderRadius('0', '0', '16px', '16px'),
    ...shorthands.padding('0'),
    position: 'relative',
    ...shorthands.overflow('hidden'),
    background: 'linear-gradient(135deg, #0d3a5c 0%, #1a5a8a 100%)',
  },
  heroExpanded: {
    maxHeight: '400px',
    transitionProperty: 'max-height',
    transitionDuration: '350ms',
    transitionTimingFunction: 'ease',
  },
  heroCollapsed: {
    maxHeight: '56px',
    transitionProperty: 'max-height',
    transitionDuration: '350ms',
    transitionTimingFunction: 'ease',
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

  // Row 1: Page header (matches ServiceCatalog/ProductCatalog heroHeaderRow)
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

  // Row 2: Glassmorphic search bar (matches ServiceCatalog heroSearchRow)
  heroSearchRow: {
    ...shorthands.padding('14px', '32px', '0'),
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  heroSearchBar: {
    display: 'flex',
    alignItems: 'center',
    flex: '1',
    maxWidth: '560px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.25)'),
    ...shorthands.borderRadius('20px'),
    backdropFilter: 'blur(8px)',
    ...shorthands.overflow('hidden'),
  },
  heroSearchIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: '16px',
    color: 'rgba(255,255,255,0.5)',
  },
  heroSearchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    ...shorthands.border('none'),
    ...shorthands.padding('10px', '16px'),
    fontSize: '13px',
    color: '#ffffff',
    ...shorthands.outline('none'),
  },
  heroSearchCount: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    whiteSpace: 'nowrap',
  },

  // Row 3: Hero content (icon + title + desc | stats) — matches ServiceCatalog/ProductCatalog
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

  // Body content area
  body: {
    ...shorthands.padding('0'),
  },

  // Section styling
  section: {
    ...shorthands.padding('36px', '0'),
  },
  sectionBorder: {
    ...shorthands.padding('36px', '0'),
    ...shorthands.borderTop('1px', 'solid', '#e8e8e8'),
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0d3a5c',
  },
  viewAll: {
    fontSize: '13px',
    color: '#1e6b7b',
    fontWeight: '600',
    cursor: 'pointer',
    ':hover': {
      textDecoration: 'underline',
    },
  },

  // Loading state
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('64px'),
  },
});

export const KnowledgeBase: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { isCollapsed, toggle } = useHeroCollapse('knowledge-base');
  const [searchQuery, setSearchQuery] = useState('');
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<KBSection | null>(null);

  const faqRef = useRef<HTMLDivElement>(null);
  const glossaryRef = useRef<HTMLDivElement>(null);
  const articlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    knowledgeBaseService
      .getAll()
      .then(setEntries)
      .catch(() => {
        // Silent fallback — empty state
      })
      .finally(() => setLoading(false));
  }, []);

  const faqEntries = useMemo(() => entries.filter((e) => e.Type === 'FAQ'), [entries]);
  const glossaryEntries = useMemo(() => entries.filter((e) => e.Type === 'Glossary'), [entries]);
  const articleEntries = useMemo(() => entries.filter((e) => e.Type === 'Article'), [entries]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <Spinner size="large" label="Loading knowledge base..." />
        </div>
      </div>
    );
  }

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className={styles.container}>
      {/* Hero Banner — Products page width pattern */}
      <div className={styles.heroWrapper}>
        <div className={`${styles.heroBanner} ${isCollapsed ? styles.heroCollapsed : styles.heroExpanded}`}>
          <div className={styles.heroDecoration} />

          {isCollapsed ? (
            <div className={styles.collapsedStrip}>
              <span className={styles.collapsedTitle}>Knowledge Centre</span>
              <span className={styles.collapsedBadge}>{faqEntries.length} FAQs</span>
              <span className={styles.collapsedBadge}>{glossaryEntries.length} Terms</span>
              <span className={styles.collapsedBadge}>{articleEntries.length} Articles</span>
            </div>
          ) : (
            <>
              {/* Row 1: Page header */}
              <div className={styles.heroHeaderRow}>
                <div>
                  <div className={styles.heroHeaderTitle}>Knowledge Centre</div>
                  <div className={styles.heroHeaderSubtitle}>
                    FAQs, terminology, and in-depth guides for the DWx platform
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

              {/* Row 2: Glassmorphic search bar */}
              <div className={styles.heroSearchRow}>
                <div className={styles.heroSearchBar}>
                  <div className={styles.heroSearchIcon}>
                    <SearchRegular style={{ width: '16px', height: '16px' }} />
                  </div>
                  <input
                    className={styles.heroSearchInput}
                    placeholder="Search FAQs, glossary terms, and articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <span className={styles.heroSearchCount}>
                  {entries.length} entries available
                </span>
              </div>

              {/* Row 3: Content — icon + title + desc | stats */}
              <div className={styles.heroContentRow}>
                <div className={styles.heroLeft}>
                  <div className={styles.heroTop}>
                    <div className={styles.heroIcon}>
                      <BookOpen24Regular style={{ color: '#7dd3fc', fontSize: '18px' }} />
                    </div>
                    <Text className={styles.heroTitle}>
                      DWx Knowledge{' '}
                      <span style={{ color: '#7dd3fc' }}>Centre</span>
                    </Text>
                  </div>
                  <div className={styles.heroDesc}>
                    Your one-stop resource for FAQs, terminology, and in-depth guides to master the DWx Traffic Manager platform and sales process.
                  </div>
                </div>
                <div className={styles.heroStats}>
                  <div className={styles.heroStat}>
                    <Text className={styles.heroStatValue}>{articleEntries.length}</Text>
                    <Text className={styles.heroStatLabel}>Articles</Text>
                  </div>
                  <div className={styles.heroStat}>
                    <Text className={styles.heroStatValue}>{faqEntries.length}</Text>
                    <Text className={styles.heroStatLabel}>FAQs</Text>
                  </div>
                  <div className={styles.heroStat}>
                    <Text className={styles.heroStatValue}>{glossaryEntries.length}</Text>
                    <Text className={styles.heroStatLabel}>Terms</Text>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <HeroCollapseToggle isCollapsed={isCollapsed} onToggle={toggle} />
      </div>

      {/* Body — Magazine sections */}
      <div className={styles.body}>
        {/* Featured Articles */}
        <div ref={articlesRef} className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              {isSearching ? 'Articles' : 'Featured Articles'}
            </Text>
            {!isSearching && articleEntries.length > 3 && (
              <span className={styles.viewAll} onClick={() => setExpandedSection(expandedSection === 'articles' ? null : 'articles')}>
                {expandedSection === 'articles' ? 'Show featured' : `View all ${articleEntries.length} articles`} &rarr;
              </span>
            )}
          </div>
          <ArticleSection
            entries={articleEntries}
            searchQuery={searchQuery}
            expanded={expandedSection === 'articles' || isSearching}
            categoryGradients={CATEGORY_GRADIENTS}
          />
        </div>

        {/* Popular FAQs */}
        <div ref={faqRef} className={styles.sectionBorder}>
          <div className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              {isSearching ? 'Frequently Asked Questions' : 'Popular Questions'}
            </Text>
            {!isSearching && faqEntries.length > 6 && (
              <span className={styles.viewAll} onClick={() => setExpandedSection(expandedSection === 'faq' ? null : 'faq')}>
                {expandedSection === 'faq' ? 'Show top 6' : `View all ${faqEntries.length} FAQs`} &rarr;
              </span>
            )}
          </div>
          <FAQSection
            entries={faqEntries}
            searchQuery={searchQuery}
            expanded={expandedSection === 'faq' || isSearching}
          />
        </div>

        {/* Glossary */}
        <div ref={glossaryRef} className={styles.sectionBorder}>
          <div className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>Glossary</Text>
            {!isSearching && glossaryEntries.length > 6 && (
              <span className={styles.viewAll} onClick={() => setExpandedSection(expandedSection === 'glossary' ? null : 'glossary')}>
                {expandedSection === 'glossary' ? 'Show preview' : `View all ${glossaryEntries.length} terms`} &rarr;
              </span>
            )}
          </div>
          <GlossarySection
            entries={glossaryEntries}
            searchQuery={searchQuery}
            expanded={expandedSection === 'glossary' || isSearching}
          />
        </div>
      </div>
    </div>
  );
};
