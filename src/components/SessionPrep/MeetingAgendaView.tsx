/**
 * DWx Traffic Manager - Meeting Agenda View
 * Display AI-generated meeting agenda as a visual timeline.
 * Styled to match DetailModalShell section patterns.
 */

import React from 'react';
import {
  Text,
  Button,
  makeStyles,
} from '@fluentui/react-components';
import {
  CalendarRegular,
  ClockRegular,
  ArrowSyncRegular,
  SparkleRegular,
} from '@fluentui/react-icons';
import { MeetingAgenda } from '../../types/SessionPreparation';
import { DetailSection } from '../MyRequests/DetailModalShell';

const useStyles = makeStyles({
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    gap: '16px',
    textAlign: 'center',
    color: '#888',
  },
  totalBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#e8f4fc',
    borderRadius: '8px',
    border: '1px solid #cce4f0',
    marginBottom: '20px',
  },
  totalIcon: {
    width: '18px',
    height: '18px',
    color: '#1a5a8a',
  },
  totalLabel: {
    fontSize: '13px',
    color: '#616161',
    flex: 1,
  },
  totalValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a5a8a',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  totalBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    backgroundColor: 'rgba(26,90,138,0.1)',
    borderRadius: '4px',
    color: '#1a5a8a',
  },
  agendaItem: {
    display: 'flex',
    gap: '16px',
    marginBottom: '4px',
  },
  agendaLeft: {
    width: '60px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  agendaNum: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#1a5a8a',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
    zIndex: 1,
  },
  connector: {
    width: '2px',
    flex: 1,
    backgroundColor: '#e0e0e0',
    margin: '4px 0',
  },
  agendaRight: {
    flex: 1,
    padding: '8px 16px 16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #eee',
    marginBottom: '8px',
  },
  agendaTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '4px',
  },
  agendaDesc: {
    fontSize: '13px',
    color: '#616161',
    lineHeight: '1.5',
    marginBottom: '6px',
  },
  agendaTime: {
    fontSize: '11px',
    color: '#888',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
});

interface MeetingAgendaViewProps {
  agenda: MeetingAgenda | null;
  onRegenerate: () => void;
}

export const MeetingAgendaView: React.FC<MeetingAgendaViewProps> = ({
  agenda,
  onRegenerate,
}) => {
  const styles = useStyles();

  if (!agenda) {
    return (
      <div className={styles.emptyState}>
        <SparkleRegular style={{ fontSize: '48px' }} />
        <Text size={400} weight="semibold">No Meeting Agenda Generated</Text>
        <Text>Click "Generate AI Content" to create a meeting agenda tailored to this session.</Text>
      </div>
    );
  }

  let cumulativeMinutes = 0;
  const itemsWithTime = agenda.items
    .sort((a, b) => a.order - b.order)
    .map((item) => {
      const startMinutes = cumulativeMinutes;
      cumulativeMinutes += item.duration;
      return { ...item, startMinutes, endMinutes: cumulativeMinutes };
    });

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <DetailSection
      icon={<CalendarRegular />}
      title="Meeting Agenda"
      editButton={
        <Button appearance="subtle" icon={<ArrowSyncRegular />} onClick={onRegenerate} size="small">
          Regenerate
        </Button>
      }
      last
    >
      {/* Total Duration */}
      <div className={styles.totalBox}>
        <ClockRegular className={styles.totalIcon} />
        <span className={styles.totalLabel}>Total Duration</span>
        <span className={styles.totalValue}>
          {formatTime(agenda.totalDuration)}
          <span className={styles.totalBadge}>{agenda.items.length} items</span>
        </span>
      </div>

      {/* Timeline */}
      <div>
        {itemsWithTime.map((item, index) => {
          const isLast = index === itemsWithTime.length - 1;
          return (
            <div key={item.id} className={styles.agendaItem}>
              <div className={styles.agendaLeft}>
                <div className={styles.agendaNum}>{index + 1}</div>
                {!isLast && <div className={styles.connector} />}
              </div>
              <div className={styles.agendaRight}>
                <div className={styles.agendaTitle}>{item.title}</div>
                <div className={styles.agendaDesc}>{item.description}</div>
                <div className={styles.agendaTime}>
                  <ClockRegular style={{ width: 12, height: 12 }} />
                  {formatTime(item.duration)} &middot; {formatTime(item.startMinutes)} &ndash; {formatTime(item.endMinutes)} mark
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DetailSection>
  );
};
