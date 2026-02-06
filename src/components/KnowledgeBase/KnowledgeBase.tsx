/**
 * DWx Traffic Manager - Knowledge Base
 * Consumer page with 3 tabs: FAQ, Glossary, Articles.
 * Read-only browsing for Account Managers with global search.
 * Route: /knowledge-base
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Text,
  makeStyles,
  tokens,
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData,
  SearchBox,
  Spinner,
  Badge,
} from '@fluentui/react-components';
import { BookOpen24Regular } from '@fluentui/react-icons';
import { KBEntry } from '../../types/KnowledgeBase';
import { knowledgeBaseService } from '../../services/KnowledgeBaseService';
import { FAQSection } from './FAQSection';
import { GlossarySection } from './GlossarySection';
import { ArticleSection } from './ArticleSection';

type KBTab = 'faq' | 'glossary' | 'articles';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: '24px 64px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  headerIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: '28px',
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    margin: 0,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  tabList: {
    flexShrink: 0,
  },
  searchBox: {
    width: '320px',
    maxWidth: '100%',
  },
  tabContent: {
    minHeight: '300px',
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
  },
});

export const KnowledgeBase: React.FC = () => {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<KBTab>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as KBTab);
    setSearchQuery('');
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <BookOpen24Regular className={styles.headerIcon} />
        <div className={styles.headerText}>
          <Text as="h1" size={600} weight="semibold" className={styles.title}>
            Knowledge Base
          </Text>
          <Text size={300} className={styles.subtitle}>
            FAQs, glossary terms, and articles to help you navigate our services
          </Text>
        </div>
      </div>

      <div className={styles.toolbar}>
        <TabList
          className={styles.tabList}
          selectedValue={activeTab}
          onTabSelect={handleTabSelect}
        >
          <Tab value="faq">
            FAQ{' '}
            <Badge appearance="tint" size="small" color="informative">
              {faqEntries.length}
            </Badge>
          </Tab>
          <Tab value="glossary">
            Glossary{' '}
            <Badge appearance="tint" size="small" color="informative">
              {glossaryEntries.length}
            </Badge>
          </Tab>
          <Tab value="articles">
            Articles{' '}
            <Badge appearance="tint" size="small" color="informative">
              {articleEntries.length}
            </Badge>
          </Tab>
        </TabList>

        <SearchBox
          className={styles.searchBox}
          placeholder={`Search ${activeTab === 'faq' ? 'FAQs' : activeTab === 'glossary' ? 'glossary terms' : 'articles'}...`}
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value)}
        />
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'faq' && <FAQSection entries={faqEntries} searchQuery={searchQuery} />}
        {activeTab === 'glossary' && <GlossarySection entries={glossaryEntries} searchQuery={searchQuery} />}
        {activeTab === 'articles' && <ArticleSection entries={articleEntries} searchQuery={searchQuery} />}
      </div>
    </div>
  );
};
