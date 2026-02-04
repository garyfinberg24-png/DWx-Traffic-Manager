/**
 * DWx Traffic Manager - Landing Page
 * Main entry point with Services and Products options
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  Card,
  makeStyles,
  shorthands,
} from '@fluentui/react-components';
import {
  Wrench24Regular,
  Apps24Regular,
  ArrowRight24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 120px)',
    ...shorthands.padding('40px', '20px'),
    backgroundColor: '#f5f5f5',
  },
  header: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1a5a8a',
    marginBottom: '12px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#616161',
    maxWidth: '600px',
  },
  cardsContainer: {
    display: 'flex',
    gap: '32px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '900px',
  },
  card: {
    width: '380px',
    ...shorthands.padding('32px'),
    cursor: 'pointer',
    transitionProperty: 'transform, box-shadow',
    transitionDuration: '0.3s',
    transitionTimingFunction: 'ease',
    ...shorthands.borderRadius('16px'),
    backgroundColor: 'white',
    ':hover': {
      transform: 'translateY(-8px)',
      boxShadow: '0 12px 40px rgba(26, 90, 138, 0.15)',
    },
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  iconContainer: {
    width: '64px',
    height: '64px',
    ...shorthands.borderRadius('16px'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  servicesIcon: {
    backgroundColor: '#e8f4fc',
    color: '#1a5a8a',
  },
  productsIcon: {
    backgroundColor: '#e8f0f7',
    color: '#0d3a5c',
  },
  icon: {
    width: '32px',
    height: '32px',
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#242424',
  },
  cardDescription: {
    fontSize: '15px',
    color: '#616161',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  cardFeatures: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px',
  },
  feature: {
    fontSize: '13px',
    color: '#424242',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  featureDot: {
    width: '6px',
    height: '6px',
    ...shorthands.borderRadius('50%'),
  },
  servicesDot: {
    backgroundColor: '#1a5a8a',
  },
  productsDot: {
    backgroundColor: '#0d3a5c',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '16px',
    ...shorthands.borderTop('1px', 'solid', '#e0e0e0'),
  },
  exploreText: {
    fontSize: '14px',
    fontWeight: '600',
  },
  servicesExplore: {
    color: '#1a5a8a',
  },
  productsExplore: {
    color: '#0d3a5c',
  },
  arrowIcon: {
    width: '20px',
    height: '20px',
  },
});

const SERVICE_FEATURES = [
  'Power Apps, Power Automate, Power BI, Copilot Studio, Power Pages',
  'SPFx & SharePoint Solutions',
  'Microsoft 365 Migrations & Assessments',
  'Copilot Agents & AI Solutions',
  'Pre-Sales Discovery, Tenders & Proposals',
];

const PRODUCT_FEATURES = [
  '15 DWx Business Applications',
  '8 SharePoint Web Parts',
  '6 Adaptive Cards for Teams',
  'Contract, Policy & Document Management',
  'HR, Training & Engagement Solutions',
];

export const LandingPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();

  const handleServicesClick = () => {
    navigate('/services');
  };

  const handleProductsClick = () => {
    navigate('/products');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title} block>
          Welcome to DWx Traffic Manager
        </Text>
        <Text className={styles.subtitle} block>
          Your gateway to Digital Workplace services and products. Choose where you'd like to start.
        </Text>
      </div>

      <div className={styles.cardsContainer}>
        {/* Services Card */}
        <Card className={styles.card} onClick={handleServicesClick}>
          <div className={styles.cardHeader}>
            <div className={`${styles.iconContainer} ${styles.servicesIcon}`}>
              <Wrench24Regular className={styles.icon} />
            </div>
            <Text className={styles.cardTitle}>Services</Text>
          </div>
          <Text className={styles.cardDescription} block>
            Browse our comprehensive service catalog including consulting, development,
            migrations, and pre-sales support for Microsoft 365 and Power Platform.
          </Text>
          <div className={styles.cardFeatures}>
            {SERVICE_FEATURES.map((feature, index) => (
              <div key={index} className={styles.feature}>
                <span className={`${styles.featureDot} ${styles.servicesDot}`} />
                {feature}
              </div>
            ))}
          </div>
          <div className={styles.cardFooter}>
            <Text className={`${styles.exploreText} ${styles.servicesExplore}`}>
              Explore Services
            </Text>
            <ArrowRight24Regular className={`${styles.arrowIcon} ${styles.servicesExplore}`} />
          </div>
        </Card>

        {/* Products Card */}
        <Card className={styles.card} onClick={handleProductsClick}>
          <div className={styles.cardHeader}>
            <div className={`${styles.iconContainer} ${styles.productsIcon}`}>
              <Apps24Regular className={styles.icon} />
            </div>
            <Text className={styles.cardTitle}>Products</Text>
          </div>
          <Text className={styles.cardDescription} block>
            Discover our portfolio of ready-to-deploy DWx applications, web parts,
            and adaptive cards that accelerate your digital workplace transformation.
          </Text>
          <div className={styles.cardFeatures}>
            {PRODUCT_FEATURES.map((feature, index) => (
              <div key={index} className={styles.feature}>
                <span className={`${styles.featureDot} ${styles.productsDot}`} />
                {feature}
              </div>
            ))}
          </div>
          <div className={styles.cardFooter}>
            <Text className={`${styles.exploreText} ${styles.productsExplore}`}>
              Explore Products
            </Text>
            <ArrowRight24Regular className={`${styles.arrowIcon} ${styles.productsExplore}`} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LandingPage;
