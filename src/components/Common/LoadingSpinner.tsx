import React from 'react';
import { Spinner, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacingVerticalXXL,
    minHeight: '200px',
  },
  fullPage: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
  },
});

interface LoadingSpinnerProps {
  label?: string;
  fullPage?: boolean;
  size?: 'tiny' | 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | 'huge';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading...',
  fullPage = false,
  size = 'medium',
}) => {
  const styles = useStyles();

  return (
    <div className={`${styles.container} ${fullPage ? styles.fullPage : ''}`}>
      <Spinner size={size} label={label} />
    </div>
  );
};
