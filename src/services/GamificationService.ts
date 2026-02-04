import { Booking } from '../types/Booking';
import {
  AMGamificationStats,
  BadgeDefinition,
  BadgeAward,
  MonthlyTarget,
  TargetProgress,
  LeaderboardEntry,
  TeamStats,
  POINTS,
  DEFAULT_TARGETS,
} from '../types/Gamification';
import { differenceInDays, parseISO, getISOWeek, getISOWeekYear, format } from 'date-fns';

// ─── Badge Definitions ───────────────────────────────────────────────

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_booking',
    name: 'First Booking',
    icon: '\u{1F3AF}', // target
    description: 'Created your first booking',
    tier: 'bronze',
    unlockCriteria: '1+ booking',
  },
  {
    id: 'demo_10',
    name: 'Demo Enthusiast',
    icon: '\u{1F4CA}', // bar chart
    description: 'Booked 10 demos',
    tier: 'silver',
    unlockCriteria: '10+ demo bookings',
  },
  {
    id: 'demo_50',
    name: 'Demo Master',
    icon: '\u{1F3C6}', // trophy
    description: 'Booked 50 demos',
    tier: 'gold',
    unlockCriteria: '50+ demo bookings',
  },
  {
    id: 'premium_champion',
    name: 'Premium Champion',
    icon: '\u{2B50}', // star
    description: 'Booked 5 premium client sessions',
    tier: 'silver',
    unlockCriteria: '5+ premium client bookings',
  },
  {
    id: 'quick_closer',
    name: 'Quick Closer',
    icon: '\u{26A1}', // lightning
    description: '10 bookings confirmed within 3 days',
    tier: 'gold',
    unlockCriteria: '10+ fast confirmations (<3 days)',
  },
  {
    id: 'new_client_hunter',
    name: 'New Client Hunter',
    icon: '\u{1F3A3}', // fishing
    description: 'Brought in 5 new clients',
    tier: 'silver',
    unlockCriteria: '5+ unique new clients',
  },
  {
    id: 'conversion_king',
    name: 'Conversion King',
    icon: '\u{1F451}', // crown
    description: '80%+ conversion rate with at least 10 bookings',
    tier: 'platinum',
    unlockCriteria: '80%+ conversion (min 10 bookings)',
  },
  {
    id: 'license_tycoon',
    name: 'License Tycoon',
    icon: '\u{1F48E}', // gem
    description: 'Booked over 5,000 total licenses',
    tier: 'gold',
    unlockCriteria: '5,000+ total licenses',
  },
  {
    id: 'streak_warrior',
    name: 'Streak Warrior',
    icon: '\u{1F525}', // fire
    description: '4+ consecutive weeks with bookings',
    tier: 'gold',
    unlockCriteria: '4+ week streak',
  },
  {
    id: 'deployment_expert',
    name: 'Deployment Expert',
    icon: '\u{1F680}', // rocket
    description: 'Booked 10 deployments',
    tier: 'silver',
    unlockCriteria: '10+ deployment bookings',
  },
];

// ─── localStorage Keys ───────────────────────────────────────────────

const BADGE_AWARDS_KEY = 'lp_gamification_badge_awards';
const MONTHLY_TARGETS_KEY = 'lp_gamification_monthly_targets';

// ─── Service ─────────────────────────────────────────────────────────

class GamificationService {
  // ─── Points Calculation ──────────────────────────────────────────

  /**
   * Calculate total points for a set of bookings belonging to one AM.
   * Also returns counts needed for badge checking.
   */
  private calculatePointsAndCounts(
    amBookings: Booking[],
    allBookings: Booking[]
  ): {
    totalPoints: number;
    demoBookings: number;
    deploymentBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    premiumBookings: number;
    newClientBookings: number;
    fastConfirmations: number;
    totalLicenses: number;
  } {
    let totalPoints = 0;
    let demoBookings = 0;
    let deploymentBookings = 0;
    let confirmedBookings = 0;
    let cancelledBookings = 0;
    let premiumBookings = 0;
    let fastConfirmations = 0;
    let totalLicenses = 0;

    // Track unique clients for this AM to detect "new client" bookings
    const clientFirstBookingMap = this.getClientFirstBookingMap(allBookings);
    const amEmail = amBookings[0]?.AccountManagerEmail?.toLowerCase() || '';

    for (const booking of amBookings) {
      let points = 0;

      // Base type points
      if (booking.BookingType === 'Demo') {
        points += POINTS.DEMO_BOOKING;
        demoBookings++;
      } else {
        points += POINTS.DEPLOYMENT_BOOKING;
        deploymentBookings++;
      }

      // Confirmation bonus
      if (booking.Status === 'Confirmed') {
        points += POINTS.CONFIRMED_BONUS;
        confirmedBookings++;

        // Speed bonus
        if (booking.ConfirmedDateTime && booking.Created) {
          const days = differenceInDays(
            parseISO(booking.ConfirmedDateTime),
            parseISO(booking.Created)
          );
          if (days <= POINTS.QUICK_CONFIRMATION_DAYS) {
            points += POINTS.QUICK_CONFIRMATION_BONUS;
            fastConfirmations++;
          }
        }
      }

      if (booking.Status === 'Cancelled') {
        cancelledBookings++;
      }

      // Premium client bonus
      if (booking.IsPremiumClient) {
        points += POINTS.PREMIUM_CLIENT_BONUS;
        premiumBookings++;
      }

      // Large deal bonus
      if (booking.LicenseCount >= POINTS.LARGE_DEAL_THRESHOLD) {
        points += POINTS.LARGE_DEAL_BONUS;
      }

      // New client bonus: this AM's first booking for this client
      const clientKey = booking.ClientName?.toLowerCase() || '';
      const firstBooker = clientFirstBookingMap.get(clientKey);
      if (firstBooker === amEmail) {
        // Only count once per client - check if this is the earliest booking for this client by this AM
        const isFirstForClient = amBookings
          .filter((b) => b.ClientName?.toLowerCase() === clientKey)
          .sort((a, b) => new Date(a.Created).getTime() - new Date(b.Created).getTime())[0];
        if (isFirstForClient?.Id === booking.Id) {
          points += POINTS.NEW_CLIENT_BONUS;
        }
      }

      totalLicenses += booking.LicenseCount || 0;
      totalPoints += points;
    }

    // Count new client bookings (unique clients where this AM was first)
    const uniqueClients = new Set(amBookings.map((b) => b.ClientName?.toLowerCase()));
    let newClientBookings = 0;
    for (const client of uniqueClients) {
      if (client && clientFirstBookingMap.get(client) === amEmail) {
        newClientBookings++;
      }
    }

    return {
      totalPoints,
      demoBookings,
      deploymentBookings,
      confirmedBookings,
      cancelledBookings,
      premiumBookings,
      newClientBookings,
      fastConfirmations,
      totalLicenses,
    };
  }

  /**
   * Build a map of clientName -> first AM email who booked them.
   */
  private getClientFirstBookingMap(allBookings: Booking[]): Map<string, string> {
    const map = new Map<string, string>();
    const sorted = [...allBookings].sort(
      (a, b) => new Date(a.Created).getTime() - new Date(b.Created).getTime()
    );
    for (const booking of sorted) {
      const clientKey = booking.ClientName?.toLowerCase() || '';
      if (!map.has(clientKey)) {
        map.set(clientKey, booking.AccountManagerEmail?.toLowerCase() || '');
      }
    }
    return map;
  }

  // ─── Streak Calculation ──────────────────────────────────────────

  /**
   * Calculate consecutive week streaks for an AM's bookings.
   */
  private calculateStreaks(amBookings: Booking[]): { current: number; longest: number } {
    if (amBookings.length === 0) return { current: 0, longest: 0 };

    // Get unique weeks that have bookings (year-week pairs)
    const weekSet = new Set<string>();
    for (const booking of amBookings) {
      if (!booking.Created) continue;
      const date = parseISO(booking.Created);
      const year = getISOWeekYear(date);
      const week = getISOWeek(date);
      weekSet.add(`${year}-${String(week).padStart(2, '0')}`);
    }

    // Sort weeks chronologically
    const sortedWeeks = Array.from(weekSet).sort();
    if (sortedWeeks.length === 0) return { current: 0, longest: 0 };

    // Calculate consecutive streaks
    let longestStreak = 1;
    let currentRun = 1;

    for (let i = 1; i < sortedWeeks.length; i++) {
      const prev = this.parseYearWeek(sortedWeeks[i - 1]);
      const curr = this.parseYearWeek(sortedWeeks[i]);

      if (this.isConsecutiveWeek(prev, curr)) {
        currentRun++;
        longestStreak = Math.max(longestStreak, currentRun);
      } else {
        currentRun = 1;
      }
    }

    // Check if the current streak includes the current week
    const now = new Date();
    const currentYearWeek = `${getISOWeekYear(now)}-${String(getISOWeek(now)).padStart(2, '0')}`;
    const lastWeekDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastYearWeek = `${getISOWeekYear(lastWeekDate)}-${String(getISOWeek(lastWeekDate)).padStart(2, '0')}`;

    // Current streak: count back from current/last week
    let currentStreak = 0;
    const lastBookingWeek = sortedWeeks[sortedWeeks.length - 1];
    if (lastBookingWeek === currentYearWeek || lastBookingWeek === lastYearWeek) {
      currentStreak = 1;
      for (let i = sortedWeeks.length - 2; i >= 0; i--) {
        const curr = this.parseYearWeek(sortedWeeks[i + 1]);
        const prev = this.parseYearWeek(sortedWeeks[i]);
        if (this.isConsecutiveWeek(prev, curr)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return { current: currentStreak, longest: Math.max(longestStreak, currentStreak) };
  }

  private parseYearWeek(yearWeek: string): { year: number; week: number } {
    const [year, week] = yearWeek.split('-').map(Number);
    return { year, week };
  }

  private isConsecutiveWeek(
    prev: { year: number; week: number },
    curr: { year: number; week: number }
  ): boolean {
    if (prev.year === curr.year) {
      return curr.week === prev.week + 1;
    }
    // Year boundary: last week of prev year to first week of next year
    if (curr.year === prev.year + 1 && curr.week === 1) {
      // ISO weeks can be 52 or 53
      return prev.week >= 52;
    }
    return false;
  }

  // ─── Badge Checking ──────────────────────────────────────────────

  /**
   * Check which badges are earned based on stats.
   */
  private checkEarnedBadges(stats: {
    totalBookings: number;
    demoBookings: number;
    deploymentBookings: number;
    confirmedBookings: number;
    premiumBookings: number;
    fastConfirmations: number;
    newClientBookings: number;
    conversionRate: number;
    totalLicenses: number;
    currentStreak: number;
  }): string[] {
    const earned: string[] = [];

    if (stats.totalBookings >= 1) earned.push('first_booking');
    if (stats.demoBookings >= 10) earned.push('demo_10');
    if (stats.demoBookings >= 50) earned.push('demo_50');
    if (stats.premiumBookings >= 5) earned.push('premium_champion');
    if (stats.fastConfirmations >= 10) earned.push('quick_closer');
    if (stats.newClientBookings >= 5) earned.push('new_client_hunter');
    if (stats.conversionRate >= 80 && stats.totalBookings >= 10) earned.push('conversion_king');
    if (stats.totalLicenses >= 5000) earned.push('license_tycoon');
    if (stats.currentStreak >= 4) earned.push('streak_warrior');
    if (stats.deploymentBookings >= 10) earned.push('deployment_expert');

    return earned;
  }

  // ─── Public API ──────────────────────────────────────────────────

  /**
   * Calculate full gamification stats for one AM.
   */
  calculateAMStats(
    amEmail: string,
    allBookings: Booking[],
    currentMonth?: string // 'YYYY-MM', defaults to current month
  ): AMGamificationStats {
    const email = amEmail.toLowerCase();
    const amBookings = allBookings.filter(
      (b) => b.AccountManagerEmail?.toLowerCase() === email
    );

    if (amBookings.length === 0) {
      return this.emptyStats(amEmail, '');
    }

    const amName = amBookings[0].AccountManagerName || amEmail;
    const counts = this.calculatePointsAndCounts(amBookings, allBookings);
    const streaks = this.calculateStreaks(amBookings);

    // Add streak bonus to points
    const streakBonus = streaks.current * POINTS.STREAK_WEEK_BONUS;
    const totalPoints = counts.totalPoints + streakBonus;

    const totalBookings = amBookings.length;
    const activeDenominator = totalBookings - counts.cancelledBookings || 1;
    const conversionRate =
      totalBookings > 0
        ? Math.round((counts.confirmedBookings / activeDenominator) * 100)
        : 0;

    const avgLicenses =
      totalBookings > 0
        ? Math.round(counts.totalLicenses / totalBookings)
        : 0;

    // Badge checking
    const earnedBadgeIds = this.checkEarnedBadges({
      ...counts,
      totalBookings,
      conversionRate,
      currentStreak: streaks.current,
    });

    // Detect newly earned badges
    const previousAwards = this.getBadgeAwards(email);
    const previousBadgeIds = new Set(previousAwards.map((a) => a.badgeId));
    const newBadgeIds = earnedBadgeIds.filter((id) => !previousBadgeIds.has(id));

    // Auto-award new badges
    for (const badgeId of newBadgeIds) {
      this.awardBadge(email, badgeId);
    }

    // Monthly target progress
    const month = currentMonth || format(new Date(), 'yyyy-MM');
    const targetProgress = this.calculateTargetProgress(email, amBookings, month);

    return {
      accountManagerEmail: email,
      accountManagerName: amName,
      totalPoints,
      rank: 0, // Set by calculateLeaderboard
      totalBookings: amBookings.length,
      demoBookings: counts.demoBookings,
      deploymentBookings: counts.deploymentBookings,
      confirmedBookings: counts.confirmedBookings,
      cancelledBookings: counts.cancelledBookings,
      premiumBookings: counts.premiumBookings,
      newClientBookings: counts.newClientBookings,
      fastConfirmations: counts.fastConfirmations,
      conversionRate,
      totalLicenses: counts.totalLicenses,
      avgLicensesPerBooking: avgLicenses,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      earnedBadgeIds,
      newBadgeIds,
      targetProgress,
    };
  }

  /**
   * Calculate leaderboard with rankings for all AMs.
   */
  calculateLeaderboard(allBookings: Booking[]): LeaderboardEntry[] {
    // Group bookings by AM email
    const amMap = new Map<string, Booking[]>();
    for (const booking of allBookings) {
      const email = booking.AccountManagerEmail?.toLowerCase();
      if (!email) continue;
      if (!amMap.has(email)) amMap.set(email, []);
      amMap.get(email)!.push(booking);
    }

    // Calculate stats for each AM
    const entries: LeaderboardEntry[] = [];
    for (const [email] of amMap) {
      const stats = this.calculateAMStats(email, allBookings);
      entries.push({
        rank: 0,
        accountManagerName: stats.accountManagerName,
        accountManagerEmail: stats.accountManagerEmail,
        totalPoints: stats.totalPoints,
        earnedBadgeCount: stats.earnedBadgeIds.length,
        conversionRate: stats.conversionRate,
        currentStreak: stats.currentStreak,
        totalBookings: stats.totalBookings,
        confirmedBookings: stats.confirmedBookings,
      });
    }

    // Sort by points descending, assign ranks
    entries.sort((a, b) => b.totalPoints - a.totalPoints);
    entries.forEach((entry, i) => {
      entry.rank = i + 1;
    });

    return entries;
  }

  /**
   * Calculate team-wide summary stats.
   */
  calculateTeamStats(allBookings: Booking[]): TeamStats {
    const leaderboard = this.calculateLeaderboard(allBookings);

    if (leaderboard.length === 0) {
      return {
        totalPoints: 0,
        averagePoints: 0,
        averageConversion: 0,
        totalBadgesAwarded: 0,
        mostActiveAM: '-',
        topStreakAM: '-',
        topStreakWeeks: 0,
        amCount: 0,
      };
    }

    const totalPoints = leaderboard.reduce((sum, e) => sum + e.totalPoints, 0);
    const totalConversion = leaderboard.reduce((sum, e) => sum + e.conversionRate, 0);
    const totalBadges = leaderboard.reduce((sum, e) => sum + e.earnedBadgeCount, 0);

    const mostActive = leaderboard[0]; // Already sorted by points
    const topStreak = [...leaderboard].sort((a, b) => b.currentStreak - a.currentStreak)[0];

    return {
      totalPoints,
      averagePoints: Math.round(totalPoints / leaderboard.length),
      averageConversion: Math.round(totalConversion / leaderboard.length),
      totalBadgesAwarded: totalBadges,
      mostActiveAM: mostActive.accountManagerName,
      topStreakAM: topStreak.accountManagerName,
      topStreakWeeks: topStreak.currentStreak,
      amCount: leaderboard.length,
    };
  }

  // ─── Target Management (localStorage) ────────────────────────────

  getMonthlyTarget(email: string, month: string): MonthlyTarget | null {
    const targets = this.getAllTargets();
    return (
      targets.find(
        (t) => t.accountManagerEmail.toLowerCase() === email.toLowerCase() && t.month === month
      ) || null
    );
  }

  setMonthlyTarget(target: MonthlyTarget): void {
    const targets = this.getAllTargets();
    const idx = targets.findIndex(
      (t) =>
        t.accountManagerEmail.toLowerCase() === target.accountManagerEmail.toLowerCase() &&
        t.month === target.month
    );
    if (idx >= 0) {
      targets[idx] = target;
    } else {
      targets.push(target);
    }
    localStorage.setItem(MONTHLY_TARGETS_KEY, JSON.stringify(targets));
  }

  private getAllTargets(): MonthlyTarget[] {
    try {
      const raw = localStorage.getItem(MONTHLY_TARGETS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private calculateTargetProgress(
    email: string,
    amBookings: Booking[],
    month: string
  ): TargetProgress {
    const target = this.getMonthlyTarget(email, month) || {
      targetBookings: DEFAULT_TARGETS.targetBookings,
      targetConfirmed: DEFAULT_TARGETS.targetConfirmed,
      targetLicenses: DEFAULT_TARGETS.targetLicenses,
    };

    // Filter bookings to the target month
    const monthBookings = amBookings.filter((b) => {
      if (!b.Created) return false;
      return format(parseISO(b.Created), 'yyyy-MM') === month;
    });

    const currentBookings = monthBookings.length;
    const currentConfirmed = monthBookings.filter((b) => b.Status === 'Confirmed').length;
    const currentLicenses = monthBookings.reduce((sum, b) => sum + (b.LicenseCount || 0), 0);

    const pct = (current: number, tgt: number) =>
      tgt > 0 ? Math.min(100, Math.round((current / tgt) * 100)) : 0;

    return {
      bookings: {
        current: currentBookings,
        target: target.targetBookings,
        percentage: pct(currentBookings, target.targetBookings),
      },
      confirmed: {
        current: currentConfirmed,
        target: target.targetConfirmed,
        percentage: pct(currentConfirmed, target.targetConfirmed),
      },
      licenses: {
        current: currentLicenses,
        target: target.targetLicenses,
        percentage: pct(currentLicenses, target.targetLicenses),
      },
    };
  }

  // ─── Badge Persistence (localStorage) ────────────────────────────

  getBadgeAwards(email: string): BadgeAward[] {
    const all = this.getAllBadgeAwards();
    return all.filter((a) => a.accountManagerEmail.toLowerCase() === email.toLowerCase());
  }

  awardBadge(email: string, badgeId: string): void {
    const all = this.getAllBadgeAwards();
    const exists = all.some(
      (a) =>
        a.accountManagerEmail.toLowerCase() === email.toLowerCase() && a.badgeId === badgeId
    );
    if (!exists) {
      all.push({
        badgeId,
        awardedAt: new Date().toISOString(),
        accountManagerEmail: email.toLowerCase(),
      });
      localStorage.setItem(BADGE_AWARDS_KEY, JSON.stringify(all));
    }
  }

  private getAllBadgeAwards(): BadgeAward[] {
    try {
      const raw = localStorage.getItem(BADGE_AWARDS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────

  private emptyStats(email: string, name: string): AMGamificationStats {
    return {
      accountManagerEmail: email,
      accountManagerName: name || email,
      totalPoints: 0,
      rank: 0,
      totalBookings: 0,
      demoBookings: 0,
      deploymentBookings: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      premiumBookings: 0,
      newClientBookings: 0,
      fastConfirmations: 0,
      conversionRate: 0,
      totalLicenses: 0,
      avgLicensesPerBooking: 0,
      currentStreak: 0,
      longestStreak: 0,
      earnedBadgeIds: [],
      newBadgeIds: [],
      targetProgress: {
        bookings: { current: 0, target: DEFAULT_TARGETS.targetBookings, percentage: 0 },
        confirmed: { current: 0, target: DEFAULT_TARGETS.targetConfirmed, percentage: 0 },
        licenses: { current: 0, target: DEFAULT_TARGETS.targetLicenses, percentage: 0 },
      },
    };
  }

  /**
   * Get badge definition by ID.
   */
  getBadgeDefinition(badgeId: string): BadgeDefinition | undefined {
    return BADGE_DEFINITIONS.find((b) => b.id === badgeId);
  }
}

export const gamificationService = new GamificationService();
