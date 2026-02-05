import React, { useEffect, useState } from 'react';
import { FluentProvider, webLightTheme, teamsDarkTheme, teamsLightTheme } from '@fluentui/react-components';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import * as microsoftTeams from '@microsoft/teams-js';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { TemplateProvider } from './contexts/TemplateContext';
import { ManagerDashboard } from './components/Dashboard';
import { AdminPage, AccountManagerManagement } from './components/Admin';
import { Header, ErrorBoundary, LoadingSpinner, UserGuide } from './components/Common';
// DWx Traffic Manager - New Components
import { LandingPage } from './components/LandingPage';
import { ProductCatalog } from './components/ProductCatalog';
import { ServiceCatalog, ServiceDetailPage } from './components/ServiceCatalog';
import { ServiceRequestForm } from './components/ServiceRequest';
import { ProductRequestForm } from './components/ProductRequest';
import { MyRequests } from './components/MyRequests';
import { SalesFunnelDashboard } from './components/SalesFunnel';
import { LoginPage } from './components/LoginPage';
import { getAuthService } from './services/serviceFactory';
import { validateConfig } from './config/environmentConfig';
import { isTestMode } from './config/testModeConfig';
import { makeStyles, tokens, Text } from '@fluentui/react-components';

// Get the appropriate auth service based on test mode
const authService = getAuthService();

const useStyles = makeStyles({
  app: {
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  main: {
    paddingTop: tokens.spacingVerticalM,
  },
  loginContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
  },
  configError: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
    color: tokens.colorPaletteRedForeground1,
  },
});

// Login screen component - uses the new styled LoginPage
const LoginScreen: React.FC = () => {
  return <LoginPage />;
};

// Protected route for managers only
const ManagerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isManager } = useAuth();

  if (!isManager) {
    return <Navigate to="/booking" replace />;
  }

  return <>{children}</>;
};

// Main routes component
const AppRoutes: React.FC = () => {
  const styles = useStyles();
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullPage label="Initializing..." />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className={styles.app}>
      <Header />
      <UserGuide userName={user?.displayName} />
      <main className={styles.main}>
        <Routes>
          {/* DWx Traffic Manager - Primary Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/services" element={<ServiceCatalog />} />
          <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
          <Route path="/products" element={<ProductCatalog />} />
          <Route path="/request" element={<ServiceRequestForm />} />
          <Route path="/product-request" element={<ProductRequestForm />} />
          <Route path="/requests" element={<MyRequests />} />
          <Route
            path="/pipeline"
            element={
              <ManagerRoute>
                <SalesFunnelDashboard />
              </ManagerRoute>
            }
          />

          {/* Manager Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ManagerRoute>
                <ManagerDashboard />
              </ManagerRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ManagerRoute>
                <AdminPage />
              </ManagerRoute>
            }
          />
          <Route
            path="/admin/account-managers"
            element={
              <ManagerRoute>
                <AccountManagerManagement />
              </ManagerRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

// Configuration error component
const ConfigError: React.FC<{ missing: string[] }> = ({ missing }) => {
  const styles = useStyles();

  return (
    <div className={styles.configError}>
      <Text weight="semibold" size={600}>
        Configuration Error
      </Text>
      <Text size={400}>
        Missing required environment variables:
      </Text>
      <ul>
        {missing.map((key) => (
          <li key={key}>{key}</li>
        ))}
      </ul>
      <Text size={300}>
        Please check your .env.local file and restart the application.
      </Text>
    </div>
  );
};

// Inner providers without MSAL (for test mode and normal mode)
const InnerProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <TemplateProvider>
          <ToastProvider>
            <BrowserRouter>
              {children}
            </BrowserRouter>
          </ToastProvider>
        </TemplateProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

// App wrapper with providers
const AppWithProviders: React.FC = () => {
  // In test mode, skip MsalProvider entirely
  if (isTestMode) {
    console.log('[App] Running in TEST MODE - skipping MsalProvider');
    return (
      <InnerProviders>
        <AppRoutes />
      </InnerProviders>
    );
  }

  // In normal mode, wrap with MsalProvider
  return (
    <MsalProvider instance={authService.getMsalInstance() as PublicClientApplication}>
      <InnerProviders>
        <AppRoutes />
      </InnerProviders>
    </MsalProvider>
  );
};

// Main App component
const App: React.FC = () => {
  const [teamsTheme, setTeamsTheme] = useState<'light' | 'dark' | 'contrast'>('light');
  const [isTeamsApp, setIsTeamsApp] = useState(false);
  const [configValid, setConfigValid] = useState<{ isValid: boolean; missing: string[] }>({
    isValid: true,
    missing: [],
  });

  useEffect(() => {
    // In test mode, skip config validation
    if (isTestMode) {
      console.log('[App] TEST MODE - skipping config validation');
      setConfigValid({ isValid: true, missing: [] });
    } else {
      // Validate configuration
      const validation = validateConfig();
      setConfigValid(validation);

      if (!validation.isValid) {
        return;
      }
    }

    // Try to initialize Teams SDK
    const initTeams = async () => {
      try {
        await microsoftTeams.app.initialize();
        setIsTeamsApp(true);

        // Get Teams theme
        const context = await microsoftTeams.app.getContext();
        if (context.app.theme) {
          setTeamsTheme(context.app.theme as 'light' | 'dark' | 'contrast');
        }

        // Listen for theme changes
        microsoftTeams.app.registerOnThemeChangeHandler((theme) => {
          setTeamsTheme(theme as 'light' | 'dark' | 'contrast');
        });
      } catch {
        // Not running in Teams, use default theme
        setIsTeamsApp(false);
      }
    };

    initTeams();
  }, []);

  if (!configValid.isValid) {
    return (
      <FluentProvider theme={webLightTheme}>
        <ConfigError missing={configValid.missing} />
      </FluentProvider>
    );
  }

  // Select theme based on Teams context or default
  const theme = isTeamsApp
    ? teamsTheme === 'dark'
      ? teamsDarkTheme
      : teamsLightTheme
    : webLightTheme;

  return (
    <FluentProvider theme={theme}>
      <ErrorBoundary>
        <AppWithProviders />
      </ErrorBoundary>
    </FluentProvider>
  );
};

export default App;
