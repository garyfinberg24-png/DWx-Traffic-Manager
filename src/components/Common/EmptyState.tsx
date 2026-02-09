/**
 * DWx Traffic Manager - Reusable Empty State Component
 * Consistent empty/no-data display across the application.
 */

import React from 'react';
import { Text, Button, makeStyles, shorthands } from '@fluentui/react-components';
import { SearchRegular } from '@fluentui/react-icons';
import { DW_COLORS } from '../../utils/buttonStyles';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('48px', '20px'),
    textAlign: 'center',
    backgroundColor: '#fafbfc',
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('2px', 'dashed', '#e5e7eb'),
  },
  icon: {
    width: '48px',
    height: '48px',
    color: '#d1d5db',
    marginBottom: '12px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '4px',
  },
  description: {
    fontSize: '13px',
    color: '#9ca3af',
    maxWidth: '360px',
    lineHeight: '1.5',
  },
});

interface EmptyStateProps {
  icon?: React.ReactElement;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = 'No data available',
  description,
  actionLabel,
  onAction,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      {icon ? (
        React.cloneElement(icon, { className: styles.icon })
      ) : (
        <SearchRegular className={styles.icon} />
      )}
      <Text className={styles.title}>{title}</Text>
      {description && <Text className={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Button
          appearance="primary"
          style={{ marginTop: '16px', backgroundColor: DW_COLORS.teal }}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
