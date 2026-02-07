/**
 * DWx Traffic Manager - Service Detail Page
 * Full-page view of a service with rich content sections
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Text,
  Button,
  Spinner,
  makeStyles,
  shorthands,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  FlashRegular,
  CodeRegular,
  CloudArrowUpRegular,
  ShieldCheckmarkRegular,
  BotRegular,
  PeopleTeamRegular,
  ClockRegular,
  CheckmarkCircleRegular,
  PersonRegular,
  MoneyRegular,
  ArrowRightRegular,
  TargetRegular,
  StarRegular,
  RocketRegular,
  PeopleRegular,
  TextBulletListLtrRegular,
  DocumentBulletListRegular,
  GavelRegular,
  WrenchRegular,
  ShieldTaskRegular,
  LightbulbRegular,
} from '@fluentui/react-icons';
import { DWService, ServiceComplexity } from '../../types/ServiceRequest';
import { serviceCatalogService } from '../../services/ServiceCatalogService';
import { DW_COLORS } from '../../utils/buttonStyles';

const useStyles = makeStyles({
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    ...shorthands.padding('24px', '64px'),
  },
  backBar: {
    marginBottom: '24px',
  },
  // Hero Section
  hero: {
    ...shorthands.borderRadius('12px'),
    ...shorthands.overflow('hidden'),
    marginBottom: '32px',
    backgroundColor: DW_COLORS.primary,
    color: 'white',
  },
  heroContent: {
    ...shorthands.padding('40px', '48px'),
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  heroIcon: {
    width: '80px',
    height: '80px',
    ...shorthands.borderRadius('16px'),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroText: {
    flex: 1,
  },
  heroCategory: {
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    ...shorthands.padding('4px', '12px'),
    ...shorthands.borderRadius('12px'),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: '12px',
  },
  heroTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '8px',
    lineHeight: '1.2',
  },
  heroSubtitle: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: '1.5',
  },
  heroCta: {
    flexShrink: 0,
  },
  heroButton: {
    backgroundColor: 'white',
    color: '#1a5a8a',
    fontWeight: '600',
    fontSize: '15px',
    ...shorthands.padding('12px', '28px'),
    ...shorthands.borderRadius('8px'),
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
  },
  // Content layout
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '32px',
    alignItems: 'start',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    position: 'sticky',
    top: '24px',
  },
  // Section styling
  section: {
    backgroundColor: 'white',
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('1px', 'solid', '#e8e8e8'),
    ...shorthands.overflow('hidden'),
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    ...shorthands.padding('16px', '24px'),
    ...shorthands.borderBottom('1px', 'solid', '#f0f0f0'),
    backgroundColor: '#fafafa',
  },
  sectionIcon: {
    color: '#1a5a8a',
    width: '20px',
    height: '20px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#242424',
  },
  sectionBody: {
    ...shorthands.padding('20px', '24px'),
  },
  // About section
  aboutText: {
    fontSize: '15px',
    color: '#424242',
    lineHeight: '1.7',
  },
  // Quick Facts
  quickFacts: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    ...shorthands.padding('20px', '24px'),
  },
  factItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  factLabel: {
    fontSize: '11px',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '500',
  },
  factValue: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#242424',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  // Lists
  bulletList: {
    listStyleType: 'none',
    ...shorthands.padding('0'),
    ...shorthands.margin('0'),
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  bulletItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    fontSize: '14px',
    color: '#424242',
    lineHeight: '1.5',
  },
  bulletIcon: {
    color: '#1a5a8a',
    width: '18px',
    height: '18px',
    flexShrink: 0,
    marginTop: '2px',
  },
  // Timeline
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0px',
  },
  timelineStep: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    ...shorthands.padding('16px', '0'),
    position: 'relative',
  },
  timelineIndicator: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
    width: '32px',
  },
  timelineCircle: {
    width: '32px',
    height: '32px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: '#e8f4fc',
    color: '#1a5a8a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    ...shorthands.border('2px', 'solid', '#1a5a8a'),
    flexShrink: 0,
  },
  timelineLine: {
    width: '2px',
    flex: 1,
    backgroundColor: '#d0e4f0',
    minHeight: '16px',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: '4px',
  },
  timelineName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '2px',
  },
  timelineDesc: {
    fontSize: '13px',
    color: '#616161',
    lineHeight: '1.4',
  },
  // Role badges
  rolesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    ...shorthands.padding('8px', '14px'),
    backgroundColor: '#e8f4fc',
    ...shorthands.borderRadius('8px'),
    fontSize: '13px',
    fontWeight: '500',
    color: '#1a5a8a',
    ...shorthands.border('1px', 'solid', '#cce4f0'),
  },
  // Complexity badge
  complexityBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('4px', '12px'),
    ...shorthands.borderRadius('6px'),
    fontSize: '13px',
    fontWeight: '600',
  },
  complexityLow: {
    backgroundColor: '#dff6dd',
    color: '#107c10',
  },
  complexityMedium: {
    backgroundColor: '#fff4ce',
    color: '#a67c00',
  },
  complexityHigh: {
    backgroundColor: '#fde7e9',
    color: '#c42b1c',
  },
  complexityEnterprise: {
    backgroundColor: '#e8e8f4',
    color: '#6264a7',
  },
  // Price display
  priceDisplay: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a5a8a',
  },
  // Related services
  relatedGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  relatedChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    ...shorthands.padding('8px', '16px'),
    ...shorthands.borderRadius('8px'),
    fontSize: '13px',
    fontWeight: '500',
    color: '#1a5a8a',
    backgroundColor: '#f0f4f8',
    ...shorthands.border('1px', 'solid', '#d0e4f0'),
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    ':hover': {
      backgroundColor: '#e0ecf4',
    },
  },
  // CTA bar
  ctaBar: {
    ...shorthands.padding('24px', '0'),
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    ...shorthands.borderTop('1px', 'solid', '#e8e8e8'),
    marginTop: '16px',
  },
  ctaButton: {
    backgroundColor: DW_COLORS.primary,
    color: 'white',
    fontWeight: '600',
    fontSize: '15px',
    ...shorthands.padding('12px', '32px'),
    ':hover': {
      backgroundColor: '#145a7a',
    },
  },
  // Loading/Error states
  centerState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('80px', '20px'),
    textAlign: 'center',
    gap: '16px',
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#242424',
  },
  errorText: {
    fontSize: '14px',
    color: '#616161',
  },
});

// Category-specific hero colors
const categoryColors: Record<string, string> = {
  'Power Platform': '#742774',
  'SPFx Development': '#0078d4',
  'SharePoint Migration': '#00a4ef',
  'M365 Assessment': '#107c10',
  'Copilot Agents': '#6264a7',
  'MS Viva': '#e5559a',
  'Training': '#f59e0b',
  'Proposal': '#0078d4',
  'Tender': '#8b5cf6',
  'Ad-Hoc Support': '#f59e0b',
  'SLA': '#107c10',
  'Strategic Advisory': '#e5559a',
};

// Icon map
const iconMap: Record<string, React.ElementType> = {
  LightningBolt: FlashRegular,
  Code: CodeRegular,
  CloudArrowUp: CloudArrowUpRegular,
  ShieldCheckmark: ShieldCheckmarkRegular,
  Bot: BotRegular,
  PeopleTeam: PeopleTeamRegular,
  DocumentBulletList: DocumentBulletListRegular,
  Gavel: GavelRegular,
  Wrench: WrenchRegular,
  ShieldTask: ShieldTaskRegular,
  Lightbulb: LightbulbRegular,
};

const formatPrice = (price?: number): string => {
  if (!price) return 'Contact for pricing';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const getComplexityStyle = (
  complexity: ServiceComplexity,
  styles: ReturnType<typeof useStyles>
): string => {
  switch (complexity) {
    case 'Low': return styles.complexityLow;
    case 'Medium': return styles.complexityMedium;
    case 'High': return styles.complexityHigh;
    case 'Enterprise': return styles.complexityEnterprise;
    default: return styles.complexityMedium;
  }
};

export const ServiceDetailPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { serviceId } = useParams<{ serviceId: string }>();

  const [services, setServices] = useState<DWService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const data = await serviceCatalogService.getServices(true);
        setServices(data);
      } catch (err) {
        console.error('Error loading services:', err);
        setError('Failed to load service details.');
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);

  const service = useMemo(() => {
    if (!serviceId || services.length === 0) return null;
    const id = parseInt(serviceId, 10);
    return services.find(s => s.Id === id) || null;
  }, [serviceId, services]);

  const relatedServices = useMemo(() => {
    if (!service?.RelatedCategories) return [];
    return services.filter(
      s => s.Id !== service.Id && service.RelatedCategories!.includes(s.Category)
    );
  }, [service, services]);

  const heroColor = service ? (categoryColors[service.Category] || DW_COLORS.primary) : DW_COLORS.primary;
  const IconComponent = service ? (iconMap[service.IconName || ''] || FlashRegular) : FlashRegular;

  const handleRequestService = () => {
    if (service) {
      navigate('/request', { state: { preSelectedService: service } });
    }
  };

  const handleRelatedClick = (relatedService: DWService) => {
    navigate(`/services/${relatedService.Id}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.centerState}>
          <Spinner size="large" />
          <Text>Loading service details...</Text>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className={styles.container}>
        <div className={styles.backBar}>
          <Button
            appearance="secondary"
            icon={<ArrowLeft24Regular />}
            onClick={() => navigate('/services')}
          >
            Back to Catalog
          </Button>
        </div>
        <div className={styles.centerState}>
          <Text className={styles.errorTitle}>
            {error || 'Service not found'}
          </Text>
          <Text className={styles.errorText}>
            {error
              ? 'Please try again later.'
              : 'The service you are looking for does not exist or has been removed.'}
          </Text>
          <Button appearance="primary" onClick={() => navigate('/services')}>
            Browse Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Back button */}
      <div className={styles.backBar}>
        <Button
          appearance="secondary"
          icon={<ArrowLeft24Regular />}
          onClick={() => navigate('/services')}
        >
          Back to Catalog
        </Button>
      </div>

      {/* Hero */}
      <div className={styles.hero} style={{ backgroundColor: heroColor }}>
        <div className={styles.heroContent}>
          <div className={styles.heroIcon}>
            <IconComponent style={{ width: '36px', height: '36px', color: 'white' }} />
          </div>
          <div className={styles.heroText}>
            <span className={styles.heroCategory}>{service.Category}</span>
            <Text className={styles.heroTitle} block>{service.Title}</Text>
            <Text className={styles.heroSubtitle}>{service.ShortDescription}</Text>
          </div>
          <div className={styles.heroCta}>
            <Button
              className={styles.heroButton}
              appearance="primary"
              icon={<ArrowRightRegular />}
              iconPosition="after"
              onClick={handleRequestService}
            >
              Request This Service
            </Button>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className={styles.contentGrid}>
        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* About */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <TextBulletListLtrRegular className={styles.sectionIcon} />
              <Text className={styles.sectionTitle}>About This Service</Text>
            </div>
            <div className={styles.sectionBody}>
              <Text className={styles.aboutText}>{service.Description}</Text>
            </div>
          </div>

          {/* What's Included */}
          {service.WhatsIncluded && service.WhatsIncluded.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <CheckmarkCircleRegular className={styles.sectionIcon} />
                <Text className={styles.sectionTitle}>What's Included</Text>
              </div>
              <div className={styles.sectionBody}>
                <ul className={styles.bulletList}>
                  {service.WhatsIncluded.map((item, i) => (
                    <li key={i} className={styles.bulletItem}>
                      <CheckmarkCircleRegular className={styles.bulletIcon} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Engagement Timeline */}
          {service.EngagementPhases && service.EngagementPhases.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <RocketRegular className={styles.sectionIcon} />
                <Text className={styles.sectionTitle}>Engagement Timeline</Text>
              </div>
              <div className={styles.sectionBody}>
                <div className={styles.timeline}>
                  {service.EngagementPhases.map((phase, i) => (
                    <div key={i} className={styles.timelineStep}>
                      <div className={styles.timelineIndicator}>
                        <div className={styles.timelineCircle}>{i + 1}</div>
                        {i < service.EngagementPhases!.length - 1 && (
                          <div className={styles.timelineLine} />
                        )}
                      </div>
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineName}>{phase.name}</div>
                        <div className={styles.timelineDesc}>{phase.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Key Benefits */}
          {service.KeyBenefits && service.KeyBenefits.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <StarRegular className={styles.sectionIcon} />
                <Text className={styles.sectionTitle}>Key Benefits</Text>
              </div>
              <div className={styles.sectionBody}>
                <ul className={styles.bulletList}>
                  {service.KeyBenefits.map((benefit, i) => (
                    <li key={i} className={styles.bulletItem}>
                      <StarRegular className={styles.bulletIcon} />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Ideal For */}
          {service.IdealFor && service.IdealFor.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <TargetRegular className={styles.sectionIcon} />
                <Text className={styles.sectionTitle}>Ideal For</Text>
              </div>
              <div className={styles.sectionBody}>
                <ul className={styles.bulletList}>
                  {service.IdealFor.map((item, i) => (
                    <li key={i} className={styles.bulletItem}>
                      <ArrowRightRegular className={styles.bulletIcon} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Related Services */}
          {relatedServices.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <PeopleRegular className={styles.sectionIcon} />
                <Text className={styles.sectionTitle}>Related Services</Text>
              </div>
              <div className={styles.sectionBody}>
                <div className={styles.relatedGrid}>
                  {relatedServices.map((related) => {
                    const RelatedIcon = iconMap[related.IconName || ''] || FlashRegular;
                    return (
                      <span
                        key={related.Id}
                        className={styles.relatedChip}
                        onClick={() => handleRelatedClick(related)}
                      >
                        <RelatedIcon style={{ width: '16px', height: '16px' }} />
                        {related.Title}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          {/* Quick Facts */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <ClockRegular className={styles.sectionIcon} />
              <Text className={styles.sectionTitle}>Quick Facts</Text>
            </div>
            <div className={styles.quickFacts}>
              <div className={styles.factItem}>
                <span className={styles.factLabel}>Duration</span>
                <span className={styles.factValue}>
                  <ClockRegular style={{ width: '16px', height: '16px', color: '#616161' }} />
                  {service.TypicalDuration}
                </span>
              </div>
              <div className={styles.factItem}>
                <span className={styles.factLabel}>Complexity</span>
                <span className={`${styles.complexityBadge} ${getComplexityStyle(service.ComplexityLevel, styles)}`}>
                  {service.ComplexityLevel}
                </span>
              </div>
              <div className={styles.factItem}>
                <span className={styles.factLabel}>Pricing Model</span>
                <span className={styles.factValue}>
                  <MoneyRegular style={{ width: '16px', height: '16px', color: '#616161' }} />
                  {service.PricingModel}
                </span>
              </div>
              <div className={styles.factItem}>
                <span className={styles.factLabel}>Starting From</span>
                <span className={styles.priceDisplay}>
                  {formatPrice(service.BasePrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Prerequisites */}
          {service.Prerequisites && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <CheckmarkCircleRegular className={styles.sectionIcon} />
                <Text className={styles.sectionTitle}>Prerequisites</Text>
              </div>
              <div className={styles.sectionBody}>
                <Text style={{ fontSize: '14px', color: '#424242', lineHeight: '1.6' }}>
                  {service.Prerequisites}
                </Text>
              </div>
            </div>
          )}

          {/* Team Composition */}
          {service.RequiredRoles && service.RequiredRoles.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <PersonRegular className={styles.sectionIcon} />
                <Text className={styles.sectionTitle}>Team Composition</Text>
              </div>
              <div className={styles.sectionBody}>
                <div className={styles.rolesList}>
                  {service.RequiredRoles.map((role, i) => (
                    <span key={i} className={styles.roleBadge}>
                      <PersonRegular style={{ width: '14px', height: '14px' }} />
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <Button
            className={styles.ctaButton}
            appearance="primary"
            icon={<ArrowRightRegular />}
            iconPosition="after"
            onClick={handleRequestService}
            style={{ width: '100%' }}
          >
            Request This Service
          </Button>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className={styles.ctaBar}>
        <Button
          appearance="secondary"
          icon={<ArrowLeft24Regular />}
          onClick={() => navigate('/services')}
        >
          Back to Catalog
        </Button>
        <Button
          className={styles.ctaButton}
          appearance="primary"
          icon={<ArrowRightRegular />}
          iconPosition="after"
          onClick={handleRequestService}
        >
          Request This Service
        </Button>
      </div>
    </div>
  );
};
