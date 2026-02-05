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

  // Left brand panel with corporate blue gradient
  brandPanel: {
    flex: 1,
    background: 'linear-gradient(160deg, #0f3d5c 0%, #1a5a8a 45%, #2873a8 100%)',
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
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: '8px',
  },

  logoText: {
    fontSize: '32px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    lineHeight: '1.1',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
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
    backgroundColor: '#1a5a8a',
    borderRadius: '8px',
    ':hover': {
      backgroundColor: '#0f3d5c',
      boxShadow: '0 4px 12px rgba(26, 90, 138, 0.25)',
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
    color: '#1a5a8a',
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

// Selected icon: Crossroads (3)
const SELECTED_ICON: number = 3;

// Option 1: Traffic Routing Arrows
const Icon1: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.9)" strokeWidth="3"/>
    <path d="M25 35 L45 50 L25 65" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M45 50 L75 50" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <path d="M60 35 L75 50 L60 65" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="50" cy="30" r="4" fill="rgba(255,255,255,0.6)"/>
    <circle cx="50" cy="70" r="4" fill="rgba(255,255,255,0.6)"/>
  </svg>
);

// Option 2: Traffic Light
const Icon2: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.9)" strokeWidth="3"/>
    <rect x="35" y="20" width="30" height="60" rx="5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
    <circle cx="50" cy="32" r="8" fill="#ef4444" opacity="0.9"/>
    <circle cx="50" cy="50" r="8" fill="#f59e0b" opacity="0.9"/>
    <circle cx="50" cy="68" r="8" fill="#22c55e" opacity="0.9"/>
  </svg>
);

// Option 3: Road Junction / Crossroads
const Icon3: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.9)" strokeWidth="3"/>
    {/* Vertical road */}
    <rect x="40" y="15" width="20" height="70" fill="rgba(255,255,255,0.2)" rx="2"/>
    {/* Horizontal road */}
    <rect x="15" y="40" width="70" height="20" fill="rgba(255,255,255,0.2)" rx="2"/>
    {/* Center intersection */}
    <rect x="40" y="40" width="20" height="20" fill="rgba(255,255,255,0.3)"/>
    {/* Direction arrows */}
    <path d="M50 25 L45 32 L55 32 Z" fill="white"/>
    <path d="M50 75 L45 68 L55 68 Z" fill="white"/>
    <path d="M25 50 L32 45 L32 55 Z" fill="white"/>
    <path d="M75 50 L68 45 L68 55 Z" fill="white"/>
  </svg>
);

// Option 4: Network Hub / Central Node
const Icon4: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.9)" strokeWidth="3"/>
    {/* Center hub */}
    <circle cx="50" cy="50" r="12" fill="white" opacity="0.9"/>
    {/* Connection lines */}
    <line x1="50" y1="38" x2="50" y2="22" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <line x1="50" y1="62" x2="50" y2="78" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <line x1="38" y1="50" x2="22" y2="50" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <line x1="62" y1="50" x2="78" y2="50" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <line x1="41" y1="41" x2="28" y2="28" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <line x1="59" y1="41" x2="72" y2="28" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <line x1="41" y1="59" x2="28" y2="72" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <line x1="59" y1="59" x2="72" y2="72" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    {/* Outer nodes */}
    <circle cx="50" cy="20" r="5" fill="rgba(255,255,255,0.7)"/>
    <circle cx="50" cy="80" r="5" fill="rgba(255,255,255,0.7)"/>
    <circle cx="20" cy="50" r="5" fill="rgba(255,255,255,0.7)"/>
    <circle cx="80" cy="50" r="5" fill="rgba(255,255,255,0.7)"/>
    <circle cx="26" cy="26" r="4" fill="rgba(255,255,255,0.5)"/>
    <circle cx="74" cy="26" r="4" fill="rgba(255,255,255,0.5)"/>
    <circle cx="26" cy="74" r="4" fill="rgba(255,255,255,0.5)"/>
    <circle cx="74" cy="74" r="4" fill="rgba(255,255,255,0.5)"/>
  </svg>
);

// Option 5: Flow/Pipeline Arrows
const Icon5: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.9)" strokeWidth="3"/>
    {/* Three converging flow lines */}
    <path d="M20 25 Q35 25 45 40 L55 40 Q65 40 75 50" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M20 50 L75 50" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <path d="M20 75 Q35 75 45 60 L55 60 Q65 60 75 50" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
    {/* Arrow head */}
    <path d="M70 42 L80 50 L70 58" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Input dots */}
    <circle cx="20" cy="25" r="5" fill="rgba(255,255,255,0.8)"/>
    <circle cx="20" cy="50" r="5" fill="rgba(255,255,255,0.8)"/>
    <circle cx="20" cy="75" r="5" fill="rgba(255,255,255,0.8)"/>
  </svg>
);

// Logo selector - uses SELECTED_ICON to pick which icon to display
const LogoSvg: React.FC<{ className?: string }> = ({ className }) => {
  switch (SELECTED_ICON) {
    case 1: return <Icon1 className={className} />;
    case 2: return <Icon2 className={className} />;
    case 3: return <Icon3 className={className} />;
    case 4: return <Icon4 className={className} />;
    case 5: return <Icon5 className={className} />;
    default: return <Icon1 className={className} />;
  }
};

// Icon Preview Gallery - Set to true to preview all icon options
const SHOW_ICON_PREVIEW = false;

const IconPreview: React.FC = () => (
  <div style={{
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    backgroundColor: '#1a5a8a',
    padding: '20px',
    borderRadius: '12px',
    zIndex: 9999,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  }}>
    <div style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
      Pick an icon (1-5):
    </div>
    <div style={{ display: 'flex', gap: '16px' }}>
      {[1, 2, 3, 4, 5].map((num) => (
        <div key={num} style={{ textAlign: 'center' }}>
          <div style={{
            width: '70px',
            height: '70px',
            border: SELECTED_ICON === num ? '3px solid #e5a84b' : '2px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            padding: '4px',
            backgroundColor: SELECTED_ICON === num ? 'rgba(255,255,255,0.1)' : 'transparent',
          }}>
            {num === 1 && <Icon1 className="" />}
            {num === 2 && <Icon2 className="" />}
            {num === 3 && <Icon3 className="" />}
            {num === 4 && <Icon4 className="" />}
            {num === 5 && <Icon5 className="" />}
          </div>
          <div style={{ color: 'white', fontSize: '11px', marginTop: '4px' }}>
            {num === 1 && 'Routing'}
            {num === 2 && 'Traffic Light'}
            {num === 3 && 'Crossroads'}
            {num === 4 && 'Network Hub'}
            {num === 5 && 'Flow/Pipeline'}
          </div>
        </div>
      ))}
    </div>
    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginTop: '12px' }}>
      Current: Icon {SELECTED_ICON} • Change SELECTED_ICON in LoginPage.tsx
    </div>
  </div>
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
              <span className={styles.logoText}>DWx Traffic Manager</span>
            </div>
          </div>

          <h1 className={styles.heroTitle}>
            Manage pre-sales<br />
            <span className={styles.accent}>effortlessly</span> with Teams
          </h1>

          <p className={styles.heroDescription}>
            The intelligent traffic management platform that streamlines DWx services and pre-sales activities.
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
              "DWx Traffic Manager transformed how we manage service requests. What used to take hours
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
            <Text className={styles.loginTitle} as="h2">Welcome to DWx Traffic Manager</Text>
            <Text className={styles.loginSubtitle}>Sign in to manage your service requests</Text>
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

      {/* Icon Preview - Shows all icon options */}
      {SHOW_ICON_PREVIEW && <IconPreview />}
    </div>
  );
};
