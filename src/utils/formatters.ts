/**
 * DWx Traffic Manager - Shared Formatting Utilities
 * Centralised formatDate and formatCurrency to eliminate duplication.
 */

import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

// ── Currency ──────────────────────────────────────────────────────────────

/** Full ZAR currency string: R 150,000 */
export const formatCurrency = (value?: number | null): string => {
  if (value == null || isNaN(value)) return '-';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/** Compact ZAR: R150K / R1.2M */
export const formatCurrencyCompact = (value: number): string => {
  if (value >= 1_000_000) return `R${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R${(value / 1_000).toFixed(0)}K`;
  return `R${value.toFixed(0)}`;
};

// ── Dates ─────────────────────────────────────────────────────────────────

/** Parse a date-like value safely */
const toDate = (d: string | Date | undefined | null): Date | null => {
  if (!d) return null;
  const date = typeof d === 'string' ? parseISO(d) : d;
  return isValid(date) ? date : null;
};

/** Short date: "8 Feb 2026" */
export const formatDate = (d: string | Date | undefined | null): string => {
  const date = toDate(d);
  return date ? format(date, 'd MMM yyyy') : '-';
};

/** Date + time: "8 Feb 2026, 14:30" */
export const formatDateTime = (d: string | Date | undefined | null): string => {
  const date = toDate(d);
  return date ? format(date, 'd MMM yyyy, HH:mm') : '-';
};

/** Relative: "3 days ago" */
export const formatRelativeDate = (d: string | Date | undefined | null): string => {
  const date = toDate(d);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : '-';
};

/** Slot format: "Feb 8 @ 2:30 PM" */
export const formatSlot = (d: string | Date | undefined | null): string => {
  const date = toDate(d);
  return date ? format(date, 'MMM d @ h:mm a') : '-';
};
