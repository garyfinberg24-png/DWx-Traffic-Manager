/**
 * DWx Traffic Manager - Knowledge Base (V3 Magazine / Editorial)
 * Full-width editorial layout with hero banner, featured articles,
 * FAQ numbered cards, and glossary grid with alphabet bar.
 * Hero width matches Products page pattern (1400px container).
 * Route: /knowledge-base
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Text,
  makeStyles,
  shorthands,
  Spinner,
} from '@fluentui/react-components';
import {
  QuestionCircle24Regular,
  BookOpen24Regular,
  BookLetter24Regular,
  Search24Regular,
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
    background: 'radial-gradient(circle, rgba(91,184,245,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.gap('40px'),
    ...shorthands.padding('48px', '48px', '48px', '48px'),
  },
  heroLeft: {
    flex: '1',
    minWidth: '0',
  },
  heroBreadcrumb: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '16px',
  },
  heroBreadcrumbLink: {
    color: 'rgba(255,255,255,0.5)',
    textDecoration: 'none',
    cursor: 'pointer',
    ':hover': {
      color: '#5bb8f5',
    },
  },
  heroTitle: {
    fontSize: '36px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '12px',
    lineHeight: '1.2',
  },
  heroTitleAccent: {
    color: '#5bb8f5',
  },
  heroSubtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: '1.6',
    maxWidth: '520px',
  },
  heroSearchContainer: {
    marginTop: '28px',
    position: 'relative',
    maxWidth: '520px',
  },
  heroSearchIcon: {
    position: 'absolute',
    left: '18px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '18px',
    pointerEvents: 'none',
  },
  heroRight: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    flexShrink: 0,
  },
  quickLink: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('14px', '20px'),
    ...shorthands.borderRadius('12px'),
    backgroundColor: 'rgba(255,255,255,0.06)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.1)'),
    color: 'rgba(255,255,255,0.8)',
    fontSize: '14px',
    cursor: 'pointer',
    transitionProperty: 'background-color, color, border-color',
    transitionDuration: '150ms',
    minWidth: '240px',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.12)',
      color: 'white',
      ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.2)'),
    },
  },
  quickLinkIcon: {
    width: '36px',
    height: '36px',
    ...shorthands.borderRadius('10px'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
  },
  quickLinkIconFaq: {
    backgroundColor: 'rgba(91,184,245,0.15)',
    color: '#5bb8f5',
  },
  quickLinkIconGlossary: {
    backgroundColor: 'rgba(122,204,155,0.15)',
    color: '#7acc9b',
  },
  quickLinkIconArticles: {
    backgroundColor: 'rgba(247,163,79,0.15)',
    color: '#f7a34f',
  },
  quickLinkText: {
    fontWeight: '500',
  },
  quickLinkCount: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
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

  const scrollToSection = (section: KBSection) => {
    const ref = section === 'faq' ? faqRef : section === 'glossary' ? glossaryRef : articlesRef;
    setExpandedSection(section);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
              <span className={styles.collapsedTitle}>DWx Knowledge Centre</span>
              <span className={styles.collapsedBadge}>{faqEntries.length} FAQs</span>
              <span className={styles.collapsedBadge}>{glossaryEntries.length} Terms</span>
              <span className={styles.collapsedBadge}>{articleEntries.length} Articles</span>
            </div>
          ) : (
            <div className={styles.heroContent}>
              <div className={styles.heroLeft}>
                <div className={styles.heroBreadcrumb}>
                  <span className={styles.heroBreadcrumbLink}>Home</span> &rsaquo; Knowledge Base
                </div>
                <div className={styles.heroTitle}>
                  DWx Knowledge <span className={styles.heroTitleAccent}>Centre</span>
                </div>
                <Text className={styles.heroSubtitle}>
                  Your one-stop resource for FAQs, terminology, and in-depth guides to master the DWx Traffic Manager platform and sales process.
                </Text>
                <div className={styles.heroSearchContainer}>
                  <Search24Regular
                    className={styles.heroSearchIcon}
                    style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    placeholder="What are you looking for?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '16px 20px 16px 48px',
                      borderRadius: 14,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(12px)',
                      color: 'white',
                      fontSize: 15,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>
              <div className={styles.heroRight}>
                <div className={styles.quickLink} onClick={() => scrollToSection('faq')}>
                  <div className={`${styles.quickLinkIcon} ${styles.quickLinkIconFaq}`}>
                    <QuestionCircle24Regular />
                  </div>
                  <div>
                    <div className={styles.quickLinkText}>Browse FAQs</div>
                    <div className={styles.quickLinkCount}>{faqEntries.length} questions</div>
                  </div>
                </div>
                <div className={styles.quickLink} onClick={() => scrollToSection('glossary')}>
                  <div className={`${styles.quickLinkIcon} ${styles.quickLinkIconGlossary}`}>
                    <BookLetter24Regular />
                  </div>
                  <div>
                    <div className={styles.quickLinkText}>Glossary</div>
                    <div className={styles.quickLinkCount}>{glossaryEntries.length} terms</div>
                  </div>
                </div>
                <div className={styles.quickLink} onClick={() => scrollToSection('articles')}>
                  <div className={`${styles.quickLinkIcon} ${styles.quickLinkIconArticles}`}>
                    <BookOpen24Regular />
                  </div>
                  <div>
                    <div className={styles.quickLinkText}>Read Articles</div>
                    <div className={styles.quickLinkCount}>{articleEntries.length} guides</div>
                  </div>
                </div>
              </div>
            </div>
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
