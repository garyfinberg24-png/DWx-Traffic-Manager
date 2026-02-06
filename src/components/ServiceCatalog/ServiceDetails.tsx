/**
 * DWx Traffic Manager - Service Details Modal
 * Full service information with prerequisites and action buttons
 * Updated design with colored header
 */

import React from 'react';
import {
  Dialog,
  DialogSurface,
  Text,
  Button,
  makeStyles,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import {
  FlashRegular,
  CodeRegular,
  CloudArrowUpRegular,
  ShieldCheckmarkRegular,
  BotRegular,
  PeopleTeamRegular,
  ClockRegular,
  CheckmarkCircleRegular,
  PersonRegular,
  InfoRegular,
} from '@fluentui/react-icons';
import { DWService, ServiceComplexity } from '../../types/ServiceRequest';

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '560px',
    width: '90vw',
    padding: '0',
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#1a5a8a',
    color: 'white',
    borderRadius: '8px 8px 0 0',
    marginTop: '-1px',
    marginLeft: '-1px',
    marginRight: '-1px',
  },
  iconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerContent: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    marginBottom: '2px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.8)',
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
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
  content: {
    padding: '0',
    maxHeight: '60vh',
    overflowY: 'auto',
  },
  section: {
    padding: '20px 24px',
    borderBottom: '1px solid #e8e8e8',
  },
  sectionLast: {
    padding: '20px 24px',
    borderBottom: 'none',
  },
  sectionHeader: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#1a5a8a',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
    borderLeft: '3px solid #1a5a8a',
    paddingLeft: '10px',
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
    fontSize: '11px',
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
    padding: '6px 12px',
    backgroundColor: '#e8f4fc',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#1a5a8a',
    border: '1px solid #cce4f0',
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
  cancelButton: {
    minWidth: '80px',
  },
  submitButton: {
    backgroundColor: '#1a5a8a',
    color: 'white',
    fontWeight: '600',
    minWidth: '140px',
    ':hover': {
      backgroundColor: '#145a7a',
    },
  },
  priceDisplay: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a5a8a',
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

interface ServiceDetailsProps {
  service: DWService;
  isOpen: boolean;
  onClose: () => void;
  onRequestService: (service: DWService) => void;
  onViewFullDetails?: (service: DWService) => void;
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
  onViewFullDetails,
}) => {
  const styles = useStyles();

  const IconComponent = iconMap[service.IconName || ''] || FlashRegular;

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface}>
        {/* Header with colored background */}
        <div className={styles.header}>
            <div className={styles.iconContainer}>
              <IconComponent style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div className={styles.headerContent}>
              <Text className={styles.title}>{service.Title}</Text>
              <Text className={styles.subtitle}>{service.Category}</Text>
            </div>
            <button
              className={styles.closeButton}
              onClick={onClose}
              title="Close"
            >
              <Dismiss24Regular />
            </button>
          </div>

          {/* Content */}
          <div className={styles.content}>
            {/* About Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <InfoRegular style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                About this Service
              </div>
              <Text className={styles.description}>{service.Description}</Text>
            </div>

            {/* Service Details Grid */}
            <div className={styles.section}>
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
            </div>

            {/* Prerequisites */}
            {service.Prerequisites && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <CheckmarkCircleRegular style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                  Prerequisites
                </div>
                <Text className={styles.prerequisitesList}>{service.Prerequisites}</Text>
              </div>
            )}

            {/* Required Roles */}
            {service.RequiredRoles && service.RequiredRoles.length > 0 && (
              <div className={styles.sectionLast}>
                <div className={styles.sectionHeader}>
                  <PersonRegular style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                  Specialist Roles Required
                </div>
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
          </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Button
            appearance="secondary"
            onClick={onClose}
            className={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            appearance="subtle"
            onClick={() => {
              onClose();
              if (onViewFullDetails) {
                onViewFullDetails(service);
              }
            }}
          >
            View Full Details
          </Button>
          <Button
            className={styles.submitButton}
            appearance="primary"
            onClick={() => onRequestService(service)}
          >
            Request This Service
          </Button>
        </div>
      </DialogSurface>
    </Dialog>
  );
};
