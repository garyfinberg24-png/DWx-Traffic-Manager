/**
 * DWx Traffic Manager - Service Card Component
 * Displays a service offering in a card format with category, complexity, and pricing info
 */

import React from 'react';
import {
  Card,
  Text,
  makeStyles,
} from '@fluentui/react-components';
import {
  FlashRegular,
  CodeRegular,
  CloudArrowUpRegular,
  ShieldCheckmarkRegular,
  BotRegular,
  PeopleTeamRegular,
  ClockRegular,
  MoneyRegular,
  DocumentBulletListRegular,
  GavelRegular,
  WrenchRegular,
  ShieldTaskRegular,
  LightbulbRegular,
} from '@fluentui/react-icons';
import { DWService, ServiceCategory, ServiceComplexity } from '../../types/ServiceRequest';

const useStyles = makeStyles({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    ':hover': {
      boxShadow: '0 3.2px 7.2px 0 rgba(0,0,0,.13), 0 0.6px 1.8px 0 rgba(0,0,0,.11)',
      transform: 'translateY(-2px)',
    },
  },
  cardHeader: {
    padding: '14px 16px 12px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
  iconContainer: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
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
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '2px',
    lineHeight: '1.3',
  },
  shortDescription: {
    fontSize: '12px',
    color: '#616161',
    lineHeight: '1.3',
  },
  cardBody: {
    padding: '10px 16px',
    flex: 1,
  },
  description: {
    fontSize: '12px',
    color: '#424242',
    lineHeight: '1.5',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardFooter: {
    padding: '10px 16px 12px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    borderTop: '1px solid #f0f0f0',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    padding: '3px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '500',
  },
  categoryBadge: {
    backgroundColor: '#f0f4f8',
    color: '#1e6b7b',
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
  durationBadge: {
    backgroundColor: '#f5f5f5',
    color: '#616161',
  },
  pricingBadge: {
    backgroundColor: '#e8f4f6',
    color: '#0078d4',
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
  DocumentBulletList: DocumentBulletListRegular,
  Gavel: GavelRegular,
  Wrench: WrenchRegular,
  ShieldTask: ShieldTaskRegular,
  Lightbulb: LightbulbRegular,
};

// Category colors
const categoryColors: Record<ServiceCategory, string> = {
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

interface ServiceCardProps {
  service: DWService;
  onClick: (service: DWService) => void;
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

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onClick }) => {
  const styles = useStyles();

  const IconComponent = iconMap[service.IconName || ''] || FlashRegular;
  const categoryColor = categoryColors[service.Category] || '#1e6b7b';

  return (
    <Card className={styles.card} onClick={() => onClick(service)}>
      <div className={styles.cardHeader}>
        <div
          className={styles.iconContainer}
          style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
        >
          <IconComponent style={{ width: '20px', height: '20px' }} />
        </div>
        <div className={styles.headerContent}>
          <Text className={styles.title}>{service.Title}</Text>
          <Text className={styles.shortDescription}>{service.ShortDescription}</Text>
        </div>
      </div>

      <div className={styles.cardBody}>
        <Text className={styles.description}>{service.Description}</Text>
      </div>

      <div className={styles.cardFooter}>
        <span className={`${styles.badge} ${styles.categoryBadge}`}>
          {service.Category}
        </span>
        <span className={`${styles.badge} ${getComplexityStyle(service.ComplexityLevel, styles)}`}>
          {service.ComplexityLevel}
        </span>
        <span className={`${styles.badge} ${styles.durationBadge}`}>
          <ClockRegular style={{ width: '12px', height: '12px' }} />
          {service.TypicalDuration}
        </span>
        <span className={`${styles.badge} ${styles.pricingBadge}`}>
          <MoneyRegular style={{ width: '12px', height: '12px' }} />
          {service.PricingModel}
        </span>
      </div>
    </Card>
  );
};
