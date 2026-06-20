export interface GamificationSignals {
  footprintEntryCount: number;
  latestMonthlyKg: number | null;
  streakCount: number;
  goalsCompletedCount: number;
  dailyActionsCompletedCount: number;
}

export interface BadgeDefinition {
  key: string;
  title: string;
  description: string;
  check: (signals: GamificationSignals) => boolean;
}

/**
 * Achievement catalog. Each badge is a pure predicate over the user's
 * current signals, which keeps unlocking logic declarative and easy to
 * extend without touching the engine that evaluates them.
 */
export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    key: "first_calculation",
    title: "First Measurement",
    description: "Logged your first carbon footprint calculation.",
    check: (s) => s.footprintEntryCount >= 1
  },
  {
    key: "consistent_tracker",
    title: "Consistent Tracker",
    description: "Logged 5 separate footprint calculations.",
    check: (s) => s.footprintEntryCount >= 5
  },
  {
    key: "three_day_streak",
    title: "Momentum Builder",
    description: "Stayed active for 3 days in a row.",
    check: (s) => s.streakCount >= 3
  },
  {
    key: "seven_day_streak",
    title: "Week-Long Habit",
    description: "Stayed active for 7 days in a row.",
    check: (s) => s.streakCount >= 7
  },
  {
    key: "low_carbon_hero",
    title: "Low-Carbon Hero",
    description: "Recorded a monthly footprint below the global average.",
    check: (s) => s.latestMonthlyKg !== null && s.latestMonthlyKg < 833
  },
  {
    key: "goal_crusher",
    title: "Goal Crusher",
    description: "Completed your first reduction goal.",
    check: (s) => s.goalsCompletedCount >= 1
  },
  {
    key: "everyday_action_hero",
    title: "Everyday Action Hero",
    description: "Completed 10 daily green actions.",
    check: (s) => s.dailyActionsCompletedCount >= 10
  }
];

export const POINTS = {
  FOOTPRINT_LOGGED: 15,
  DAILY_ACTION_COMPLETED: 5,
  GOAL_COMPLETED: 50,
  GOAL_CREATED: 5
} as const;
