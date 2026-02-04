import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  makeStyles,
  tokens,
  Checkbox,
  Button,
  Badge,
  ProgressBar,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Tooltip,
  Divider,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Filled,
  Warning24Filled,
  Clock24Regular,
  Info24Regular,
  Save24Regular,
} from '@fluentui/react-icons';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
  ChecklistItem,
  ChecklistStatus,
  deserializeChecklistItems,
  serializeChecklistItems,
} from '../../types/Checklist';
import { Booking } from '../../types/Booking';
import { useAuth } from '../../contexts/AuthContext';

const useStyles = makeStyles({
  container: {
    marginTop: tokens.spacingVerticalL,
  },
  card: {
    padding: tokens.spacingVerticalM,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  progressSection: {
    marginBottom: tokens.spacingVerticalL,
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalS,
  },
  checklistItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  checklistItem: {
    display: 'flex',
    flexDirection: 'column',
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  checklistItemCompleted: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  itemDescription: {
    marginLeft: '32px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  completedInfo: {
    marginLeft: '32px',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground4,
    fontStyle: 'italic',
  },
  dueDateSection: {
    marginTop: tokens.spacingVerticalM,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: tokens.spacingVerticalL,
    gap: tokens.spacingHorizontalM,
  },
  warningBar: {
    marginBottom: tokens.spacingVerticalM,
  },
});

interface DeploymentChecklistProps {
  booking: Booking;
  onSave: (checklistData: string, isComplete: boolean) => Promise<void>;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<ChecklistStatus, { color: 'success' | 'warning' | 'danger' | 'informative'; icon: React.ReactNode; label: string }> = {
  complete: { color: 'success', icon: <CheckmarkCircle24Filled />, label: 'Complete' },
  in_progress: { color: 'informative', icon: <Clock24Regular />, label: 'In Progress' },
  pending: { color: 'warning', icon: <Clock24Regular />, label: 'Pending' },
  overdue: { color: 'danger', icon: <Warning24Filled />, label: 'Overdue' },
};

export const DeploymentChecklistComponent: React.FC<DeploymentChecklistProps> = ({
  booking,
  onSave,
  isLoading = false,
}) => {
  const styles = useStyles();
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize checklist items from booking data
  useEffect(() => {
    const checklistItems = deserializeChecklistItems(booking.ChecklistData || null);
    setItems(checklistItems);
    setHasChanges(false);
  }, [booking.ChecklistData]);

  // Calculate due date (3 days before confirmed date)
  const confirmedDate = booking.ConfirmedDateTime ? parseISO(booking.ConfirmedDateTime) : null;
  const dueDate = confirmedDate ? new Date(confirmedDate.getTime() - 3 * 24 * 60 * 60 * 1000) : null;
  const isOverdue = dueDate ? new Date() > dueDate : false;
  const daysUntilDue = dueDate ? differenceInDays(dueDate, new Date()) : null;

  // Calculate progress
  const completedCount = items.filter((item) => item.isCompleted).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const isComplete = completedCount === totalCount;

  // Determine status
  const checklistStatus: ChecklistStatus = isComplete
    ? 'complete'
    : isOverdue
    ? 'overdue'
    : completedCount > 0
    ? 'in_progress'
    : 'pending';

  const statusConfig = STATUS_CONFIG[checklistStatus];

  const handleItemToggle = (itemId: string, checked: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              isCompleted: checked,
              completedBy: checked ? user?.displayName : undefined,
              completedAt: checked ? new Date().toISOString() : undefined,
            }
          : item
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const serialized = serializeChecklistItems(items);
      const allComplete = items.every((item) => item.isCompleted);
      await onSave(serialized, allComplete);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save checklist:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Only show checklist for Deployment bookings with confirmed date
  if (booking.BookingType !== 'Deployment' || !booking.ConfirmedDateTime) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Text weight="semibold" size={500}>
              Deployment Readiness Checklist
            </Text>
            <Badge
              appearance="filled"
              color={statusConfig.color}
              className={styles.statusBadge}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
          </div>
          <Tooltip content="Checklist must be completed 3 days before deployment" relationship="label">
            <Info24Regular />
          </Tooltip>
        </div>

        {/* Overdue Warning */}
        {isOverdue && !isComplete && (
          <MessageBar intent="error" className={styles.warningBar}>
            <MessageBarBody>
              <MessageBarTitle>Checklist Overdue</MessageBarTitle>
              This checklist was due on {dueDate && format(dueDate, 'dd MMM yyyy')}.
              The deployment may need to be rescheduled if items remain incomplete.
            </MessageBarBody>
          </MessageBar>
        )}

        {/* Due Date Warning */}
        {!isOverdue && daysUntilDue !== null && daysUntilDue <= 3 && !isComplete && (
          <MessageBar intent="warning" className={styles.warningBar}>
            <MessageBarBody>
              <MessageBarTitle>Checklist Due Soon</MessageBarTitle>
              {daysUntilDue === 0
                ? 'Checklist is due today!'
                : `Checklist is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}.`}
            </MessageBarBody>
          </MessageBar>
        )}

        {/* Progress Section */}
        <div className={styles.progressSection}>
          <div className={styles.progressText}>
            <Text size={200}>Progress</Text>
            <Text size={200} weight="semibold">
              {completedCount} of {totalCount} items complete
            </Text>
          </div>
          <ProgressBar
            value={progress}
            color={isComplete ? 'success' : isOverdue ? 'error' : 'brand'}
            thickness="large"
          />
        </div>

        {/* Due Date Info */}
        {dueDate && (
          <div className={styles.dueDateSection}>
            <Clock24Regular />
            <Text size={200}>
              Due: {format(dueDate, 'EEEE, dd MMM yyyy')} (3 days before deployment)
            </Text>
          </div>
        )}

        <Divider style={{ margin: `${tokens.spacingVerticalM} 0` }} />

        {/* Checklist Items */}
        <div className={styles.checklistItems}>
          {items.map((item) => (
            <div
              key={item.id}
              className={`${styles.checklistItem} ${item.isCompleted ? styles.checklistItemCompleted : ''}`}
            >
              <div className={styles.itemHeader}>
                <Checkbox
                  checked={item.isCompleted}
                  onChange={(_, data) => handleItemToggle(item.id, data.checked as boolean)}
                  label={
                    <Text weight={item.isCompleted ? 'regular' : 'semibold'}>
                      {item.label}
                    </Text>
                  }
                  disabled={isLoading || isSaving}
                />
              </div>
              <Text className={styles.itemDescription}>{item.description}</Text>
              {item.isCompleted && item.completedBy && (
                <Text className={styles.completedInfo}>
                  Completed by {item.completedBy}
                  {item.completedAt && ` on ${format(parseISO(item.completedAt), 'dd MMM yyyy HH:mm')}`}
                </Text>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button
            appearance="primary"
            icon={<Save24Regular />}
            onClick={handleSave}
            disabled={!hasChanges || isLoading || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Checklist'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
