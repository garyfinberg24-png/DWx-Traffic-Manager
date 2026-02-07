/**
 * DWx Traffic Manager - Standardized Button Color Constants
 *
 * All button background colors should reference these constants
 * instead of using inline hex strings. This ensures consistent
 * branding across the entire application.
 *
 * Usage in makeStyles:
 *   backgroundColor: DW_COLORS.primary,
 *
 * Usage in inline styles:
 *   style={{ backgroundColor: DW_COLORS.primary }}
 */

export const DW_COLORS = {
  /** Brand blue - primary actions, CTAs, navigation highlights */
  primary: '#1a5a8a',

  /** Teal - secondary/admin actions, manager-only UI, accents */
  teal: '#1e6b7b',

  /** Green - success, approve, confirm, won, completed */
  success: '#107c10',

  /** Red - danger, delete, cancel, lost, decline */
  danger: '#d13438',

  /** Grey - neutral/disabled actions */
  neutral: '#616161',
} as const;
