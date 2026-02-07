/**
 * DWx Traffic Manager - Product Catalog
 * Displays DWx Apps, Web Parts, and Adaptive Cards with tabs
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  Card,
  Button,
  Badge,
  makeStyles,
  shorthands,
  Tab,
  TabList,
  SelectTabData,
  SelectTabEvent,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  Apps24Regular,
  PuzzlePiece24Regular,
  CardUi24Regular,
  BotRegular,
} from '@fluentui/react-icons';
import {
  Product,
  ProductType,
  DWX_APPS,
  WEBPARTS,
  ADAPTIVE_CARDS,
  DWX_AGENTS,
  getCategoriesForType,
} from '../../types/Product';
import { DW_COLORS } from '../../utils/buttonStyles';

const useStyles = makeStyles({
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    ...shorthands.padding('24px', '64px'),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#333333',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6c757d',
  },
  backButton: {
    minWidth: 'auto',
  },
  tabsContainer: {
    marginBottom: '20px',
    ...shorthands.borderBottom('2px', 'solid', '#e0e0e0'),
    paddingBottom: '0',
  },
  tab: {
    ...shorthands.padding('12px', '20px'),
    ...shorthands.borderRadius('8px', '8px', '0', '0'),
    marginBottom: '-2px',
    position: 'relative',
  },
  tabContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  tabIcon: {
    fontSize: '20px',
  },
  tabCount: {
    fontSize: '12px',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('10px'),
    fontWeight: '500',
  },
  categorySection: {
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
  categoryChipActive: {
    backgroundColor: DW_COLORS.primary,
    color: 'white',
    ...shorthands.borderColor('#1a5a8a'),
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px',
  },
  productCard: {
    ...shorthands.borderRadius('12px'),
    ...shorthands.overflow('hidden'),
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    ...shorthands.border('1px', 'solid', '#e0e0e0'),
  },
  productImage: {
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...shorthands.overflow('hidden'),
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
  },
  productTypeTag: {
    display: 'inline-block',
    fontSize: '10px',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('8px'),
    marginBottom: '6px',
    fontWeight: '500',
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
    marginBottom: '8px',
  },
  productFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: '8px',
    ...shorthands.borderTop('1px', 'solid', '#f0f0f0'),
  },
  requestBtn: {
    ...shorthands.padding('6px', '12px'),
    fontSize: '11px',
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

type TabValue = 'apps' | 'webparts' | 'cards' | 'agents';

const TAB_CONFIG: Record<TabValue, { label: string; icon: React.ReactNode; products: Product[]; color: string }> = {
  apps: {
    label: 'DWx Apps',
    icon: <Apps24Regular />,
    products: DWX_APPS,
    color: DW_COLORS.primary,
  },
  webparts: {
    label: 'Web Parts',
    icon: <PuzzlePiece24Regular />,
    products: WEBPARTS,
    color: '#7c3aed',
  },
  cards: {
    label: 'Adaptive Cards',
    icon: <CardUi24Regular />,
    products: ADAPTIVE_CARDS,
    color: '#0d9488',
  },
  agents: {
    label: 'DWx Agents',
    icon: <BotRegular />,
    products: DWX_AGENTS,
    color: '#6366f1',
  },
};

export const ProductCatalog: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('apps');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const currentConfig = TAB_CONFIG[activeTab];

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
    if (selectedCategory === 'all') {
      return currentConfig.products;
    }
    return currentConfig.products.filter((p) => p.category === selectedCategory);
  }, [currentConfig.products, selectedCategory]);

  const handleTabChange = (_event: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as TabValue);
    setSelectedCategory('all');
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleRequestDemo = (product: Product) => {
    // Navigate to request form with product pre-selected
    navigate('/product-request', { state: { productRequest: product } });
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
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Text className={styles.title}>Product Catalog</Text>
          <Text className={styles.subtitle}>
            DWx applications, web parts, and adaptive cards for your digital workplace
          </Text>
        </div>
        <Button
          appearance="secondary"
          icon={<ArrowLeft24Regular />}
          onClick={() => navigate('/')}
          className={styles.backButton}
        >
          Back to Home
        </Button>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <TabList
          selectedValue={activeTab}
          onTabSelect={handleTabChange}
        >
          {(Object.entries(TAB_CONFIG) as [TabValue, typeof TAB_CONFIG[TabValue]][]).map(([key, config]) => (
            <Tab key={key} value={key} className={styles.tab}>
              <div className={styles.tabContent}>
                <span className={styles.tabIcon}>{config.icon}</span>
                <span>{config.label}</span>
                <Badge
                  appearance={activeTab === key ? 'filled' : 'outline'}
                  color={activeTab === key ? 'brand' : 'informative'}
                  size="small"
                  style={activeTab === key ? { backgroundColor: config.color } : undefined}
                >
                  {config.products.length}
                </Badge>
              </div>
            </Tab>
          ))}
        </TabList>
      </div>

      {/* Category Filter */}
      <div className={styles.categorySection}>
        <Text className={styles.categoryLabel} block>
          Filter by category
        </Text>
        <div className={styles.categoryChips}>
          <button
            className={`${styles.categoryChip} ${selectedCategory === 'all' ? styles.categoryChipActive : ''}`}
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
              className={`${styles.categoryChip} ${selectedCategory === category ? styles.categoryChipActive : ''}`}
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
      </div>

      {/* Products Grid */}
      <div className={styles.productsGrid}>
        {filteredProducts.map((product) => (
          <Card key={product.id} className={styles.productCard}>
            <div className={`${styles.productImage} ${getGradientClass(product.gradient)}`}>
              <span className={styles.productVersion}>{product.version}</span>
              <div className={styles.productSplash}>
                <div className={styles.productBrand}>{product.brand}</div>
                <div className={styles.productDwx}>
                  DW<span className={styles.productDwxSpan}>x</span>
                </div>
                <div className={styles.productSplashIcon}>{product.icon}</div>
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
    </div>
  );
};

export default ProductCatalog;
