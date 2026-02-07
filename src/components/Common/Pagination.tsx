/**
 * DWx Traffic Manager - Pagination Component
 * Reusable pagination bar with page size selector and navigation controls
 */

import React from 'react';
import {
  Text,
  Button,
  Dropdown,
  Option,
  makeStyles,
} from '@fluentui/react-components';
import {
  ChevronLeftRegular,
  ChevronRightRegular,
  ChevronDoubleLeftRegular,
  ChevronDoubleRightRegular,
} from '@fluentui/react-icons';
import { DW_COLORS } from '../../utils/buttonStyles';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    flexWrap: 'wrap',
    gap: '12px',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#616161',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#616161',
  },
  pageSizeDropdown: {
    minWidth: '80px',
  },
  pageButton: {
    minWidth: '32px',
    height: '32px',
  },
  activePageButton: {
    minWidth: '32px',
    height: '32px',
    backgroundColor: DW_COLORS.teal,
    color: 'white',
    ':hover': {
      backgroundColor: '#165a68',
      color: 'white',
    },
  },
});

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const styles = useStyles();

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate visible page numbers (show max 5 around current)
  const getPageNumbers = (): number[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: number[] = [1];

    let start = Math.max(2, currentPage - 2);
    let end = Math.min(totalPages - 1, currentPage + 2);

    // Adjust range to always show 5 middle pages when possible
    if (currentPage <= 3) {
      end = Math.min(5, totalPages - 1);
    }
    if (currentPage >= totalPages - 2) {
      start = Math.max(2, totalPages - 4);
    }

    if (start > 2) pages.push(-1); // ellipsis
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push(-2); // ellipsis

    pages.push(totalPages);
    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <Text size={200}>Show</Text>
        <Dropdown
          className={styles.pageSizeDropdown}
          size="small"
          value={String(pageSize)}
          selectedOptions={[String(pageSize)]}
          onOptionSelect={(_, data) => {
            onPageSizeChange(Number(data.optionValue));
            onPageChange(1);
          }}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <Option key={size} value={String(size)} text={String(size)}>
              {size}
            </Option>
          ))}
        </Dropdown>
        <Text size={200}>per page</Text>
      </div>

      <div className={styles.center}>
        <Button
          appearance="subtle"
          size="small"
          icon={<ChevronDoubleLeftRegular />}
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
        />
        <Button
          appearance="subtle"
          size="small"
          icon={<ChevronLeftRegular />}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        />

        {getPageNumbers().map((page, idx) =>
          page < 0 ? (
            <Text key={`ellipsis-${idx}`} size={200} style={{ padding: '0 4px' }}>
              ...
            </Text>
          ) : (
            <Button
              key={page}
              className={page === currentPage ? styles.activePageButton : styles.pageButton}
              appearance={page === currentPage ? 'primary' : 'subtle'}
              size="small"
              onClick={() => onPageChange(page)}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Button>
          )
        )}

        <Button
          appearance="subtle"
          size="small"
          icon={<ChevronRightRegular />}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        />
        <Button
          appearance="subtle"
          size="small"
          icon={<ChevronDoubleRightRegular />}
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
        />
      </div>

      <div className={styles.right}>
        <Text size={200}>
          {startItem}–{endItem} of {totalItems}
        </Text>
      </div>
    </div>
  );
};

/**
 * Custom hook for pagination state management.
 * Returns current page, page size, paginated slice, and control functions.
 */
export function usePagination<T>(items: T[], defaultPageSize = 20) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(defaultPageSize);

  // Reset to page 1 when items change (e.g., filter applied)
  const itemsLength = items.length;
  const prevLengthRef = React.useRef(itemsLength);
  React.useEffect(() => {
    if (prevLengthRef.current !== itemsLength) {
      setCurrentPage(1);
      prevLengthRef.current = itemsLength;
    }
  }, [itemsLength]);

  const totalPages = Math.max(1, Math.ceil(itemsLength / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = React.useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    currentPage: safePage,
    pageSize,
    paginatedItems,
    totalItems: itemsLength,
    totalPages,
    setCurrentPage,
    setPageSize,
  };
}
