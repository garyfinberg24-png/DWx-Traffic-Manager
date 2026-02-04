/**
 * DWx Traffic Manager - Service Details Modal
 * Full service information with prerequisites and action buttons
 */

import React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  Text,
  Button,
  Divider,
  makeStyles,
} from '@fluentui/react-components';
import { Dismiss16Regular } from '@fluentui/react-icons';
import {
  FlashRegular,
  CodeRegular,
  CloudArrowUpRegular,
  ShieldCheckmarkRegular,
  BotRegular,
  PeopleTeamRegular,
  ClockRegular,
  MoneyRegular,
  CheckmarkCircleRegular,
  PersonRegular,
  InfoRegular,
} from '@fluentui/react-icons';
import { DWService, ServiceCategory, ServiceComplexity } from '../../types/ServiceRequest';

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '600px',
    width: '90vw',
    padding: '0',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  header: {
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #e1e1e1',
  },
  iconContainer: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerContent: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '4px',
  },
  category: {
    fontSize: '14px',
    color: '#616161',
  },
  closeButton: {
    position: 'absolute' as const,
    top: '16px',
    right: '16px',
    minWidth: '28px',
    padding: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '4px',
    ':hover': {
      backgroundColor: '#e1e1e1',
    },
  },
  content: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  description: {
    fontSize: '14px',
    color: '#424242',
    lineHeight: '1.6',
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metaLabel: {
    fontSize: '12px',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  metaValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#242424',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  prerequisitesList: {
    fontSize: '14px',
    color: '#424242',
    lineHeight: '1.6',
    paddingLeft: '8px',
  },
  rolesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    backgroundColor: '#f0f4f8',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#1e6b7b',
  },
  complexityBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
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
  footer: {
    padding: '16px 24px',
    backgroundColor: '#fafafa',
    borderTop: '1px solid #e1e1e1',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  requestButton: {
    backgroundColor: '#1e6b7b',
    color: 'white',
    fontWeight: '600',
    ':hover': {
      backgroundColor: '#165a68',
    },
  },
  priceDisplay: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#107c10',
  },
});

// Map icon names to components
const iconMap: Record<string, React.ElementType> = {
  LightningBolt: FlashRegular,
  Code: CodeRegular,
  CloudArrowUp: CloudArrowUpRegular,
  ShieldCheckmark: ShieldCheckmarkRegular,
  Bot: BotRegular,
  PeopleTeam: PeopleTeamRegular,
};

// Category colors
const categoryColors: Record<ServiceCategory, string> = {
  'Power Platform': '#742774',
  'SPFx Development': '#0078d4',
  'SharePoint Migration': '#00a4ef',
  'M365 Assessment': '#107c10',
  'Copilot Agents': '#6264a7',
  'MS Viva': '#e5559a',
};

interface ServiceDetailsProps {
  service: DWService;
  isOpen: boolean;
  onClose: () => void;
  onRequestService: (service: DWService) => void;
}

const getComplexityStyle = (
  complexity: ServiceComplexity,
  styles: ReturnType<typeof useStyles>
): string => {
  switch (complexity) {
    case 'Low':
      return styles.complexityLow;
    case 'Medium':
      return styles.complexityMedium;
    case 'High':
      return styles.complexityHigh;
    case 'Enterprise':
      return styles.complexityEnterprise;
    default:
      return styles.complexityMedium;
  }
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

export const ServiceDetails: React.FC<ServiceDetailsProps> = ({
  service,
  isOpen,
  onClose,
  onRequestService,
}) => {
  const styles = useStyles();

  const IconComponent = iconMap[service.IconName || ''] || FlashRegular;
  const categoryColor = categoryColors[service.Category] || '#1e6b7b';

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody style={{ padding: 0 }}>
          <div className={styles.header}>
            <div
              className={styles.iconContainer}
              style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
            >
              <IconComponent style={{ width: '28px', height: '28px' }} />
            </div>
            <div className={styles.headerContent}>
              <DialogTitle className={styles.title}>{service.Title}</DialogTitle>
              <Text className={styles.category}>{service.Category}</Text>
            </div>
            <Button
              className={styles.closeButton}
              appearance="subtle"
              icon={<Dismiss16Regular />}
              onClick={onClose}
              title="Close"
            />
          </div>

          <DialogContent className={styles.content}>
            {/* Description */}
            <div className={styles.section}>
              <Text className={styles.sectionTitle}>
                <InfoRegular style={{ width: '16px', height: '16px' }} />
                About this Service
              </Text>
              <Text className={styles.description}>{service.Description}</Text>
            </div>

            <Divider />

            {/* Meta Information Grid */}
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Typical Duration</span>
                <span className={styles.metaValue}>
                  <ClockRegular style={{ width: '16px', height: '16px', color: '#616161' }} />
                  {service.TypicalDuration}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Complexity</span>
                <span className={`${styles.complexityBadge} ${getComplexityStyle(service.ComplexityLevel, styles)}`}>
                  {service.ComplexityLevel}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Pricing Model</span>
                <span className={styles.metaValue}>
                  <MoneyRegular style={{ width: '16px', height: '16px', color: '#616161' }} />
                  {service.PricingModel}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Starting From</span>
                <span className={styles.priceDisplay}>
                  {formatPrice(service.BasePrice)}
                </span>
              </div>
            </div>

            <Divider />

            {/* Prerequisites */}
            {service.Prerequisites && (
              <div className={styles.section}>
                <Text className={styles.sectionTitle}>
                  <CheckmarkCircleRegular style={{ width: '16px', height: '16px' }} />
                  Prerequisites
                </Text>
                <Text className={styles.prerequisitesList}>{service.Prerequisites}</Text>
              </div>
            )}

            {/* Required Roles */}
            {service.RequiredRoles && service.RequiredRoles.length > 0 && (
              <div className={styles.section}>
                <Text className={styles.sectionTitle}>
                  <PersonRegular style={{ width: '16px', height: '16px' }} />
                  Specialist Roles Required
                </Text>
                <div className={styles.rolesList}>
                  {service.RequiredRoles.map((role, index) => (
                    <span key={index} className={styles.roleBadge}>
                      <PersonRegular style={{ width: '14px', height: '14px' }} />
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>

          <div className={styles.footer}>
            <Button appearance="secondary" onClick={onClose}>
              Close
            </Button>
            <Button
              className={styles.requestButton}
              appearance="primary"
              onClick={() => onRequestService(service)}
            >
              Request This Service
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
