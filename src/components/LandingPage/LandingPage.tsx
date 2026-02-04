/**
 * DWx Traffic Manager - Landing Page
 * Main entry point with Services and Products options
 * Includes Manager section for users with manager role
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  Card,
  makeStyles,
  shorthands,
  Divider,
} from '@fluentui/react-components';
import {
  Wrench24Regular,
  Apps24Regular,
  ArrowRight24Regular,
  DataUsage24Regular,
  Settings24Regular,
  PeopleTeam24Regular,
} from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';

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
  // Manager Section Styles
  managerSection: {
    marginTop: '48px',
    width: '100%',
    maxWidth: '900px',
  },
  managerDivider: {
    marginBottom: '32px',
  },
  managerHeader: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  managerTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1e6b7b',
    marginBottom: '8px',
  },
  managerSubtitle: {
    fontSize: '14px',
    color: '#616161',
  },
  managerCardsContainer: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  managerCard: {
    width: '280px',
    ...shorthands.padding('24px'),
    cursor: 'pointer',
    transitionProperty: 'transform, box-shadow',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
    ...shorthands.borderRadius('12px'),
    backgroundColor: 'white',
    ...shorthands.border('1px', 'solid', '#e0e0e0'),
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 24px rgba(30, 107, 123, 0.15)',
      ...shorthands.borderColor('#1e6b7b'),
    },
  },
  managerCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  managerIconContainer: {
    width: '48px',
    height: '48px',
    ...shorthands.borderRadius('12px'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f4f6',
  },
  managerIcon: {
    width: '24px',
    height: '24px',
    color: '#1e6b7b',
  },
  managerCardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#242424',
  },
  managerCardDescription: {
    fontSize: '13px',
    color: '#616161',
    lineHeight: '1.5',
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
  const { isManager } = useAuth();

  const handleServicesClick = () => {
    navigate('/services');
  };

  const handleProductsClick = () => {
    navigate('/products');
  };

  const handlePipelineClick = () => {
    navigate('/pipeline');
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  const handleTeamClick = () => {
    navigate('/admin/account-managers');
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

      {/* Manager Section - Only visible to managers */}
      {isManager && (
        <div className={styles.managerSection}>
          <Divider className={styles.managerDivider} />
          <div className={styles.managerHeader}>
            <Text className={styles.managerTitle} block>
              Manager Tools
            </Text>
            <Text className={styles.managerSubtitle} block>
              Access pipeline analytics, team management, and administrative functions
            </Text>
          </div>
          <div className={styles.managerCardsContainer}>
            {/* Pipeline Card */}
            <Card className={styles.managerCard} onClick={handlePipelineClick}>
              <div className={styles.managerCardHeader}>
                <div className={styles.managerIconContainer}>
                  <DataUsage24Regular className={styles.managerIcon} />
                </div>
                <Text className={styles.managerCardTitle}>Pipeline</Text>
              </div>
              <Text className={styles.managerCardDescription} block>
                View sales funnel, track request progress, and monitor conversion rates across all stages.
              </Text>
            </Card>

            {/* Team Management Card */}
            <Card className={styles.managerCard} onClick={handleTeamClick}>
              <div className={styles.managerCardHeader}>
                <div className={styles.managerIconContainer}>
                  <PeopleTeam24Regular className={styles.managerIcon} />
                </div>
                <Text className={styles.managerCardTitle}>Team</Text>
              </div>
              <Text className={styles.managerCardDescription} block>
                Manage account managers, assign regions, and configure team member access.
              </Text>
            </Card>

            {/* Admin Card */}
            <Card className={styles.managerCard} onClick={handleAdminClick}>
              <div className={styles.managerCardHeader}>
                <div className={styles.managerIconContainer}>
                  <Settings24Regular className={styles.managerIcon} />
                </div>
                <Text className={styles.managerCardTitle}>Admin</Text>
              </div>
              <Text className={styles.managerCardDescription} block>
                Configure services, manage specialists, and access system settings.
              </Text>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
