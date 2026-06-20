import { getDb } from "@/db/connection";
import { gamificationRepository } from "./gamification.repository";
import { BADGE_CATALOG, GamificationSignals, POINTS } from "./gamification.types";

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function computeNewStreak(lastActiveDate: string | null, currentStreak: number): number {
  const today = getTodayString();
  if (!lastActiveDate) return 1;

  const lastDate = new Date(lastActiveDate);
  const todayDate = new Date(today);
  const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return currentStreak; // already updated today
  if (diffDays === 1) return currentStreak + 1; // consecutive day
  return 1; // gap — reset streak
}

function getSignals(userId: number): GamificationSignals {
  const db = getDb();

  const entryCount = (
    db.prepare("SELECT COUNT(*) as c FROM footprint_entries WHERE user_id = ?").get(userId) as { c: number }
  ).c;

  const latestEntry = db
    .prepare("SELECT total_monthly_kg FROM footprint_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(userId) as { total_monthly_kg: number } | undefined;

  const state = gamificationRepository.findOrCreate(userId);

  const completedGoals = (
    db.prepare("SELECT COUNT(*) as c FROM goals WHERE user_id = ? AND status = 'completed'").get(userId) as {
      c: number;
    }
  ).c;

  const completedActions = (
    db
      .prepare("SELECT COUNT(*) as c FROM daily_action_log WHERE user_id = ? AND completed = 1")
      .get(userId) as { c: number }
  ).c;

  return {
    footprintEntryCount: entryCount,
    latestMonthlyKg: latestEntry?.total_monthly_kg ?? null,
    streakCount: state.streak_count,
    goalsCompletedCount: completedGoals,
    dailyActionsCompletedCount: completedActions
  };
}

export const gamificationService = {
  /** Called after any user interaction to refresh streak, points, and badge eligibility. */
  recordActivity(userId: number, pointsDelta: number): void {
    const state = gamificationRepository.findOrCreate(userId);
    const newStreak = computeNewStreak(state.last_active_date, state.streak_count);
    gamificationRepository.updateStreak(userId, newStreak, getTodayString());
    gamificationRepository.addPoints(userId, pointsDelta);
    this.evaluateBadges(userId);
  },

  evaluateBadges(userId: number): string[] {
    const state = gamificationRepository.findOrCreate(userId);
    const signals = getSignals(userId);
    const existing: string[] = JSON.parse(state.badges_json || "[]");
    const existingSet = new Set(existing);
    const newlyUnlocked: string[] = [];

    for (const badge of BADGE_CATALOG) {
      if (!existingSet.has(badge.key) && badge.check(signals)) {
        existingSet.add(badge.key);
        newlyUnlocked.push(badge.key);
      }
    }

    if (newlyUnlocked.length > 0) {
      gamificationRepository.updateBadges(userId, JSON.stringify(Array.from(existingSet)));
    }

    return newlyUnlocked;
  },

  getState(userId: number) {
    const state = gamificationRepository.findOrCreate(userId);
    const badges: string[] = JSON.parse(state.badges_json || "[]");
    const unlockedSet = new Set(badges);

    return {
      points: state.points,
      streakCount: state.streak_count,
      lastActiveDate: state.last_active_date,
      badges: BADGE_CATALOG.map((b) => ({
        ...b,
        check: undefined,
        unlocked: unlockedSet.has(b.key)
      }))
    };
  },

  POINTS
};
