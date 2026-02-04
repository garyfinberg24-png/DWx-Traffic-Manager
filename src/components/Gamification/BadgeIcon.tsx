import React from 'react';
import { makeStyles, Tooltip } from '@fluentui/react-components';
import { gamificationService } from '../../services/GamificationService';

interface BadgeIconProps {
  badgeId: string;
  earned: boolean;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

const sizeMap = { small: '18px', medium: '24px', large: '32px' };

const useStyles = makeStyles({
  earned: {
    cursor: 'default',
    transition: 'transform 0.2s',
    display: 'inline-block',
    ':hover': {
      transform: 'scale(1.15)',
    },
  },
  locked: {
    cursor: 'default',
    opacity: 0.2,
    filter: 'grayscale(100%)',
    display: 'inline-block',
  },
});

export const BadgeIcon: React.FC<BadgeIconProps> = ({
  badgeId,
  earned,
  size = 'medium',
  showTooltip = true,
}) => {
  const styles = useStyles();
  const badge = gamificationService.getBadgeDefinition(badgeId);
  if (!badge) return null;

  const content = (
    <span
      className={earned ? styles.earned : styles.locked}
      style={{ fontSize: sizeMap[size] }}
      role="img"
      aria-label={earned ? badge.name : `${badge.name} (Locked)`}
    >
      {badge.icon}
    </span>
  );

  if (!showTooltip) return content;

  return (
    <Tooltip
      content={
        earned
          ? `${badge.name} - ${badge.description}`
          : `${badge.name} (Locked) - ${badge.unlockCriteria}`
      }
      relationship="description"
    >
      {content}
    </Tooltip>
  );
};
