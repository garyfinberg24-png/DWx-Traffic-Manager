/**
 * DWx Traffic Manager - Meeting Agenda View
 * Display and manage AI-generated meeting agenda
 */

import React from 'react';
import {
  Text,
  Button,
  Card,
  makeStyles,
  tokens,
  Badge,
} from '@fluentui/react-components';
import {
  CalendarRegular,
  ClockRegular,
  ArrowSyncRegular,
  SparkleRegular,
} from '@fluentui/react-icons';
import { MeetingAgenda } from '../../types/SessionPreparation';
import { format } from 'date-fns';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  generatedAt: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
    gap: tokens.spacingVerticalM,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  totalDuration: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalM,
  },
  agendaTimeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  agendaItem: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
  },
  timeColumn: {
    width: '80px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  timeIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: tokens.colorBrandBackground,
    flexShrink: 0,
  },
  timeLine: {
    width: '2px',
    flex: 1,
    backgroundColor: tokens.colorNeutralStroke2,
    marginTop: tokens.spacingVerticalXS,
  },
  durationBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: tokens.colorBrandForeground1,
    marginTop: tokens.spacingVerticalXXS,
  },
  itemContent: {
    flex: 1,
    paddingBottom: tokens.spacingVerticalM,
  },
  itemTitle: {
    fontWeight: '600',
    fontSize: '14px',
    marginBottom: tokens.spacingVerticalXXS,
  },
  itemDescription: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.5',
  },
  itemOrder: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: tokens.colorBrandBackground,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
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
        <Text size={400} weight="semibold">
          No Meeting Agenda Generated
        </Text>
        <Text>
          Click "Generate AI Content" to create a meeting agenda tailored to this session.
        </Text>
      </div>
    );
  }

  // Calculate cumulative time for each item
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
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <CalendarRegular />
          <Text weight="semibold">Meeting Agenda</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
          {agenda.generatedAt && (
            <Text className={styles.generatedAt}>
              Generated {format(new Date(agenda.generatedAt), 'MMM d, yyyy h:mm a')}
            </Text>
          )}
          <Button
            appearance="subtle"
            icon={<ArrowSyncRegular />}
            onClick={onRegenerate}
            size="small"
          >
            Regenerate
          </Button>
        </div>
      </div>

      {/* Total Duration */}
      <div className={styles.totalDuration}>
        <ClockRegular />
        <Text weight="medium">Total Duration:</Text>
        <Badge appearance="filled" color="brand">
          {formatTime(agenda.totalDuration)}
        </Badge>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          ({agenda.items.length} agenda items)
        </Text>
      </div>

      {/* Agenda Timeline */}
      <div className={styles.agendaTimeline}>
        {itemsWithTime.map((item, index) => (
          <Card key={item.id} className={styles.agendaItem}>
            <div className={styles.timeColumn}>
              <span className={styles.itemOrder}>{index + 1}</span>
              <span className={styles.durationBadge}>{formatTime(item.duration)}</span>
            </div>
            <div className={styles.itemContent}>
              <Text className={styles.itemTitle}>{item.title}</Text>
              <Text className={styles.itemDescription}>{item.description}</Text>
              <div style={{ marginTop: tokens.spacingVerticalXS }}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
                  {formatTime(item.startMinutes)} - {formatTime(item.endMinutes)} mark
                </Text>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
