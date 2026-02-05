import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  Divider,
  Badge,
} from '@fluentui/react-components';
import {
  Dismiss16Regular,
  CalendarAdd24Regular,
  DocumentBulletList24Regular,
  Clock24Regular,
  ArrowRight24Regular,
  Send24Regular,
  Edit24Regular,
  History24Regular,
  Play24Regular,
  Rocket24Regular,
  Star24Filled,
  PersonSettingsRegular,
  CalendarCancel24Regular,
  Info24Regular,
  CalendarMonth24Regular,
  Timeline24Regular,
  CheckmarkCircle24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  surface: {
    maxWidth: '850px',
    maxHeight: '85vh',
    overflow: 'hidden',
  },
  dialogBody: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(85vh - 48px)',
    overflow: 'hidden',
  },
  dialogHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    paddingBottom: tokens.spacingVerticalM,
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  welcomeBadge: {
    alignSelf: 'flex-start',
    marginBottom: tokens.spacingVerticalXS,
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
    margin: 0,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    overflowY: 'auto',
    paddingRight: tokens.spacingHorizontalS,
    flex: 1,
    minHeight: 0,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  sectionIcon: {
    color: tokens.colorBrandForeground1,
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingHorizontalM,
  },
  featureCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    transition: 'all 0.2s ease',
  },
  featureHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  featureIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: '20px',
  },
  featureTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
  },
  featureDescription: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    lineHeight: '1.4',
  },
  stepsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
  },
  stepNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    flexShrink: 0,
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  stepTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
  },
  stepDescription: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  statusLegend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  statusPending: {
    backgroundColor: tokens.colorStatusWarningBackground3,
  },
  statusConfirmed: {
    backgroundColor: tokens.colorStatusSuccessBackground3,
  },
  statusCancelled: {
    backgroundColor: tokens.colorStatusDangerBackground3,
  },
  statusRescheduling: {
    backgroundColor: tokens.colorPaletteBlueBorderActive,
  },
  statusAwaiting: {
    backgroundColor: tokens.colorPaletteBlueBorderActive,
  },
  bookingTypeCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  bookingTypeIcon: {
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    flexShrink: 0,
  },
  demoIcon: {
    backgroundColor: 'rgba(0, 120, 212, 0.1)',
    color: '#0078d4',
  },
  deploymentIcon: {
    backgroundColor: 'rgba(16, 124, 16, 0.1)',
    color: '#107c10',
  },
  bookingTypeContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  bookingTypeTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
  },
  bookingTypeDescription: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    lineHeight: '1.4',
  },
  bookingTypeDuration: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
  },
  infoBox: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: '#e6f2fb',
    borderRadius: tokens.borderRadiusMedium,
    border: '1px solid #b3d7f2',
  },
  infoIcon: {
    color: '#0078d4',
    fontSize: '24px',
    flexShrink: 0,
  },
  infoContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  infoTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: '#0078d4',
  },
  infoText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
  },
  bulletList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.6',
  },
  tipBox: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorPaletteYellowBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorPaletteYellowBorder2}`,
  },
  tipIcon: {
    color: tokens.colorPaletteYellowForeground2,
    fontSize: '24px',
    flexShrink: 0,
  },
  tipContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  tipTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorPaletteYellowForeground2,
  },
  tipText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
  },
  warningBox: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: '#fef6f6',
    borderRadius: tokens.borderRadiusMedium,
    border: '1px solid #fad4d4',
  },
  warningIcon: {
    color: '#d13438',
    fontSize: '24px',
    flexShrink: 0,
  },
  warningContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  warningTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: '#d13438',
  },
  warningText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
  },
  viewOptionsBox: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  viewOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    flex: '1 1 150px',
    minWidth: '140px',
  },
  viewOptionIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: '32px',
  },
  viewOptionTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
  },
  viewOptionDescription: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    textAlign: 'center',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    marginTop: tokens.spacingVerticalM,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    cursor: 'pointer',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

const STORAGE_KEY = 'lp_user_guide_dismissed';

interface UserGuideProps {
  userName?: string;
}

export const UserGuide: React.FC<UserGuideProps> = ({ userName }) => {
  const styles = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the guide
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Show the guide after a short delay for better UX
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsOpen(false);
  };

  const handleGetStarted = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody className={styles.dialogBody}>
          <div className={styles.dialogHeader}>
            <div className={styles.headerContent}>
              <Badge appearance="filled" color="brand" className={styles.welcomeBadge}>
                Welcome
              </Badge>
              <DialogTitle className={styles.title}>
                {userName ? `Hello, ${userName.split(' ')[0]}!` : 'Welcome to DWx Traffic Manager'}
              </DialogTitle>
              <Text className={styles.subtitle}>
                Your guide to booking demos and deployments efficiently
              </Text>
            </div>
            <Button
              appearance="subtle"
              icon={<Dismiss16Regular />}
              onClick={handleClose}
            />
          </div>

          <DialogContent className={styles.content}>
            {/* Quick Start Section */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <ArrowRight24Regular className={styles.sectionIcon} />
                Quick Start Guide
              </div>
              <div className={styles.stepsList}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <Text className={styles.stepTitle}>Create a New Booking</Text>
                    <Text className={styles.stepDescription}>
                      Click "New Booking" from the navigation menu. Fill in the client details, select the booking type (Demo or Deployment), enter the license count, and propose up to 3 preferred time slots.
                    </Text>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <Text className={styles.stepTitle}>Submit for Approval</Text>
                    <Text className={styles.stepDescription}>
                      Review your booking details in the preview panel, then click "Submit Booking". A manager will review your request and confirm one of your proposed time slots. You'll receive an email notification once approved.
                    </Text>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <Text className={styles.stepTitle}>Track Your Bookings</Text>
                    <Text className={styles.stepDescription}>
                      View all your bookings in "My Bookings". Use the filters to find specific bookings by status, date range, or booking type. Click any booking to view full details, reschedule, or cancel if needed.
                    </Text>
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            {/* Booking Types Section */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <CalendarAdd24Regular className={styles.sectionIcon} />
                Booking Types
              </div>
              <div className={styles.bookingTypeCard}>
                <div className={`${styles.bookingTypeIcon} ${styles.demoIcon}`}>
                  <Play24Regular style={{ fontSize: '24px' }} />
                </div>
                <div className={styles.bookingTypeContent}>
                  <Text className={styles.bookingTypeTitle}>Demo</Text>
                  <Text className={styles.bookingTypeDescription}>
                    Product demonstrations for prospective clients. Showcases DWx service features, capabilities, and value proposition. Ideal for initial client engagement and sales presentations.
                  </Text>
                  <span className={styles.bookingTypeDuration}>
                    <Clock24Regular style={{ fontSize: '12px' }} />
                    Duration: 1 hour
                  </span>
                </div>
              </div>
              <div className={styles.bookingTypeCard}>
                <div className={`${styles.bookingTypeIcon} ${styles.deploymentIcon}`}>
                  <Rocket24Regular style={{ fontSize: '24px' }} />
                </div>
                <div className={styles.bookingTypeContent}>
                  <Text className={styles.bookingTypeTitle}>Deployment</Text>
                  <Text className={styles.bookingTypeDescription}>
                    Full system setup and configuration for clients who have signed up. Includes installation, initial configuration, user training, and handover documentation.
                  </Text>
                  <span className={styles.bookingTypeDuration}>
                    <Clock24Regular style={{ fontSize: '12px' }} />
                    Duration: 2 hours
                  </span>
                </div>
              </div>
            </div>

            <Divider />

            {/* Features Section */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <DocumentBulletList24Regular className={styles.sectionIcon} />
                Key Features
              </div>
              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureHeader}>
                    <Send24Regular className={styles.featureIcon} />
                    <Text className={styles.featureTitle}>New Booking</Text>
                  </div>
                  <Text className={styles.featureDescription}>
                    Create demo or deployment requests with client info, license count, and up to 3 preferred time slots.
                  </Text>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureHeader}>
                    <DocumentBulletList24Regular className={styles.featureIcon} />
                    <Text className={styles.featureTitle}>My Bookings</Text>
                  </div>
                  <Text className={styles.featureDescription}>
                    View, filter, and manage all your booking requests. See assigned specialists and booking status.
                  </Text>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureHeader}>
                    <Edit24Regular className={styles.featureIcon} />
                    <Text className={styles.featureTitle}>Reschedule</Text>
                  </div>
                  <Text className={styles.featureDescription}>
                    Need to change the time? Request a reschedule with new proposed time slots for manager approval.
                  </Text>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureHeader}>
                    <CalendarCancel24Regular className={styles.featureIcon} />
                    <Text className={styles.featureTitle}>Cancel Booking</Text>
                  </div>
                  <Text className={styles.featureDescription}>
                    Cancel bookings when needed. Provide a reason and all parties will be notified automatically.
                  </Text>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureHeader}>
                    <History24Regular className={styles.featureIcon} />
                    <Text className={styles.featureTitle}>Client History</Text>
                  </div>
                  <Text className={styles.featureDescription}>
                    View a client's past bookings and interactions to provide better, more informed service.
                  </Text>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureHeader}>
                    <PersonSettingsRegular className={styles.featureIcon} />
                    <Text className={styles.featureTitle}>Specialist Assignment</Text>
                  </div>
                  <Text className={styles.featureDescription}>
                    See which specialist is assigned to your confirmed bookings for demos and deployments.
                  </Text>
                </div>
              </div>
            </div>

            <Divider />

            {/* Status Legend */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <Clock24Regular className={styles.sectionIcon} />
                Booking Status Guide
              </div>
              <div className={styles.statusLegend}>
                <div className={styles.statusItem}>
                  <div className={`${styles.statusDot} ${styles.statusPending}`} />
                  <Text size={200}><strong>Pending Review</strong> - Awaiting manager approval</Text>
                </div>
                <div className={styles.statusItem}>
                  <div className={`${styles.statusDot} ${styles.statusAwaiting}`} />
                  <Text size={200}><strong>Awaiting Approval</strong> - Under manager review</Text>
                </div>
                <div className={styles.statusItem}>
                  <div className={`${styles.statusDot} ${styles.statusConfirmed}`} />
                  <Text size={200}><strong>Confirmed</strong> - Booking approved & scheduled</Text>
                </div>
                <div className={styles.statusItem}>
                  <div className={`${styles.statusDot} ${styles.statusRescheduling}`} />
                  <Text size={200}><strong>Rescheduling Required</strong> - New time slots needed</Text>
                </div>
                <div className={styles.statusItem}>
                  <div className={`${styles.statusDot} ${styles.statusCancelled}`} />
                  <Text size={200}><strong>Cancelled</strong> - Booking was cancelled</Text>
                </div>
              </div>
            </div>

            <Divider />

            {/* Time Slot Tips */}
            <div className={styles.infoBox}>
              <Info24Regular className={styles.infoIcon} />
              <div className={styles.infoContent}>
                <Text className={styles.infoTitle}>Time Slot Tips</Text>
                <ul className={styles.bulletList}>
                  <li>Propose 3 different time slots to increase approval chances</li>
                  <li><strong>To set the time:</strong> Click the clock button next to each date picker - it shows the current time (e.g., "09:00") and opens a time picker when clicked</li>
                  <li>Avoid scheduling during lunch hours (12:00-13:00)</li>
                  <li>Allow at least 24 hours notice for new bookings</li>
                  <li>Consider the client's timezone when proposing times</li>
                </ul>
              </div>
            </div>

            {/* Premium Client Tip */}
            <div className={styles.tipBox}>
              <Star24Filled className={styles.tipIcon} style={{ color: '#e5a84b' }} />
              <div className={styles.tipContent}>
                <Text className={styles.tipTitle}>Premium Clients</Text>
                <Text className={styles.tipText}>
                  Mark clients as "Premium" when creating bookings to ensure they receive priority scheduling and attention from our team. Premium clients are highlighted throughout the system for easy identification.
                </Text>
              </div>
            </div>

            <Divider />

            {/* Cancellations Section */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <CalendarCancel24Regular className={styles.sectionIcon} />
                Cancelling Bookings
              </div>
              <div className={styles.stepsList}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <Text className={styles.stepTitle}>Open Booking Details</Text>
                    <Text className={styles.stepDescription}>
                      Navigate to "My Bookings" and click on the booking you want to cancel to open the details panel.
                    </Text>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <Text className={styles.stepTitle}>Click "Cancel Booking"</Text>
                    <Text className={styles.stepDescription}>
                      In the booking details panel, click the red "Cancel Booking" button in the header area. This option is only available for bookings that aren't already cancelled.
                    </Text>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <Text className={styles.stepTitle}>Provide a Reason</Text>
                    <Text className={styles.stepDescription}>
                      Enter a cancellation reason (required). This helps managers track why bookings are cancelled and improve scheduling in the future.
                    </Text>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepContent}>
                    <Text className={styles.stepTitle}>Confirm Cancellation</Text>
                    <Text className={styles.stepDescription}>
                      Click "Confirm Cancellation" to complete the process. All relevant parties will be notified automatically via email.
                    </Text>
                  </div>
                </div>
              </div>
              <div className={styles.warningBox}>
                <Warning24Regular className={styles.warningIcon} />
                <div className={styles.warningContent}>
                  <Text className={styles.warningTitle}>Cancelling Confirmed Bookings</Text>
                  <Text className={styles.warningText}>
                    When you cancel a confirmed booking, the calendar event will be automatically removed from the shared calendar, and all attendees (client, specialist, and yourself) will receive cancellation notifications.
                  </Text>
                </div>
              </div>
            </div>

            <Divider />

            {/* Rescheduling Section */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <Edit24Regular className={styles.sectionIcon} />
                Rescheduling Bookings
              </div>
              <div className={styles.stepsList}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <Text className={styles.stepTitle}>Open Booking Details</Text>
                    <Text className={styles.stepDescription}>
                      Navigate to "My Bookings" and click on the booking you want to reschedule.
                    </Text>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <Text className={styles.stepTitle}>Click "Reschedule"</Text>
                    <Text className={styles.stepDescription}>
                      In the booking details footer, click the "Reschedule" button. This opens the reschedule dialog.
                    </Text>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <Text className={styles.stepTitle}>Propose New Time Slots</Text>
                    <Text className={styles.stepDescription}>
                      Select up to 3 new preferred time slots using the date/time pickers. Providing multiple options increases the chance of quick approval.
                    </Text>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepContent}>
                    <Text className={styles.stepTitle}>Submit for Approval</Text>
                    <Text className={styles.stepDescription}>
                      Click "Submit Reschedule Request". The booking status changes to "Rescheduling Required" and goes back to managers for review and approval.
                    </Text>
                  </div>
                </div>
              </div>
              <div className={styles.infoBox}>
                <Info24Regular className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <Text className={styles.infoTitle}>What Happens Next?</Text>
                  <Text className={styles.infoText}>
                    Once a manager approves one of your proposed time slots, the booking status changes back to "Confirmed", the calendar event is updated, and all parties are notified of the new time.
                  </Text>
                </div>
              </div>
            </div>

            <Divider />

            {/* Checklists Section */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <CheckmarkCircle24Regular className={styles.sectionIcon} />
                Demo & Deployment Checklists
              </div>
              <Text className={styles.featureDescription} style={{ marginBottom: '12px' }}>
                The Checklists feature helps you prepare for demos and deployments by providing standardized preparation tasks. Access checklists from the navigation menu.
              </Text>
              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureHeader}>
                    <Play24Regular className={styles.featureIcon} style={{ color: '#0078d4' }} />
                    <Text className={styles.featureTitle}>Demo Checklist</Text>
                  </div>
                  <Text className={styles.featureDescription}>
                    Pre-demo tasks including environment setup, client research, presentation materials, and technical verification.
                  </Text>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureHeader}>
                    <Rocket24Regular className={styles.featureIcon} style={{ color: '#107c10' }} />
                    <Text className={styles.featureTitle}>Deployment Checklist</Text>
                  </div>
                  <Text className={styles.featureDescription}>
                    Deployment preparation including system requirements, client credentials, configuration settings, and training materials.
                  </Text>
                </div>
              </div>
              <div className={styles.tipBox}>
                <Star24Filled className={styles.tipIcon} style={{ color: '#e5a84b' }} />
                <div className={styles.tipContent}>
                  <Text className={styles.tipTitle}>Checklist Best Practices</Text>
                  <ul className={styles.bulletList}>
                    <li>Complete all checklist items before the scheduled booking time</li>
                    <li>Use the notes field to document any special requirements</li>
                    <li>Checklist progress is saved automatically</li>
                    <li>Review checklists with your team for complex deployments</li>
                  </ul>
                </div>
              </div>
            </div>

            <Divider />

            {/* Calendar & Timeline Views Section */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <CalendarMonth24Regular className={styles.sectionIcon} />
                Calendar & Timeline Views
              </div>
              <Text className={styles.featureDescription} style={{ marginBottom: '12px' }}>
                In "My Bookings", you can switch between different views to visualize your bookings. Use the view toggle buttons above your booking list.
              </Text>
              <div className={styles.viewOptionsBox}>
                <div className={styles.viewOption}>
                  <DocumentBulletList24Regular className={styles.viewOptionIcon} />
                  <Text className={styles.viewOptionTitle}>Cards</Text>
                  <Text className={styles.viewOptionDescription}>
                    Visual cards with booking details and status badges
                  </Text>
                </div>
                <div className={styles.viewOption}>
                  <DocumentBulletList24Regular className={styles.viewOptionIcon} />
                  <Text className={styles.viewOptionTitle}>List</Text>
                  <Text className={styles.viewOptionDescription}>
                    Compact table view for quick scanning
                  </Text>
                </div>
                <div className={styles.viewOption}>
                  <CalendarMonth24Regular className={styles.viewOptionIcon} />
                  <Text className={styles.viewOptionTitle}>Calendar</Text>
                  <Text className={styles.viewOptionDescription}>
                    Monthly/weekly calendar with color-coded events
                  </Text>
                </div>
                <div className={styles.viewOption}>
                  <Timeline24Regular className={styles.viewOptionIcon} />
                  <Text className={styles.viewOptionTitle}>Timeline</Text>
                  <Text className={styles.viewOptionDescription}>
                    Chronological timeline grouped by date
                  </Text>
                </div>
              </div>
              <div className={styles.infoBox}>
                <Info24Regular className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <Text className={styles.infoTitle}>Calendar Features</Text>
                  <ul className={styles.bulletList}>
                    <li>Switch between Month, Week, Day, and Agenda views</li>
                    <li>Click any event to open booking details</li>
                    <li>Events are color-coded by status (green=confirmed, orange=pending, etc.)</li>
                    <li>Premium clients show a gold border indicator</li>
                    <li>Use the legend to understand status colors</li>
                  </ul>
                </div>
              </div>
            </div>
          </DialogContent>

          <div className={styles.footer}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              Don't show this again
            </label>
            <Button appearance="primary" onClick={handleGetStarted}>
              Get Started
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

// Export a function to manually show the guide
export const showUserGuide = () => {
  localStorage.removeItem(STORAGE_KEY);
  // Trigger re-render by dispatching a custom event
  window.dispatchEvent(new CustomEvent('show-user-guide'));
};
