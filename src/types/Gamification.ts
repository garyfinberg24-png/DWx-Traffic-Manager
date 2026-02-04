/**
 * Gamification types for AM booking incentivisation
 */

// Badge tier levels
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

// Badge definition (static config)
export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string; // Emoji icon
  description: string;
  tier: BadgeTier;
  unlockCriteria: string; // Human-readable unlock text
}

// Badge award record (persisted in localStorage)
export interface BadgeAward {
  badgeId: string;
  awardedAt: string; // ISO date
  accountManagerEmail: string;
}

// Monthly target (persisted in localStorage)
export interface MonthlyTarget {
  accountManagerEmail: string;
  month: string; // 'YYYY-MM'
  targetBookings: number;
  targetConfirmed: number;
  targetLicenses: number;
  setBy: string; // Manager email
  setAt: string; // ISO date
}

// Default targets when none are set
export const DEFAULT_TARGETS = {
  targetBookings: 5,
  targetConfirmed: 3,
  targetLicenses: 500,
};

// Target progress calculation
export interface TargetProgress {
  bookings: { current: number; target: number; percentage: number };
  confirmed: { current: number; target: number; percentage: number };
  licenses: { current: number; target: number; percentage: number };
}

// Full AM gamification stats (calculated on-the-fly)
export interface AMGamificationStats {
  accountManagerEmail: string;
  accountManagerName: string;

  // Points
  totalPoints: number;
  rank: number; // 1-based ranking

  // Booking breakdown
  totalBookings: number;
  demoBookings: number;
  deploymentBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  premiumBookings: number;
  newClientBookings: number;
  fastConfirmations: number; // Confirmed < 3 days

  // Performance
  conversionRate: number;
  totalLicenses: number;
  avgLicensesPerBooking: number;

  // Streaks
  currentStreak: number; // consecutive weeks
  longestStreak: number;

  // Badges
  earnedBadgeIds: string[];
  newBadgeIds: string[]; // Newly earned this calculation cycle

  // Targets
  targetProgress?: TargetProgress;
}

// Leaderboard entry (subset of stats for display)
export interface LeaderboardEntry {
  rank: number;
  accountManagerName: string;
  accountManagerEmail: string;
  totalPoints: number;
  earnedBadgeCount: number;
  conversionRate: number;
  currentStreak: number;
  totalBookings: number;
  confirmedBookings: number;
}

// Team-wide stats summary
export interface TeamStats {
  totalPoints: number;
  averagePoints: number;
  averageConversion: number;
  totalBadgesAwarded: number;
  mostActiveAM: string;
  topStreakAM: string;
  topStreakWeeks: number;
  amCount: number;
}

// Points breakdown for a single booking
export interface BookingPointsBreakdown {
  base: number;
  confirmed: number;
  premium: number;
  speed: number;
  largeDeal: number;
  newClient: number;
  total: number;
}

// Points scoring constants
export const POINTS = {
  DEMO_BOOKING: 10,
  DEPLOYMENT_BOOKING: 20,
  CONFIRMED_BONUS: 50,
  PREMIUM_CLIENT_BONUS: 25,
  QUICK_CONFIRMATION_BONUS: 15, // < 3 days
  LARGE_DEAL_BONUS: 30, // 500+ licenses
  NEW_CLIENT_BONUS: 40,
  STREAK_WEEK_BONUS: 5, // per consecutive week
  QUICK_CONFIRMATION_DAYS: 3,
  LARGE_DEAL_THRESHOLD: 500,
};
