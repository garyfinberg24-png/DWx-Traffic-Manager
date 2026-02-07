/**
 * DWx Traffic Manager - Landing Page (V4 Magazine / Editorial Layout)
 * Masthead with stats + slogan rotator, 3-column content grid,
 * team panel with photos, and full-width footer.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  shorthands,
  mergeClasses,
} from '@fluentui/react-components';
import {
  Wrench24Regular,
  Apps24Regular,
  ClipboardTask24Regular,
  ArrowRight24Regular,
} from '@fluentui/react-icons';
import { DEFAULT_LANDING_PAGE_CONTENT, LandingPageContent, LandingPageTeamMember } from '../../types/LandingPageContent';
import { landingPageContentService } from '../../services/LandingPageContentService';
import { DW_COLORS } from '../../utils/buttonStyles';

// ─── Data ──────────────────────────────────────────────────────────────────────

const ACTION_CARDS = [
  {
    title: 'Browse Service Catalog',
    meta: '12 categories \u2022 Pre-sales & consulting',
    description: 'Power Platform, SPFx, Copilot, Migrations, Tenders, Strategic Advisory and more. Start a pre-sales consultation or submit a service request.',
    route: '/services',
    accentGradient: 'linear-gradient(180deg, #1a5a8a, #2980b9)',
    iconGradient: 'linear-gradient(135deg, #1a5a8a, #2980b9)',
    Icon: Wrench24Regular,
  },
  {
    title: 'Explore Product Portfolio',
    meta: '29 products \u2022 Apps, web parts & cards',
    description: '15 business applications, 8 SharePoint web parts, and 6 Teams adaptive cards \u2014 all built on Microsoft 365 and ready to deploy.',
    route: '/products',
    accentGradient: 'linear-gradient(180deg, #0d3a5c, #1a5a8a)',
    iconGradient: 'linear-gradient(135deg, #0d3a5c, #1a5a8a)',
    Icon: Apps24Regular,
  },
  {
    title: 'Submit a New Request',
    meta: '5-step wizard \u2022 All request types',
    description: 'Start a service request, tender response, proposal, or book an ad-hoc support session with our team.',
    route: '/request',
    accentGradient: 'linear-gradient(180deg, #107c10, #16a34a)',
    iconGradient: 'linear-gradient(135deg, #107c10, #16a34a)',
    Icon: ClipboardTask24Regular,
  },
];

// ─── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  // Masthead
  masthead: {
    backgroundImage: 'linear-gradient(135deg, #0d3a5c 0%, #1a5a8a 100%)',
    color: 'white',
    ...shorthands.padding('40px', '64px', '48px'),
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '48px',
    alignItems: 'center',
  },
  mastheadTitle: {
    fontSize: '38px',
    fontWeight: '700',
    lineHeight: '1.15',
    marginBottom: '16px',
  },
  mastheadAccent: {
    color: '#5bb8f5',
  },
  mastheadLead: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: '1.7',
  },
  mastheadRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    justifyContent: 'center',
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
  },
  statCard: {
    ...shorthands.flex(1),
    backgroundColor: 'rgba(255,255,255,0.08)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.12)'),
    ...shorthands.borderRadius('12px'),
    ...shorthands.padding('20px'),
    textAlign: 'center',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  // Slogan rotator
  sloganRotator: {
    position: 'relative',
    height: '42px',
    ...shorthands.overflow('hidden'),
  },
  slogan: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: '600',
    color: '#5bb8f5',
    letterSpacing: '0.3px',
    lineHeight: '42px',
    opacity: 0,
    transform: 'translateY(14px)',
    transitionProperty: 'opacity, transform',
    transitionDuration: '0.6s',
    transitionTimingFunction: 'ease',
  },
  sloganActive: {
    opacity: 1,
    transform: 'translateY(0)',
  },

  // Content area
  content: {
    ...shorthands.padding('48px', '64px'),
    maxWidth: '1400px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '5fr 2fr 2fr',
    gap: '28px',
    alignItems: 'stretch',
  },
  mainCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  // Action cards
  actionCard: {
    backgroundColor: 'white',
    ...shorthands.borderRadius('16px'),
    ...shorthands.padding('0px'),
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    ...shorthands.border('1px', 'solid', '#e8e8e8'),
    cursor: 'pointer',
    transitionProperty: 'box-shadow, border-color, transform',
    transitionDuration: '0.3s',
    transitionTimingFunction: 'ease',
    ...shorthands.overflow('hidden'),
    display: 'flex',
    flexDirection: 'row',
    ':hover': {
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      ...shorthands.borderColor('#1a5a8a'),
      transform: 'translateY(-2px)',
    },
  },
  actionCardLast: {
    ...shorthands.flex(1),
  },
  cardAccent: {
    width: '6px',
    flexShrink: 0,
  },
  cardInner: {
    display: 'flex',
    gap: '20px',
    ...shorthands.padding('24px', '28px'),
    alignItems: 'center',
    ...shorthands.flex(1),
  },
  cardIcon: {
    width: '56px',
    height: '56px',
    ...shorthands.borderRadius('14px'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    flexShrink: 0,
    color: 'white',
  },
  cardText: {
    ...shorthands.flex(1),
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '4px',
  },
  cardMeta: {
    fontSize: '12px',
    color: '#1a5a8a',
    fontWeight: '500',
    marginBottom: '6px',
  },
  cardDesc: {
    fontSize: '13px',
    color: '#616161',
    lineHeight: '1.5',
  },
  cardArrow: {
    width: '36px',
    height: '36px',
    ...shorthands.borderRadius('50%'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...shorthands.border('1px', 'solid', '#e0e0e0'),
    color: '#616161',
    backgroundColor: '#fafafa',
    transitionProperty: 'background-color, color, border-color, transform',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
  },

  // What We Do sidebar
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sidebarSection: {
    backgroundColor: 'white',
    ...shorthands.borderRadius('16px'),
    ...shorthands.padding('24px'),
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    ...shorthands.border('1px', 'solid', '#e8e8e8'),
    ...shorthands.flex(1),
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '16px',
    paddingBottom: '12px',
    ...shorthands.borderBottom('2px', 'solid', '#1a5a8a'),
  },
  checklistContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    fontSize: '13px',
    color: '#424242',
    ...shorthands.flex(1),
    justifyContent: 'center',
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  checkMark: {
    color: '#1a5a8a',
    fontWeight: '700',
    flexShrink: 0,
  },

  // Testimonial
  testimonialCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  testimonial: {
    backgroundImage: 'linear-gradient(160deg, #f8fbff 0%, #edf4fb 100%)',
    ...shorthands.borderRadius('16px'),
    ...shorthands.padding('28px', '24px'),
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    ...shorthands.border('1px', 'solid', '#d0e4f0'),
    position: 'relative',
    ...shorthands.flex(1),
    display: 'flex',
    flexDirection: 'column',
  },
  testimonialQuoteMark: {
    position: 'absolute',
    top: '12px',
    left: '18px',
    fontSize: '64px',
    color: '#1a5a8a',
    opacity: 0.15,
    lineHeight: '1',
    fontFamily: 'Georgia, serif',
  },
  testimonialStars: {
    display: 'flex',
    gap: '2px',
    marginBottom: '12px',
  },
  star: {
    color: '#f59e0b',
    fontSize: '14px',
  },
  testimonialQuote: {
    fontSize: '14px',
    color: '#424242',
    lineHeight: '1.7',
    fontStyle: 'italic',
    marginBottom: '20px',
    position: 'relative',
    zIndex: 1,
    ...shorthands.flex(1),
  },
  testimonialAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingTop: '16px',
    ...shorthands.borderTop('1px', 'solid', '#d0e4f0'),
  },
  testimonialAvatar: {
    width: '44px',
    height: '44px',
    ...shorthands.borderRadius('50%'),
    objectFit: 'cover',
    flexShrink: 0,
    ...shorthands.border('2px', 'solid', '#d0e4f0'),
  },
  tName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#242424',
  },
  tRole: {
    fontSize: '11px',
    color: '#1a5a8a',
  },
  tCompany: {
    fontSize: '11px',
    color: '#616161',
  },

  // Team panel
  teamPanel: {
    backgroundColor: 'white',
    ...shorthands.borderRadius('16px'),
    ...shorthands.padding('36px', '40px'),
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    ...shorthands.border('1px', 'solid', '#e8e8e8'),
    marginTop: '28px',
  },
  teamHeader: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  teamTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#242424',
    marginBottom: '8px',
  },
  teamSubtitle: {
    fontSize: '14px',
    color: '#616161',
    lineHeight: '1.6',
    maxWidth: '640px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  teamRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '48px',
    flexWrap: 'wrap',
  },
  teamCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    textAlign: 'center',
    minWidth: '120px',
    cursor: 'pointer',
    ...shorthands.borderRadius('12px'),
    ...shorthands.padding('12px'),
    transitionProperty: 'transform, background-color',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
    ':hover': {
      transform: 'translateY(-4px)',
      backgroundColor: '#f8fbff',
    },
  },
  teamAvatar: {
    width: '64px',
    height: '64px',
    ...shorthands.borderRadius('50%'),
    objectFit: 'cover',
    ...shorthands.border('3px', 'solid', 'white'),
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  teamName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#242424',
  },
  teamRole: {
    fontSize: '11px',
    color: '#1a5a8a',
    fontWeight: '500',
  },
  teamSpec: {
    fontSize: '11px',
    color: '#616161',
  },

  // Footer
  footer: {
    backgroundColor: '#0d2137',
    color: 'white',
    ...shorthands.padding('40px', '64px'),
  },
  footerGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '40px',
    maxWidth: '1400px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  footerBrandTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  footerBrandText: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: '1.6',
  },
  footerColTitle: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '14px',
  },
  footerLink: {
    display: 'block',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    ...shorthands.padding('4px', '0'),
    cursor: 'pointer',
    transitionProperty: 'color',
    transitionDuration: '0.2s',
    ':hover': {
      color: '#5bb8f5',
    },
  },
  footerBottom: {
    ...shorthands.borderTop('1px', 'solid', 'rgba(255,255,255,0.08)'),
    marginTop: '32px',
    paddingTop: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1400px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  footerCopy: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.35)',
  },
  footerPrivacy: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.35)',
    textDecoration: 'none',
    cursor: 'pointer',
    ':hover': {
      color: '#5bb8f5',
    },
  },

  // Profile modal
  profileBackdrop: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(4px)',
    animationName: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    animationDuration: '0.2s',
    animationTimingFunction: 'ease',
  },
  profileModal: {
    backgroundColor: 'white',
    ...shorthands.borderRadius('20px'),
    width: '680px',
    maxHeight: '90vh',
    ...shorthands.overflow('hidden'),
    boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    animationName: {
      from: { opacity: 0, transform: 'translateY(24px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    animationDuration: '0.3s',
    animationTimingFunction: 'ease',
  },
  pmLeft: {
    backgroundImage: 'linear-gradient(180deg, #0d3a5c, #1a5a8a)',
    ...shorthands.padding('32px', '24px'),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  pmAvatar: {
    width: '120px',
    height: '120px',
    ...shorthands.borderRadius('50%'),
    ...shorthands.border('4px', 'solid', 'rgba(255,255,255,0.3)'),
    objectFit: 'cover',
    marginBottom: '16px',
  },
  pmName: {
    color: 'white',
    fontSize: '20px',
    fontWeight: '700',
  },
  pmRole: {
    color: '#5bb8f5',
    fontSize: '13px',
    fontWeight: '500',
    marginTop: '4px',
  },
  pmSpec: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '11px',
    marginTop: '6px',
    lineHeight: '1.5',
  },
  pmDivider: {
    width: '40px',
    height: '2px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    ...shorthands.margin('20px', 'auto'),
    ...shorthands.borderRadius('1px'),
  },
  pmStat: {
    textAlign: 'center',
    marginBottom: '12px',
  },
  pmStatVal: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'white',
  },
  pmStatLbl: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  pmRight: {
    ...shorthands.padding('28px', '28px', '28px', '24px'),
    position: 'relative',
    overflowY: 'auto',
    maxHeight: '90vh',
  },
  pmClose: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '32px',
    height: '32px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: '#f5f5f5',
    ...shorthands.border('none'),
    color: '#616161',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transitionProperty: 'background-color',
    transitionDuration: '0.2s',
    ':hover': {
      backgroundColor: '#e0e0e0',
    },
  },
  pmQuote: {
    fontSize: '15px',
    color: '#424242',
    lineHeight: '1.7',
    fontStyle: 'italic',
    marginBottom: '20px',
    paddingBottom: '20px',
    ...shorthands.borderBottom('1px', 'solid', '#e8e8e8'),
  },
  pmHighlight: {
    color: '#1a5a8a',
    fontWeight: '600',
  },
  pmSection: {
    marginBottom: '20px',
  },
  pmSectionTitle: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: '#999',
    marginBottom: '10px',
  },
  pmSectionText: {
    fontSize: '13px',
    color: '#616161',
    lineHeight: '1.6',
  },
  pmHobbies: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  pmHobby: {
    backgroundColor: '#f5f5f5',
    color: '#424242',
    fontSize: '12px',
    ...shorthands.padding('5px', '12px'),
    ...shorthands.borderRadius('14px'),
  },
  pmLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0px',
  },
  pmLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#1a5a8a',
    textDecoration: 'none',
    ...shorthands.padding('6px', '0'),
    cursor: 'default',
    ':hover': {
      textDecoration: 'underline',
    },
  },
  pmLinkDot: {
    width: '4px',
    height: '4px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: DW_COLORS.primary,
    flexShrink: 0,
  },
});

// ─── Team Profile Modal ────────────────────────────────────────────────────────

/** Render quote text with highlighted words wrapped in a span */
function renderQuote(quote: string, highlightWords: string[], highlightClass: string) {
  if (!highlightWords.length) return <>&ldquo;{quote}&rdquo;</>;
  const pattern = new RegExp(`\\b(${highlightWords.join('|')})\\b`, 'gi');
  const parts = quote.split(pattern);
  return (
    <>
      &ldquo;
      {parts.map((part, i) =>
        highlightWords.some(w => w.toLowerCase() === part.toLowerCase())
          ? <span key={i} className={highlightClass}>{part}</span>
          : part
      )}
      &rdquo;
    </>
  );
}

interface TeamProfileModalProps {
  member: LandingPageTeamMember;
  onClose: () => void;
  styles: ReturnType<typeof useStyles>;
}

const TeamProfileModal: React.FC<TeamProfileModalProps> = ({ member, onClose, styles }) => {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className={styles.profileBackdrop}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.profileModal}>
        <div className={styles.pmLeft}>
          <img className={styles.pmAvatar} src={`https://i.pravatar.cc/240?img=${member.img}`} alt={member.name} />
          <div className={styles.pmName}>{member.name}</div>
          <div className={styles.pmRole}>{member.role}</div>
          <div className={styles.pmSpec}>{member.specFull}</div>
          <div className={styles.pmDivider} />
          <div className={styles.pmStat}>
            <div className={styles.pmStatVal}>{member.engagements}</div>
            <div className={styles.pmStatLbl}>Engagements</div>
          </div>
          <div className={styles.pmStat}>
            <div className={styles.pmStatVal}>{member.years}</div>
            <div className={styles.pmStatLbl}>Years Experience</div>
          </div>
        </div>
        <div className={styles.pmRight}>
          <button className={styles.pmClose} onClick={onClose}>&times;</button>
          <div className={styles.pmQuote}>
            {renderQuote(member.quote, member.highlightWords, styles.pmHighlight)}
          </div>
          <div className={styles.pmSection}>
            <div className={styles.pmSectionTitle}>What Inspires Me</div>
            <div className={styles.pmSectionText}>{member.inspiration}</div>
          </div>
          <div className={styles.pmSection}>
            <div className={styles.pmSectionTitle}>When I&rsquo;m Not Working</div>
            <div className={styles.pmHobbies}>
              {member.hobbies.map(h => (
                <span key={h.label} className={styles.pmHobby}>{h.emoji} {h.label}</span>
              ))}
            </div>
          </div>
          <div className={styles.pmSection}>
            <div className={styles.pmSectionTitle}>Favourite Websites</div>
            <div className={styles.pmLinks}>
              {member.websites.map(w => (
                <span key={w} className={styles.pmLink}>
                  <span className={styles.pmLinkDot} />
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Component ─────────────────────────────────────────────────────────────────

export const LandingPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const [activeSlogan, setActiveSlogan] = useState(0);
  const [selectedMember, setSelectedMember] = useState<LandingPageTeamMember | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [content, setContent] = useState<LandingPageContent>(DEFAULT_LANDING_PAGE_CONTENT);

  // Load content from SharePoint (silently falls back to defaults)
  useEffect(() => {
    landingPageContentService.getAllContent().then(setContent).catch(() => {/* defaults already set */});
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveSlogan(prev => (prev + 1) % content.slogans.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [content.slogans.length]);

  return (
    <div>
      {/* ── Masthead ── */}
      <div className={styles.masthead}>
        <div>
          <div className={styles.mastheadTitle}>
            {content.mastheadText.title}<br />
            Workplace <span className={styles.mastheadAccent}>{content.mastheadText.titleAccent}</span>
          </div>
          <div className={styles.mastheadLead}>
            {content.mastheadText.lead}
          </div>
        </div>
        <div className={styles.mastheadRight}>
          <div className={styles.statsRow}>
            {content.stats.map(s => (
              <div key={s.label} className={styles.statCard}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className={styles.sloganRotator}>
            {content.slogans.map((text, i) => (
              <div
                key={i}
                className={mergeClasses(
                  styles.slogan,
                  i === activeSlogan && styles.sloganActive
                )}
              >
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className={styles.content}>
        <div className={styles.grid}>
          {/* Left — action cards */}
          <div className={styles.mainCol}>
            {ACTION_CARDS.map((card, idx) => (
              <div
                key={card.route}
                className={mergeClasses(
                  styles.actionCard,
                  idx === ACTION_CARDS.length - 1 && styles.actionCardLast
                )}
                onClick={() => navigate(card.route)}
              >
                <div className={styles.cardAccent} style={{ background: card.accentGradient }} />
                <div className={styles.cardInner}>
                  <div className={styles.cardIcon} style={{ background: card.iconGradient }}>
                    <card.Icon />
                  </div>
                  <div className={styles.cardText}>
                    <div className={styles.cardTitle}>{card.title}</div>
                    <div className={styles.cardMeta}>{card.meta}</div>
                    <div className={styles.cardDesc}>{card.description}</div>
                  </div>
                  <div className={styles.cardArrow}>
                    <ArrowRight24Regular style={{ width: 16, height: 16 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Center — What We Do */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarTitle}>What We Do</div>
              <div className={styles.checklistContainer}>
                {content.whatWeDo.map(item => (
                  <div key={item} className={styles.checkItem}>
                    <span className={styles.checkMark}>&#10003;</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Testimonial */}
          <div className={styles.testimonialCol}>
            <div className={styles.testimonial}>
              <span className={styles.testimonialQuoteMark}>&ldquo;</span>
              <div className={styles.testimonialStars}>
                {Array.from({ length: content.testimonial.rating }, (_, i) => (
                  <span key={i} className={styles.star}>&#9733;</span>
                ))}
              </div>
              <div className={styles.testimonialQuote}>
                &ldquo;{content.testimonial.quote}&rdquo;
              </div>
              <div className={styles.testimonialAuthor}>
                <img
                  className={styles.testimonialAvatar}
                  src={content.testimonial.avatarUrl}
                  alt={content.testimonial.name}
                />
                <div>
                  <div className={styles.tName}>{content.testimonial.name}</div>
                  <div className={styles.tRole}>{content.testimonial.role}</div>
                  <div className={styles.tCompany}>{content.testimonial.company}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team panel */}
        <div className={styles.teamPanel}>
          <div className={styles.teamHeader}>
            <div className={styles.teamTitle}>
              {content.teamPanelText.title} <span className={styles.mastheadAccent}>{content.teamPanelText.titleAccent}</span> Team
            </div>
            <div className={styles.teamSubtitle}>
              {content.teamPanelText.subtitle}
            </div>
          </div>
          <div className={styles.teamRow}>
            {content.teamMembers.map(member => (
              <div key={member.name} className={styles.teamCard} onClick={() => setSelectedMember(member)}>
                <img
                  className={styles.teamAvatar}
                  src={`https://i.pravatar.cc/128?img=${member.img}`}
                  alt={member.name}
                />
                <div className={styles.teamName}>{member.name}</div>
                <div className={styles.teamRole}>{member.role}</div>
                <div className={styles.teamSpec}>{member.spec}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className={styles.footer}>
        <div className={styles.footerGrid}>
          <div>
            <div className={styles.footerBrandTitle}>
              {content.footerText.brandTitle} <span className={styles.mastheadAccent}>{content.footerText.brandTitleAccent}</span>
            </div>
            <div className={styles.footerBrandText}>
              {content.footerText.brandDescription}
            </div>
          </div>
          <div>
            <div className={styles.footerColTitle}>Services</div>
            {content.footerServices.map(s => (
              <span key={s} className={styles.footerLink} onClick={() => navigate('/services')}>
                {s}
              </span>
            ))}
          </div>
          <div>
            <div className={styles.footerColTitle}>Products</div>
            {content.footerProducts.map(p => (
              <span key={p} className={styles.footerLink} onClick={() => navigate('/products')}>
                {p}
              </span>
            ))}
          </div>
          <div>
            <div className={styles.footerColTitle}>Resources</div>
            {content.footerResources.map(r => (
              <span key={r.label} className={styles.footerLink} onClick={() => navigate(r.route)}>
                {r.label}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.footerBottom}>
          <div className={styles.footerCopy}>
            {content.footerText.copyright}
          </div>
          <span className={styles.footerPrivacy}>Privacy Policy</span>
        </div>
      </div>

      {/* Team Profile Modal */}
      {selectedMember && (
        <TeamProfileModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          styles={styles}
        />
      )}
    </div>
  );
};

export default LandingPage;
