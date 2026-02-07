/**
 * DWx Traffic Manager - Hero Collapse Toggle
 * Small chevron pill button positioned at the bottom-center of a hero banner.
 * Toggles between collapsed (56px strip) and expanded states.
 */

import React from 'react';
import { makeStyles, shorthands, Tooltip } from '@fluentui/react-components';
import { ChevronUp20Regular, ChevronDown20Regular } from '@fluentui/react-icons';

interface HeroCollapseToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const useStyles = makeStyles({
  toggle: {
    position: 'absolute',
    bottom: '-16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    width: '32px',
    height: '32px',
    ...shorthands.borderRadius('50%'),
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.3)'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transitionProperty: 'background-color, border-color',
    transitionDuration: '200ms',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.3)',
      ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.5)'),
    },
  },
});

export const HeroCollapseToggle: React.FC<HeroCollapseToggleProps> = ({
  isCollapsed,
  onToggle,
}) => {
  const styles = useStyles();

  return (
    <Tooltip
      content={isCollapsed ? 'Expand hero' : 'Collapse hero'}
      relationship="label"
    >
      <button
        className={styles.toggle}
        onClick={onToggle}
        aria-label={isCollapsed ? 'Expand hero banner' : 'Collapse hero banner'}
        aria-expanded={!isCollapsed}
      >
        {isCollapsed ? <ChevronDown20Regular /> : <ChevronUp20Regular />}
      </button>
    </Tooltip>
  );
};
