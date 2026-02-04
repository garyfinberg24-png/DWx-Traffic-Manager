import React, { useState } from 'react';
import {
  Text,
  makeStyles,
  Input,
} from '@fluentui/react-components';
import { Search24Regular, ArrowSort24Regular } from '@fluentui/react-icons';
import { AccountManagerMetrics } from '../../types/Dashboard';

const useStyles = makeStyles({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    overflow: 'hidden',
    height: '100%',
    borderLeft: '4px solid #1e6b7b',
    borderTop: '1px solid #d0d0d0',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #e1e1e1',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
  },
  viewAllLink: {
    fontSize: '13px',
    color: '#1e6b7b',
    textDecoration: 'none',
    fontWeight: '500',
    cursor: 'pointer',
    ':hover': {
      textDecoration: 'underline',
    },
  },
  searchContainer: {
    padding: '12px 24px',
    borderBottom: '1px solid #e1e1e1',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    textAlign: 'left',
    padding: '12px 24px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e1e1e1',
    cursor: 'pointer',
  },
  tableCell: {
    padding: '12px 24px',
    fontSize: '13px',
    borderBottom: '1px solid #e1e1e1',
    color: '#242424',
  },
  tableRow: {
    ':hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
    },
    ':last-child td': {
      borderBottom: 'none',
    },
  },
  amName: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  amAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#7fa8b0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
    color: 'white',
    flexShrink: 0,
  },
  amInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  amNameText: {
    fontWeight: '600',
    color: '#242424',
  },
  amEmail: {
    fontSize: '12px',
    color: '#616161',
  },
  progressBar: {
    height: '6px',
    backgroundColor: '#f5f5f5',
    borderRadius: '3px',
    overflow: 'hidden',
    minWidth: '80px',
  },
  progressFill: {
    height: '100%',
    borderRadius: '3px',
    backgroundColor: '#1e6b7b',
  },
  sortIcon: {
    marginLeft: '4px',
    opacity: 0.5,
    width: '12px',
    height: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '32px',
    color: '#616161',
  },
});

interface AccountManagerTableProps {
  data: AccountManagerMetrics[];
}

type SortField = keyof AccountManagerMetrics;
type SortDirection = 'asc' | 'desc';

export const AccountManagerTable: React.FC<AccountManagerTableProps> = ({ data }) => {
  const styles = useStyles();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalBookings');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredData = data.filter((manager) =>
    manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Text className={styles.cardTitle}>Account Manager Performance</Text>
        <span className={styles.viewAllLink}>View All →</span>
      </div>
      <div className={styles.searchContainer}>
        <Input
          contentBefore={<Search24Regular />}
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(_, data) => setSearchTerm(data.value)}
        />
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.tableHeader} onClick={() => handleSort('name')}>
              Account Manager
              <ArrowSort24Regular className={styles.sortIcon} />
            </th>
            <th className={styles.tableHeader} onClick={() => handleSort('totalBookings')}>
              Bookings
              <ArrowSort24Regular className={styles.sortIcon} />
            </th>
            <th className={styles.tableHeader} onClick={() => handleSort('confirmedBookings')}>
              Confirmed
              <ArrowSort24Regular className={styles.sortIcon} />
            </th>
            <th className={styles.tableHeader} onClick={() => handleSort('conversionRate')}>
              Conversion
              <ArrowSort24Regular className={styles.sortIcon} />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length > 0 ? (
            sortedData.slice(0, 5).map((manager, index) => (
              <tr key={index} className={styles.tableRow}>
                <td className={styles.tableCell}>
                  <div className={styles.amName}>
                    <div className={styles.amAvatar}>{getInitials(manager.name)}</div>
                    <span className={styles.amNameText}>{manager.name}</span>
                  </div>
                </td>
                <td className={styles.tableCell}>{manager.totalBookings}</td>
                <td className={styles.tableCell}>{manager.confirmedBookings}</td>
                <td className={styles.tableCell}>
                  <div className={styles.progressBar} title={`${manager.conversionRate}%`}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${manager.conversionRate}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className={styles.emptyState}>
                No account managers found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
