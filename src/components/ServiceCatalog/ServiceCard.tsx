/**
 * DWx Traffic Manager - Service Card Component
 * V1 design: colored left-border accent, enhanced typography, hover lift
 */

import React from 'react';
import {
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
  ArrowRightRegular,
} from '@fluentui/react-icons';
import { DWService, ServiceCategory, ServiceComplexity } from '../../types/ServiceRequest';

const useStyles = makeStyles({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    height: '100%',
    display: 'flex',
    border: '1px solid #e5e7eb',
    ':hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.12), 0 12px 28px rgba(0,0,0,0.08)',
      transform: 'translateY(-3px)',
      border: '1px solid #d1d5db',
    },
  },
  accent: {
    width: '5px',
    flexShrink: 0,
  },
  body: {
    padding: '16px 18px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '8px',
  },
  iconContainer: {
    width: '44px',
    height: '44px',
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
    fontSize: '15px',
    fontWeight: '700',
    color: '#111827',
    lineHeight: '1.3',
    marginBottom: '2px',
  },
  tags: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  description: {
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: '1.5',
    marginBottom: '10px',
    flex: 1,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: '10px',
    borderTop: '1px solid #f3f4f6',
  },
  metaTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '10px',
    fontWeight: '500',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  complexityLow: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  complexityMedium: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  complexityHigh: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  complexityEnterprise: {
    backgroundColor: '#ede9fe',
    color: '#5b21b6',
  },
  durationTag: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  pricingTag: {
    backgroundColor: '#e8f4f6',
    color: '#0078d4',
  },
  viewLink: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#1a5a8a',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 14px',
    borderRadius: '6px',
    transition: 'background-color 0.2s, gap 0.2s',
    flexShrink: 0,
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
export const categoryColors: Record<ServiceCategory, string> = {
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
    case 'Low': return styles.complexityLow;
    case 'Medium': return styles.complexityMedium;
    case 'High': return styles.complexityHigh;
    case 'Enterprise': return styles.complexityEnterprise;
    default: return styles.complexityMedium;
  }
};

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onClick }) => {
  const styles = useStyles();

  const IconComponent = iconMap[service.IconName || ''] || FlashRegular;
  const categoryColor = categoryColors[service.Category] || '#1e6b7b';

  return (
    <div className={styles.card} onClick={() => onClick(service)}>
      {/* Colored left accent bar */}
      <div className={styles.accent} style={{ backgroundColor: categoryColor }} />

      <div className={styles.body}>
        <div className={styles.header}>
          <div
            className={styles.iconContainer}
            style={{ backgroundColor: `${categoryColor}12`, color: categoryColor }}
          >
            <IconComponent style={{ width: '22px', height: '22px' }} />
          </div>
          <div className={styles.headerContent}>
            <Text className={styles.title}>{service.Title}</Text>
          </div>
        </div>

        <Text className={styles.description}>{service.ShortDescription}</Text>

        <div className={styles.tags}>
          <span className={`${styles.metaTag} ${getComplexityStyle(service.ComplexityLevel, styles)}`}>
            {service.ComplexityLevel}
          </span>
          <span className={`${styles.metaTag} ${styles.durationTag}`}>
            <ClockRegular style={{ width: '10px', height: '10px' }} />
            {service.TypicalDuration}
          </span>
          <span className={`${styles.metaTag} ${styles.pricingTag}`}>
            <MoneyRegular style={{ width: '10px', height: '10px' }} />
            {service.PricingModel}
          </span>
        </div>

        <div className={styles.footer}>
          <span className={styles.viewLink}>
            View
            <ArrowRightRegular style={{ width: '12px', height: '12px' }} />
          </span>
        </div>
      </div>
    </div>
  );
};
