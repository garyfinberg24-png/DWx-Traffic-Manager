import React, { useState } from 'react';
import {
  Text,
  makeStyles,
  Input,
} from '@fluentui/react-components';
import { Search24Regular, ArrowSort24Regular } from '@fluentui/react-icons';
import { ClientMetrics } from '../../types/Dashboard';

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
  clientNameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  premiumBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    background: 'linear-gradient(135deg, rgba(229, 168, 75, 0.2) 0%, rgba(229, 168, 75, 0.1) 100%)',
    color: '#8b6914',
  },
  typeBadge: {
    display: 'inline-flex',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
  },
  demoBadge: {
    backgroundColor: 'rgba(30, 107, 123, 0.1)',
    color: '#1e6b7b',
  },
  deploymentBadge: {
    backgroundColor: 'rgba(229, 168, 75, 0.15)',
    color: '#8b6914',
  },
  trendIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    fontSize: '12px',
    marginLeft: '4px',
  },
  trendUp: {
    color: '#107c10',
  },
  trendDown: {
    color: '#d13438',
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

interface ClientTableProps {
  data: ClientMetrics[];
}

type SortField = keyof ClientMetrics;
type SortDirection = 'asc' | 'desc';

export const ClientTable: React.FC<ClientTableProps> = ({ data }) => {
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

  const filteredData = data.filter(
    (client) =>
      client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.accountManager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      return sortDirection === 'asc'
        ? (aValue ? 1 : 0) - (bValue ? 1 : 0)
        : (bValue ? 1 : 0) - (aValue ? 1 : 0);
    }

    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const getPrimaryType = (client: ClientMetrics): 'Demo' | 'Deployment' => {
    return client.demos >= client.deployments ? 'Demo' : 'Deployment';
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Text className={styles.cardTitle}>Top Clients by Bookings</Text>
        <span className={styles.viewAllLink}>View All →</span>
      </div>
      <div className={styles.searchContainer}>
        <Input
          contentBefore={<Search24Regular />}
          placeholder="Search by client or account manager..."
          value={searchTerm}
          onChange={(_, data) => setSearchTerm(data.value)}
        />
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.tableHeader} onClick={() => handleSort('clientName')}>
              Client
              <ArrowSort24Regular className={styles.sortIcon} />
            </th>
            <th className={styles.tableHeader} onClick={() => handleSort('totalLicenses')}>
              Licenses
              <ArrowSort24Regular className={styles.sortIcon} />
            </th>
            <th className={styles.tableHeader} onClick={() => handleSort('totalBookings')}>
              Bookings
              <ArrowSort24Regular className={styles.sortIcon} />
            </th>
            <th className={styles.tableHeader} onClick={() => handleSort('demos')}>
              Type
              <ArrowSort24Regular className={styles.sortIcon} />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length > 0 ? (
            sortedData.slice(0, 5).map((client, index) => (
              <tr key={index} className={styles.tableRow}>
                <td className={styles.tableCell}>
                  <div className={styles.clientNameCell}>
                    <span style={{ fontWeight: 500 }}>{client.clientName}</span>
                    {client.isPremium && (
                      <span className={styles.premiumBadge}>★ Premium</span>
                    )}
                  </div>
                </td>
                <td className={styles.tableCell}>{client.totalLicenses.toLocaleString()}</td>
                <td className={styles.tableCell}>
                  {client.totalBookings}
                  {index < 2 && (
                    <span className={`${styles.trendIndicator} ${styles.trendUp}`}>
                      ▲
                    </span>
                  )}
                </td>
                <td className={styles.tableCell}>
                  <span className={`${styles.typeBadge} ${getPrimaryType(client) === 'Demo' ? styles.demoBadge : styles.deploymentBadge}`}>
                    {getPrimaryType(client)}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className={styles.emptyState}>
                No clients found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
