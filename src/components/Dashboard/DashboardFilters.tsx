import React from 'react';
import {
  makeStyles,
  Dropdown,
  Option,
  Button,
  Text,
} from '@fluentui/react-components';
import { Filter24Regular, ArrowReset24Regular } from '@fluentui/react-icons';
import { TimePeriod, DashboardFilters as FilterType } from '../../types/Dashboard';
import { BOOKING_STATUS_OPTIONS, BOOKING_TYPE_OPTIONS, BookingStatus } from '../../types/Booking';
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from 'date-fns';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'flex-end',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    borderLeft: '4px solid #1e6b7b',
    borderTop: '1px solid #d0d0d0',
  },
  filterIcon: {
    color: '#1e6b7b',
    width: '20px',
    height: '20px',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '150px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginLeft: 'auto',
  },
  resetBtn: {
    color: '#1e6b7b',
    ':hover': {
      backgroundColor: 'rgba(30, 107, 123, 0.08)',
    },
  },
});

interface DashboardFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  accountManagers: { name: string; email: string }[];
}

const TIME_PERIOD_OPTIONS: { key: TimePeriod; label: string }[] = [
  { key: 'last7days', label: 'Last 7 Days' },
  { key: 'last30days', label: 'Last 30 Days' },
  { key: 'last90days', label: 'Last 90 Days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'thisQuarter', label: 'This Quarter' },
  { key: 'thisYear', label: 'This Year' },
];

const getDateRangeForPeriod = (period: TimePeriod): { start: Date; end: Date } => {
  const now = new Date();
  const end = endOfDay(now);

  switch (period) {
    case 'last7days':
      return { start: startOfDay(subDays(now, 7)), end };
    case 'last30days':
      return { start: startOfDay(subDays(now, 30)), end };
    case 'last90days':
      return { start: startOfDay(subDays(now, 90)), end };
    case 'thisMonth':
      return { start: startOfMonth(now), end };
    case 'thisQuarter':
      return { start: startOfQuarter(now), end };
    case 'thisYear':
      return { start: startOfYear(now), end };
    default:
      return { start: startOfDay(subDays(now, 30)), end };
  }
};

export const DashboardFiltersComponent: React.FC<DashboardFiltersProps> = ({
  filters,
  onFiltersChange,
  accountManagers,
}) => {
  const styles = useStyles();
  const [selectedPeriod, setSelectedPeriod] = React.useState<TimePeriod>('last30days');

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
    const dateRange = getDateRangeForPeriod(period);
    onFiltersChange({ ...filters, dateRange });
  };

  const handleStatusChange = (statuses: BookingStatus[]) => {
    onFiltersChange({ ...filters, statuses: statuses.length > 0 ? statuses : undefined });
  };

  const handleTypeChange = (types: ('Demo' | 'Deployment')[]) => {
    onFiltersChange({ ...filters, bookingTypes: types.length > 0 ? types : undefined });
  };

  const handleManagerChange = (emails: string[]) => {
    onFiltersChange({ ...filters, accountManagers: emails.length > 0 ? emails : undefined });
  };

  const handleReset = () => {
    setSelectedPeriod('last30days');
    onFiltersChange({
      dateRange: getDateRangeForPeriod('last30days'),
    });
  };

  return (
    <div className={styles.container}>
      <Filter24Regular className={styles.filterIcon} />

      <div className={styles.filterGroup}>
        <Text className={styles.label}>Time Period</Text>
        <Dropdown
          value={TIME_PERIOD_OPTIONS.find((o) => o.key === selectedPeriod)?.label || ''}
          onOptionSelect={(_, data) => {
            const period = TIME_PERIOD_OPTIONS.find((o) => o.label === data.optionText)?.key;
            if (period) handlePeriodChange(period);
          }}
        >
          {TIME_PERIOD_OPTIONS.map((option) => (
            <Option key={option.key} value={option.key}>
              {option.label}
            </Option>
          ))}
        </Dropdown>
      </div>

      <div className={styles.filterGroup}>
        <Text className={styles.label}>Status</Text>
        <Dropdown
          multiselect
          placeholder="All Statuses"
          selectedOptions={filters.statuses || []}
          onOptionSelect={(_, data) => {
            handleStatusChange(data.selectedOptions as BookingStatus[]);
          }}
        >
          {BOOKING_STATUS_OPTIONS.map((status) => (
            <Option key={status} value={status}>
              {status}
            </Option>
          ))}
        </Dropdown>
      </div>

      <div className={styles.filterGroup}>
        <Text className={styles.label}>Type</Text>
        <Dropdown
          multiselect
          placeholder="All Types"
          selectedOptions={filters.bookingTypes || []}
          onOptionSelect={(_, data) => {
            handleTypeChange(data.selectedOptions as ('Demo' | 'Deployment')[]);
          }}
        >
          {BOOKING_TYPE_OPTIONS.map((type) => (
            <Option key={type} value={type}>
              {type}
            </Option>
          ))}
        </Dropdown>
      </div>

      {accountManagers.length > 0 && (
        <div className={styles.filterGroup}>
          <Text className={styles.label}>Account Manager</Text>
          <Dropdown
            multiselect
            placeholder="All Managers"
            selectedOptions={filters.accountManagers || []}
            onOptionSelect={(_, data) => {
              handleManagerChange(data.selectedOptions);
            }}
          >
            {accountManagers.map((manager) => (
              <Option key={manager.email} value={manager.email}>
                {manager.name}
              </Option>
            ))}
          </Dropdown>
        </div>
      )}

      <div className={styles.actions}>
        <Button
          appearance="subtle"
          className={styles.resetBtn}
          icon={<ArrowReset24Regular />}
          onClick={handleReset}
        >
          Reset
        </Button>
      </div>
    </div>
  );
};
