/**
 * DWx Traffic Manager - Recent Activity Panel
 * Shows recent deal activity (stage changes, assignments, proposals, etc.)
 * in a dropdown panel triggered from the header.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  makeStyles,
  Button,
  Text,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  tokens,
  Badge,
} from '@fluentui/react-components';
import {
  History24Regular,
  History24Filled,
  ArrowForward16Regular,
  Add16Regular,
  Edit16Regular,
  Checkmark16Regular,
  Dismiss16Regular as DismissSmall,
  PersonAdd16Regular,
  Calendar16Regular,
  Document16Regular,
  Delete24Regular,
} from '@fluentui/react-icons';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// Types
// ============================================================================

export type ActivityAction =
  | 'stage_changed'
  | 'deal_created'
  | 'deal_updated'
  | 'specialist_assigned'
  | 'meeting_confirmed'
  | 'proposal_created'
  | 'proposal_status'
  | 'deal_won'
  | 'deal_lost';

export interface ActivityEntry {
  id: string;
  action: ActivityAction;
  title: string;
  description: string;
  timestamp: Date;
  dealId?: number;
  performedBy: string;
}

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  trigger: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'white',
    '& svg': {
      color: 'white',
    },
    ':hover': {
      color: 'white',
    },
    ':hover svg': {
      color: 'white',
    },
  },
  badge: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    minWidth: '18px',
    height: '18px',
    fontSize: '10px',
    fontWeight: '600',
  },
  popover: {
    width: '380px',
    maxHeight: '480px',
    padding: '0',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  headerTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  content: {
    maxHeight: '380px',
    overflowY: 'auto',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
  },
  activityItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    transition: 'background-color 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  iconContainer: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconStage: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '#3B82F6',
  },
  iconCreate: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#10B981',
  },
  iconUpdate: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: '#F59E0B',
  },
  iconAssign: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    color: '#8B5CF6',
  },
  iconMeeting: {
    backgroundColor: 'rgba(30, 107, 123, 0.1)',
    color: '#1e6b7b',
  },
  iconProposal: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    color: '#EC4899',
  },
  iconWon: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#10B981',
  },
  iconLost: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#EF4444',
  },
  activityContent: {
    flex: 1,
    minWidth: 0,
  },
  activityTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    marginBottom: '2px',
  },
  activityDescription: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.4',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  activityMeta: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginTop: '4px',
  },
  activityTime: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  activityUser: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
  },
  emptyIcon: {
    width: '48px',
    height: '48px',
    color: tokens.colorNeutralForeground4,
    marginBottom: '12px',
  },
  emptyText: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
  },
});

// ============================================================================
// Helpers
// ============================================================================

const getActivityIcon = (action: ActivityAction) => {
  switch (action) {
    case 'stage_changed':
      return <ArrowForward16Regular />;
    case 'deal_created':
      return <Add16Regular />;
    case 'deal_updated':
      return <Edit16Regular />;
    case 'specialist_assigned':
      return <PersonAdd16Regular />;
    case 'meeting_confirmed':
      return <Calendar16Regular />;
    case 'proposal_created':
    case 'proposal_status':
      return <Document16Regular />;
    case 'deal_won':
      return <Checkmark16Regular />;
    case 'deal_lost':
      return <DismissSmall />;
  }
};

const getIconClass = (action: ActivityAction, styles: ReturnType<typeof useStyles>) => {
  switch (action) {
    case 'stage_changed':
      return styles.iconStage;
    case 'deal_created':
      return styles.iconCreate;
    case 'deal_updated':
      return styles.iconUpdate;
    case 'specialist_assigned':
      return styles.iconAssign;
    case 'meeting_confirmed':
      return styles.iconMeeting;
    case 'proposal_created':
    case 'proposal_status':
      return styles.iconProposal;
    case 'deal_won':
      return styles.iconWon;
    case 'deal_lost':
      return styles.iconLost;
  }
};

// ============================================================================
// Mock seed data for test mode
// ============================================================================

const SEED_ACTIVITIES: ActivityEntry[] = [
  {
    id: 'act-1',
    action: 'deal_created',
    title: 'New Deal Created',
    description: 'Acme Corporation - Power Platform Development',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
    dealId: 101,
    performedBy: 'Gary Finberg',
  },
  {
    id: 'act-2',
    action: 'stage_changed',
    title: 'Stage: Lead → Qualified',
    description: 'TechVision Inc - SPFx Development',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
    dealId: 102,
    performedBy: 'Test Account Manager',
  },
  {
    id: 'act-3',
    action: 'specialist_assigned',
    title: 'Specialist Assigned',
    description: 'John Smith assigned to Acme Corporation deal',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    dealId: 101,
    performedBy: 'Gary Finberg',
  },
  {
    id: 'act-4',
    action: 'meeting_confirmed',
    title: 'Discovery Meeting Confirmed',
    description: 'GlobalTech Solutions - M365 Assessment on Feb 15, 2026',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    dealId: 103,
    performedBy: 'Gary Finberg',
  },
  {
    id: 'act-5',
    action: 'proposal_created',
    title: 'Proposal Created',
    description: 'MegaCorp Ltd - Copilot Agents (Draft v1)',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    dealId: 104,
    performedBy: 'Test Account Manager',
  },
  {
    id: 'act-6',
    action: 'deal_won',
    title: 'Deal Won!',
    description: 'SmallBiz Solutions - Training (R60,000)',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    dealId: 106,
    performedBy: 'Gary Finberg',
  },
  {
    id: 'act-7',
    action: 'deal_updated',
    title: 'Deal Value Updated',
    description: 'Innovate Partners - Strategic Advisory: R95K → R120K',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    dealId: 105,
    performedBy: 'Other Account Manager',
  },
  {
    id: 'act-8',
    action: 'proposal_status',
    title: 'Proposal Approved',
    description: 'CloudFirst - SharePoint Migration proposal approved for client',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    dealId: 107,
    performedBy: 'Gary Finberg',
  },
  {
    id: 'act-9',
    action: 'deal_lost',
    title: 'Deal Lost',
    description: 'DataDriven Analytics - SLA Management (budget constraints)',
    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000), // 1.5 days ago
    dealId: 110,
    performedBy: 'Other Account Manager',
  },
  {
    id: 'act-10',
    action: 'stage_changed',
    title: 'Stage: Proposal → Negotiation',
    description: 'Innovate Partners - Strategic Advisory',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    dealId: 105,
    performedBy: 'Gary Finberg',
  },
];

const STORAGE_KEY = 'dwx_recent_activity';

// ============================================================================
// Component
// ============================================================================

export const RecentActivity: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [viewedAt, setViewedAt] = useState<Date | null>(null);

  // Load activities from localStorage or seed with mock data
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const restored = parsed.activities.map((a: ActivityEntry) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        }));
        setActivities(restored);
        if (parsed.viewedAt) {
          setViewedAt(new Date(parsed.viewedAt));
        }
      } else {
        // Seed with mock data on first load
        setActivities(SEED_ACTIVITIES);
      }
    } catch {
      setActivities(SEED_ACTIVITIES);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (activities.length > 0) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ activities, viewedAt })
        );
      } catch {
        // Silent fail
      }
    }
  }, [activities, viewedAt]);

  // Count of activities since last viewed
  const newCount = useMemo(() => {
    if (!viewedAt) return activities.length;
    return activities.filter((a) => a.timestamp > viewedAt).length;
  }, [activities, viewedAt]);

  // Mark as viewed when panel opens
  const handleOpenChange = useCallback(
    (_: unknown, data: { open: boolean }) => {
      setIsOpen(data.open);
      if (data.open) {
        setViewedAt(new Date());
      }
    },
    []
  );

  const handleActivityClick = useCallback(
    (activity: ActivityEntry) => {
      setIsOpen(false);
      if (activity.dealId) {
        navigate('/requests');
      }
    },
    [navigate]
  );

  const handleClearAll = useCallback(() => {
    setActivities([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <Popover
      open={isOpen}
      onOpenChange={handleOpenChange}
      positioning="below-end"
    >
      <PopoverTrigger disableButtonEnhancement>
        <span className={styles.trigger}>
          {newCount > 0 ? <History24Filled /> : <History24Regular />}
          {newCount > 0 && (
            <Badge
              appearance="filled"
              color="informative"
              size="small"
              className={styles.badge}
            >
              {newCount > 9 ? '9+' : newCount}
            </Badge>
          )}
        </span>
      </PopoverTrigger>
      <PopoverSurface className={styles.popover}>
        {/* Header */}
        <div className={styles.header}>
          <Text className={styles.headerTitle}>Recent Activity</Text>
          {activities.length > 0 && (
            <Button
              appearance="subtle"
              size="small"
              icon={<Delete24Regular />}
              onClick={handleClearAll}
              title="Clear all"
            />
          )}
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activities.length === 0 ? (
            <div className={styles.emptyState}>
              <History24Regular className={styles.emptyIcon} />
              <Text className={styles.emptyText}>No recent activity</Text>
            </div>
          ) : (
            <div className={styles.activityList}>
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className={styles.activityItem}
                  onClick={() => handleActivityClick(activity)}
                >
                  <div
                    className={`${styles.iconContainer} ${getIconClass(activity.action, styles)}`}
                  >
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityTitle}>
                      {activity.title}
                    </div>
                    <div className={styles.activityDescription}>
                      {activity.description}
                    </div>
                    <div className={styles.activityMeta}>
                      <span className={styles.activityTime}>
                        {formatDistanceToNow(activity.timestamp, {
                          addSuffix: true,
                        })}
                      </span>
                      <span className={styles.activityUser}>
                        {activity.performedBy}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverSurface>
    </Popover>
  );
};
