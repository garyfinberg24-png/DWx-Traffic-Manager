import React from 'react';
import { makeStyles, Button, Text, Spinner } from '@fluentui/react-components';
import { ShieldCheckmark24Regular, Checkmark24Regular } from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';

const useStyles = makeStyles({
  // Root container - full viewport split screen
  root: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    '@media (max-width: 800px)': {
      flexDirection: 'column',
    },
  },

  // Left brand panel with teal gradient
  brandPanel: {
    flex: 1,
    background: 'linear-gradient(160deg, #154f5c 0%, #1e6b7b 45%, #2d8a9c 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '56px',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    '::before': {
      content: "''",
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: 'radial-gradient(circle at 15% 40%, rgba(255,255,255,0.07) 0%, transparent 45%), radial-gradient(circle at 85% 75%, rgba(255,255,255,0.04) 0%, transparent 35%)',
      pointerEvents: 'none',
    },
    '@media (max-width: 960px)': {
      padding: '40px 32px',
    },
    '@media (max-width: 800px)': {
      padding: '36px 28px',
    },
  },

  brandContent: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '500px',
    marginLeft: '50px',
    '@media (max-width: 960px)': {
      marginLeft: '25px',
    },
    '@media (max-width: 800px)': {
      marginLeft: '0',
    },
  },

  // Logo section
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '40px',
  },

  logo: {
    width: '88px',
    height: '88px',
    filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
  },

  logoTextContainer: {
    display: 'flex',
    flexDirection: 'column',
  },

  logoText: {
    fontSize: '36px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    lineHeight: '1.1',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },

  logoTagline: {
    fontSize: '15px',
    fontWeight: '400',
    opacity: 0.85,
    letterSpacing: '0.5px',
    marginTop: '4px',
  },

  // Hero section
  heroTitle: {
    fontSize: '40px',
    fontWeight: '700',
    lineHeight: '1.15',
    marginBottom: '18px',
    letterSpacing: '-0.5px',
    '@media (max-width: 960px)': {
      fontSize: '32px',
    },
  },

  accent: {
    color: '#e5a84b',
  },

  heroDescription: {
    fontSize: '15px',
    lineHeight: '1.65',
    opacity: 0.9,
    marginBottom: '40px',
    maxWidth: '440px',
  },

  // Illustration
  illustration: {
    marginBottom: '40px',
    '@media (max-width: 800px)': {
      display: 'none',
    },
  },

  // Stats row
  statsRow: {
    display: 'flex',
    gap: '36px',
    padding: '24px 0',
    borderTop: '1px solid rgba(255, 255, 255, 0.15)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
    marginBottom: '32px',
    '@media (max-width: 960px)': {
      gap: '24px',
    },
    '@media (max-width: 800px)': {
      flexWrap: 'wrap',
    },
  },

  statItem: {
    textAlign: 'left',
  },

  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '2px',
    '@media (max-width: 960px)': {
      fontSize: '24px',
    },
  },

  statLabel: {
    fontSize: '12px',
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  // Testimonial
  testimonial: {
    padding: '20px 24px',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    borderLeft: '3px solid #e5a84b',
    '@media (max-width: 800px)': {
      display: 'none',
    },
  },

  testimonialText: {
    fontSize: '14px',
    fontStyle: 'italic',
    lineHeight: '1.6',
    marginBottom: '14px',
    opacity: 0.95,
  },

  testimonialAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  authorAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '13px',
  },

  authorName: {
    fontWeight: '600',
    fontSize: '13px',
  },

  authorRole: {
    fontSize: '11px',
    opacity: 0.7,
  },

  // Right login panel
  loginPanel: {
    flex: '0 0 560px',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '56px 48px',
    '@media (max-width: 960px)': {
      flex: '0 0 500px',
      padding: '40px 32px',
    },
    '@media (max-width: 800px)': {
      flex: 'none',
      padding: '36px 28px',
    },
  },

  loginContainer: {
    width: '100%',
    maxWidth: '340px',
    margin: '0 auto',
  },

  loginHeader: {
    textAlign: 'left',
    marginBottom: '36px',
  },

  loginTitle: {
    fontSize: '22px',
    fontWeight: '600',
    marginBottom: '6px',
    color: '#242424',
  },

  loginSubtitle: {
    fontSize: '14px',
    color: '#616161',
    display: 'block',
    marginTop: '8px',
  },

  // Feature list
  featureList: {
    marginBottom: '28px',
  },

  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid #e5e5e5',
    ':last-child': {
      borderBottom: 'none',
    },
  },

  featureCheck: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: 'rgba(16, 124, 16, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '1px',
    color: '#107c10',
  },

  featureContent: {
    display: 'flex',
    flexDirection: 'column',
  },

  featureTitle: {
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '1px',
    color: '#242424',
  },

  featureDescription: {
    fontSize: '12px',
    color: '#616161',
  },

  // Login button
  loginBtn: {
    width: '100%',
    padding: '13px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#1e6b7b',
    borderRadius: '8px',
    ':hover': {
      backgroundColor: '#154f5c',
      boxShadow: '0 4px 12px rgba(30, 107, 123, 0.25)',
    },
  },

  // SSO note
  ssoNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '14px',
    fontSize: '12px',
    color: '#616161',
  },

  // Trust badges
  trustBadges: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '36px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e5e5',
  },

  trustBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    color: '#616161',
  },

  trustBadgeIcon: {
    color: '#1e6b7b',
  },

  // Error message
  errorMessage: {
    color: '#d13438',
    fontSize: '13px',
    textAlign: 'center',
    marginBottom: '16px',
    padding: '8px 12px',
    backgroundColor: 'rgba(209, 52, 56, 0.1)',
    borderRadius: '4px',
  },

  // Spinner
  spinnerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
});

// Logo SVG component
const LogoSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.9)" strokeWidth="3"/>
    <polyline
      points="15,50 28,50 38,25 50,75 62,32 72,50 85,50"
      stroke="white"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Illustration SVG component
const IllustrationSvg: React.FC = () => (
  <svg viewBox="0 0 260 120" xmlns="http://www.w3.org/2000/svg" style={{ width: '260px', height: 'auto' }}>
    {/* Calendar */}
    <rect x="0" y="8" width="90" height="75" rx="5" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)"/>
    <rect x="0" y="8" width="90" height="20" rx="5" fill="rgba(255,255,255,0.15)"/>
    <circle cx="16" cy="18" r="3.5" fill="rgba(255,255,255,0.5)"/>
    <circle cx="74" cy="18" r="3.5" fill="rgba(255,255,255,0.5)"/>
    <rect x="10" y="36" width="13" height="13" rx="2" fill="rgba(255,255,255,0.12)"/>
    <rect x="28" y="36" width="13" height="13" rx="2" fill="rgba(255,255,255,0.12)"/>
    <rect x="46" y="36" width="13" height="13" rx="2" fill="rgba(255,255,255,0.12)"/>
    <rect x="64" y="36" width="13" height="13" rx="2" fill="rgba(255,255,255,0.12)"/>
    <rect x="10" y="54" width="13" height="13" rx="2" fill="rgba(255,255,255,0.12)"/>
    <rect x="28" y="54" width="13" height="13" rx="2" fill="#e5a84b"/>
    <rect x="46" y="54" width="13" height="13" rx="2" fill="rgba(255,255,255,0.12)"/>
    <rect x="64" y="54" width="13" height="13" rx="2" fill="rgba(255,255,255,0.12)"/>

    {/* Arrows */}
    <path d="M90 45 Q112 45 130 32" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" strokeDasharray="4 3"/>
    <path d="M90 45 Q112 58 130 72" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" strokeDasharray="4 3"/>

    {/* Teams */}
    <rect x="130" y="14" width="36" height="36" rx="5" fill="rgba(255,255,255,0.12)"/>
    <text x="148" y="39" textAnchor="middle" fill="white" fontSize="16" fontWeight="600">T</text>

    {/* Check */}
    <circle cx="148" cy="82" r="16" fill="rgba(255,255,255,0.12)"/>
    <polyline points="139,82 145,88 158,75" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

    {/* Cards */}
    <rect x="195" y="22" width="50" height="24" rx="3" fill="rgba(255,255,255,0.1)"/>
    <circle cx="208" cy="34" r="6" fill="rgba(255,255,255,0.2)"/>
    <rect x="218" y="31" width="18" height="3" rx="1.5" fill="rgba(255,255,255,0.25)"/>
    <rect x="218" y="36" width="12" height="2" rx="1" fill="rgba(255,255,255,0.15)"/>

    <rect x="195" y="52" width="50" height="24" rx="3" fill="rgba(255,255,255,0.1)"/>
    <circle cx="208" cy="64" r="6" fill="rgba(255,255,255,0.2)"/>
    <rect x="218" y="61" width="18" height="3" rx="1.5" fill="rgba(255,255,255,0.25)"/>
    <rect x="218" y="66" width="12" height="2" rx="1" fill="rgba(255,255,255,0.15)"/>
  </svg>
);

// Microsoft icon
const MicrosoftIcon: React.FC = () => (
  <svg viewBox="0 0 21 21" style={{ width: '17px', height: '17px', fill: 'currentColor' }}>
    <path d="M0 0h10v10H0V0zm11 0h10v10H11V0zM0 11h10v10H0V11zm11 0h10v10H11V11z"/>
  </svg>
);

// Features data
const features = [
  {
    title: 'Instant calendar sync',
    description: 'Auto-checks availability for proposed slots',
  },
  {
    title: 'Teams notifications',
    description: 'Real-time alerts to your demo team',
  },
  {
    title: 'Auto confirmations',
    description: 'Instant email with calendar invite & docs',
  },
  {
    title: 'Booking dashboard',
    description: 'Track all your requests in one place',
  },
];

// Stats data
const stats = [
  { value: '42', label: 'Bookings' },
  { value: '98%', label: 'Success' },
  { value: '50+', label: 'Clients' },
  { value: '<2hr', label: 'Response' },
];

export const LoginPage: React.FC = () => {
  const styles = useStyles();
  const { login, isLoading, error } = useAuth();

  return (
    <div className={styles.root}>
      {/* Left Panel - Brand */}
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <div className={styles.logoRow}>
            <LogoSvg className={styles.logo} />
            <div className={styles.logoTextContainer}>
              <span className={styles.logoText}>License Pulse</span>
              <span className={styles.logoTagline}>Demo Scheduler</span>
            </div>
          </div>

          <h1 className={styles.heroTitle}>
            Schedule demos<br />
            <span className={styles.accent}>effortlessly</span> with Teams
          </h1>

          <p className={styles.heroDescription}>
            The intelligent booking platform that streamlines License Pulse demos and deployments.
            Auto-checks calendar availability, sends Teams notifications, and confirms bookings instantly.
          </p>

          <div className={styles.illustration}>
            <IllustrationSvg />
          </div>

          <div className={styles.statsRow}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statItem}>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div className={styles.testimonial}>
            <p className={styles.testimonialText}>
              "License Pulse Scheduler transformed how we manage demo requests. What used to take hours
              of back-and-forth now happens instantly with Teams."
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar}>SK</div>
              <div>
                <div className={styles.authorName}>Sindy Kotze</div>
                <div className={styles.authorRole}>Sales Executive - Africa And Middle East</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login */}
      <div className={styles.loginPanel}>
        <div className={styles.loginContainer}>
          <div className={styles.loginHeader}>
            <Text className={styles.loginTitle} as="h2">Welcome to Demo Scheduler</Text>
            <Text className={styles.loginSubtitle}>Sign in to manage your License Pulse bookings</Text>
          </div>

          <div className={styles.featureList}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureItem}>
                <div className={styles.featureCheck}>
                  <Checkmark24Regular style={{ width: '11px', height: '11px' }} />
                </div>
                <div className={styles.featureContent}>
                  <Text className={styles.featureTitle}>{feature.title}</Text>
                  <Text className={styles.featureDescription}>{feature.description}</Text>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <Button
            className={styles.loginBtn}
            appearance="primary"
            size="large"
            onClick={login}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.spinnerContainer}>
                <Spinner size="tiny" />
                Signing in...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MicrosoftIcon />
                Sign in with Microsoft
              </span>
            )}
          </Button>

          <div className={styles.ssoNote}>
            <ShieldCheckmark24Regular style={{ width: '13px', height: '13px' }} />
            Enterprise SSO with your organization credentials
          </div>

          <div className={styles.trustBadges}>
            <div className={styles.trustBadge}>
              <ShieldCheckmark24Regular className={styles.trustBadgeIcon} style={{ width: '14px', height: '14px' }} />
              Secure
            </div>
            <div className={styles.trustBadge}>
              <Checkmark24Regular className={styles.trustBadgeIcon} style={{ width: '14px', height: '14px' }} />
              GDPR
            </div>
            <div className={styles.trustBadge}>
              <ShieldCheckmark24Regular className={styles.trustBadgeIcon} style={{ width: '14px', height: '14px' }} />
              Support
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
