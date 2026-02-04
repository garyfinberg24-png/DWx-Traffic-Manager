import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Button,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ErrorCircle24Regular, ArrowClockwise24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    padding: tokens.spacingVerticalXXL,
  },
  card: {
    maxWidth: '500px',
    width: '100%',
  },
  preview: {
    display: 'flex',
    justifyContent: 'center',
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorPaletteRedBackground1,
  },
  icon: {
    fontSize: '48px',
    color: tokens.colorPaletteRedForeground1,
  },
  content: {
    padding: tokens.spacingVerticalL,
    textAlign: 'center',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
  },
});

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Functional wrapper component for styles
const ErrorDisplay: React.FC<{ error: Error; onRetry: () => void }> = ({ error, onRetry }) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardPreview className={styles.preview}>
          <ErrorCircle24Regular className={styles.icon} />
        </CardPreview>
        <CardHeader
          header={<Text weight="semibold" size={500}>Something went wrong</Text>}
          description={
            <Text size={300}>
              {error.message || 'An unexpected error occurred'}
            </Text>
          }
        />
        <div className={styles.content}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Please try refreshing the page or contact support if the problem persists.
          </Text>
          <div className={styles.actions}>
            <Button
              appearance="primary"
              icon={<ArrowClockwise24Regular />}
              onClick={onRetry}
            >
              Try Again
            </Button>
            <Button
              appearance="secondary"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorDisplay
          error={this.state.error || new Error('Unknown error')}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
