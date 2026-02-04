import React from 'react';
import {
  Input,
  Dropdown,
  Option,
  Button,
  makeStyles,
  Text,
} from '@fluentui/react-components';
import {
  Search24Regular,
  Filter24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import { FilterCriteria, BOOKING_STATUS_OPTIONS, BOOKING_TYPE_OPTIONS, BookingStatus } from '../../types/Booking';

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
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '180px',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  field: {
    flex: '1 1 200px',
    minWidth: '150px',
  },
  searchField: {
    flex: '2 1 300px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  refreshBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #e1e1e1',
    ':hover': {
      backgroundColor: '#f5f5f5',
    },
  },
});

interface BookingFiltersProps {
  filters: FilterCriteria;
  onFilterChange: (filters: FilterCriteria) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const BookingFilters: React.FC<BookingFiltersProps> = ({
  filters,
  onFilterChange,
  onRefresh,
  isLoading,
}) => {
  const styles = useStyles();

  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value || undefined });
  };

  const handleStatusChange = (selectedOptions: string[]) => {
    onFilterChange({
      ...filters,
      status: selectedOptions.length > 0 ? (selectedOptions as BookingStatus[]) : undefined,
    });
  };

  const handleTypeChange = (selectedOptions: string[]) => {
    onFilterChange({
      ...filters,
      bookingType: selectedOptions.length > 0 ? (selectedOptions as ('Demo' | 'Deployment')[]) : undefined,
    });
  };

  const handleClearFilters = () => {
    onFilterChange({});
  };

  const hasFilters = filters.search || filters.status?.length || filters.bookingType?.length;

  return (
    <div className={styles.container}>
      <div className={styles.filterGroup}>
        <Text className={styles.filterLabel}>Status</Text>
        <Dropdown
          placeholder="All Statuses"
          multiselect
          selectedOptions={filters.status || []}
          onOptionSelect={(_, data) => handleStatusChange(data.selectedOptions)}
          disabled={isLoading}
        >
          {BOOKING_STATUS_OPTIONS.map((status) => (
            <Option key={status} value={status}>
              {status}
            </Option>
          ))}
        </Dropdown>
      </div>

      <div className={styles.filterGroup}>
        <Text className={styles.filterLabel}>Type</Text>
        <Dropdown
          placeholder="All Types"
          multiselect
          selectedOptions={filters.bookingType || []}
          onOptionSelect={(_, data) => handleTypeChange(data.selectedOptions)}
          disabled={isLoading}
        >
          {BOOKING_TYPE_OPTIONS.map((type) => (
            <Option key={type} value={type}>
              {type}
            </Option>
          ))}
        </Dropdown>
      </div>

      <div className={`${styles.filterGroup} ${styles.searchField}`}>
        <Text className={styles.filterLabel}>Search</Text>
        <Input
          placeholder="Search by client name or comments..."
          value={filters.search || ''}
          onChange={(_, data) => handleSearchChange(data.value)}
          contentBefore={<Search24Regular />}
          disabled={isLoading}
        />
      </div>

      <div className={styles.actions}>
        {hasFilters && (
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            onClick={handleClearFilters}
            disabled={isLoading}
          >
            Clear
          </Button>
        )}
        <Button
          appearance="secondary"
          className={styles.refreshBtn}
          icon={<Filter24Regular />}
          onClick={onRefresh}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
};
