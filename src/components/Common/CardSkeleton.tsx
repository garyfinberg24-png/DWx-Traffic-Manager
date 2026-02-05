/**
 * DWx Traffic Manager - Card Skeleton
 * Shimmer loading placeholder for request cards and dashboard sections
 */

import React from 'react';
import {
  Skeleton,
  SkeletonItem,
  makeStyles,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    overflow: 'hidden',
    borderLeft: '4px solid #e0e0e0',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  details: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e8e8e8',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
});

interface CardSkeletonProps {
  count?: number;
}

export const RequestCardSkeleton: React.FC<CardSkeletonProps> = ({ count = 3 }) => {
  const styles = useStyles();

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} aria-label="Loading request">
          <div className={styles.card}>
            <div className={styles.row}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <SkeletonItem shape="rectangle" size={20} style={{ width: '60%' }} />
                <SkeletonItem shape="rectangle" size={16} style={{ width: '40%' }} />
              </div>
              <SkeletonItem shape="rectangle" size={24} style={{ width: '80px', borderRadius: '4px' }} />
            </div>
            <div className={styles.row}>
              <SkeletonItem shape="rectangle" size={24} style={{ width: '60px', borderRadius: '4px' }} />
              <SkeletonItem shape="rectangle" size={24} style={{ width: '120px', borderRadius: '4px' }} />
            </div>
            <SkeletonItem shape="rectangle" size={8} style={{ width: '100%', borderRadius: '3px' }} />
            <div className={styles.details}>
              {[1, 2, 3].map((j) => (
                <div key={j} className={styles.detailItem}>
                  <SkeletonItem shape="rectangle" size={8} style={{ width: '50%' }} />
                  <SkeletonItem shape="rectangle" size={16} style={{ width: '70%' }} />
                </div>
              ))}
            </div>
          </div>
        </Skeleton>
      ))}
    </>
  );
};

export const KPICardSkeleton: React.FC<CardSkeletonProps> = ({ count = 4 }) => {
  const styles = useStyles();

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} aria-label="Loading metric">
          <div className={styles.kpiCard}>
            <SkeletonItem shape="rectangle" size={12} style={{ width: '50%' }} />
            <SkeletonItem shape="rectangle" size={28} style={{ width: '40%' }} />
            <SkeletonItem shape="rectangle" size={12} style={{ width: '70%' }} />
          </div>
        </Skeleton>
      ))}
    </>
  );
};

export const TableRowSkeleton: React.FC<{ columns?: number; rows?: number }> = ({
  columns = 5,
  rows = 5,
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} aria-label="Loading row">
          <div style={{ display: 'flex', gap: '16px', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
            {Array.from({ length: columns }).map((_, j) => (
              <SkeletonItem
                key={j}
                shape="rectangle"
                size={16}
                style={{ width: `${100 / columns}%` }}
              />
            ))}
          </div>
        </Skeleton>
      ))}
    </>
  );
};
