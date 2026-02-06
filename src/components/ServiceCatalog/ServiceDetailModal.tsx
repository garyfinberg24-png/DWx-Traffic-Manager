/**
 * DWx Traffic Manager - Service Detail Modal (Large)
 * Full service information in a large modal with sidebar layout
 * Replaces the full-page ServiceDetailPage for in-catalog browsing
 */

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogSurface,
  Text,
  Button,
  makeStyles,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
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

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '920px',
    width: '92vw',
    maxHeight: '90vh',
    padding: '0',
    borderRadius: '12px',
    boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  // Hero header
  hero: {
    padding: '24px 32px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    color: 'white',
    flexShrink: 0,
    margin: '-1px -1px 0 -1px',
    borderRadius: '12px 12px 0 0',
  },
  heroIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroText: {
    flex: 1,
    minWidth: 0,
  },
  heroCategory: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    padding: '3px 10px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: '6px',
  },
  heroTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: 'white',
    lineHeight: '1.2',
    marginBottom: '4px',
  },
  heroSubtitle: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: '1.4',
  },
  closeButton: {
    minWidth: '36px',
    height: '36px',
    padding: '0',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
  // Scrollable content area
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  // Content grid: main + sidebar
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: '0',
    minHeight: '0',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #e8e8e8',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fafafa',
  },
  // Section styling
  section: {
    borderBottom: '1px solid #f0f0f0',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 24px',
    borderBottom: '1px solid #f0f0f0',
    backgroundColor: '#fafafa',
  },
  sectionIcon: {
    color: '#1a5a8a',
    width: '18px',
    height: '18px',
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#242424',
  },
  sectionBody: {
    padding: '16px 24px',
  },
  // About section
  aboutText: {
    fontSize: '14px',
    color: '#424242',
    lineHeight: '1.7',
  },
  // Quick Facts in sidebar
  quickFacts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
  },
  factItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  factLabel: {
    fontSize: '10px',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '500',
  },
  factValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  // Lists
  bulletList: {
    listStyleType: 'none',
    padding: '0',
    margin: '0',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  bulletItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '13px',
    color: '#424242',
    lineHeight: '1.5',
  },
  bulletIcon: {
    color: '#1a5a8a',
    width: '16px',
    height: '16px',
    flexShrink: 0,
    marginTop: '2px',
  },
  // Timeline
  timeline: {
    display: 'flex',
    flexDirection: 'column',
  },
  timelineStep: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 0',
    position: 'relative',
  },
  timelineIndicator: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
    width: '28px',
  },
  timelineCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#e8f4fc',
    color: '#1a5a8a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    border: '2px solid #1a5a8a',
    flexShrink: 0,
  },
  timelineLine: {
    width: '2px',
    flex: 1,
    backgroundColor: '#d0e4f0',
    minHeight: '12px',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: '2px',
  },
  timelineName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '2px',
  },
  timelineDesc: {
    fontSize: '12px',
    color: '#616161',
    lineHeight: '1.4',
  },
  // Role badges
  rolesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
  },
  rolesLabel: {
    fontSize: '10px',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '500',
    width: '100%',
    marginBottom: '4px',
  },
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 10px',
    backgroundColor: '#e8f4fc',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#1a5a8a',
    border: '1px solid #cce4f0',
  },
  // Prerequisites in sidebar
  prerequisitesSection: {
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
  },
  prerequisitesLabel: {
    fontSize: '10px',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '500',
    marginBottom: '8px',
  },
  prerequisitesText: {
    fontSize: '13px',
    color: '#424242',
    lineHeight: '1.5',
  },
  // Complexity badge
  complexityBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: '4px',
    fontSize: '12px',
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
    fontSize: '16px',
    fontWeight: '700',
    color: '#1a5a8a',
  },
  // Related services
  relatedGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  relatedChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#1a5a8a',
    backgroundColor: '#f0f4f8',
    border: '1px solid #d0e4f0',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#e0ecf4',
    },
  },
  // Footer
  footer: {
    padding: '14px 24px',
    backgroundColor: '#fafafa',
    borderTop: '1px solid #e1e1e1',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    flexShrink: 0,
  },
  requestButton: {
    backgroundColor: '#1a5a8a',
    color: 'white',
    fontWeight: '600',
    ':hover': {
      backgroundColor: '#145a7a',
    },
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

interface ServiceDetailModalProps {
  service: DWService;
  isOpen: boolean;
  onClose: () => void;
  onRequestService: (service: DWService) => void;
  /** All services from catalog — used for related services chips */
  allServices?: DWService[];
  /** Called when user clicks a related service chip */
  onViewService?: (service: DWService) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  isOpen,
  onClose,
  onRequestService,
  allServices = [],
  onViewService,
}) => {
  const styles = useStyles();

  const heroColor = categoryColors[service.Category] || '#1a5a8a';
  const IconComponent = iconMap[service.IconName || ''] || FlashRegular;

  const relatedServices = useMemo(() => {
    if (!service.RelatedCategories || allServices.length === 0) return [];
    return allServices.filter(
      s => s.Id !== service.Id && service.RelatedCategories!.includes(s.Category)
    );
  }, [service, allServices]);

  const handleRelatedClick = (related: DWService) => {
    if (onViewService) {
      onViewService(related);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface}>
        {/* Hero Header */}
        <div className={styles.hero} style={{ backgroundColor: heroColor }}>
          <div className={styles.heroIcon}>
            <IconComponent style={{ width: '28px', height: '28px', color: 'white' }} />
          </div>
          <div className={styles.heroText}>
            <span className={styles.heroCategory}>{service.Category}</span>
            <Text className={styles.heroTitle} block>{service.Title}</Text>
            <Text className={styles.heroSubtitle}>{service.ShortDescription}</Text>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            title="Close"
          >
            <Dismiss24Regular />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className={styles.scrollArea}>
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
                            <RelatedIcon style={{ width: '14px', height: '14px' }} />
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
              <div className={styles.quickFacts}>
                <div className={styles.factItem}>
                  <span className={styles.factLabel}>Duration</span>
                  <span className={styles.factValue}>
                    <ClockRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
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
                    <MoneyRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
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

              {/* Prerequisites */}
              {service.Prerequisites && (
                <div className={styles.prerequisitesSection}>
                  <div className={styles.prerequisitesLabel}>Prerequisites</div>
                  <Text className={styles.prerequisitesText}>{service.Prerequisites}</Text>
                </div>
              )}

              {/* Team Composition */}
              {service.RequiredRoles && service.RequiredRoles.length > 0 && (
                <div className={styles.rolesList}>
                  <span className={styles.rolesLabel}>Team Composition</span>
                  {service.RequiredRoles.map((role, i) => (
                    <span key={i} className={styles.roleBadge}>
                      <PersonRegular style={{ width: '12px', height: '12px' }} />
                      {role}
                    </span>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Button appearance="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            className={styles.requestButton}
            appearance="primary"
            icon={<ArrowRightRegular />}
            iconPosition="after"
            onClick={() => onRequestService(service)}
          >
            Request This Service
          </Button>
        </div>
      </DialogSurface>
    </Dialog>
  );
};
