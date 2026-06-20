// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ── Footprint ─────────────────────────────────────────────────────────────────
export type DietType = "meat_heavy" | "average" | "vegetarian" | "vegan";
export type FootprintCategory =
  | "transport"
  | "electricity"
  | "water"
  | "food"
  | "waste"
  | "shopping";

export interface FootprintInput {
  carKmPerWeek: number;
  publicKmPerWeek: number;
  shortFlightsPerYear: number;
  longFlightsPerYear: number;
  electricityKwhPerMonth: number;
  renewableSharePercent: number;
  waterLitersPerDay: number;
  dietType: DietType;
  foodWastePercent: number;
  wasteKgPerWeek: number;
  recyclingSharePercent: number;
  shoppingSpendPerMonth: number;
}

export interface CategoryResult {
  category: FootprintCategory;
  monthlyKg: number;
  percentOfTotal: number;
}

export interface FootprintResult {
  categories: CategoryResult[];
  totalMonthlyKg: number;
  totalYearlyKg: number;
  vsGlobalAverageMonthlyPercent: number;
}

export interface HistoryItem {
  id: number;
  totalMonthlyKg: number;
  totalYearlyKg: number;
  categories: CategoryResult[];
  createdAt: string;
}

export interface LatestFootprint extends FootprintResult {
  id: number;
  createdAt: string;
  input: FootprintInput;
}

// ── Coach ─────────────────────────────────────────────────────────────────────
export interface Recommendation {
  id: string;
  category: FootprintCategory;
  title: string;
  description: string;
  impactLabel: "High" | "Medium" | "Low";
  estimatedMonthlySavingKg: number;
  actionSteps: string[];
  reasoning: string;
}

export interface CoachReport {
  summary: string;
  highestEmissionCategory: FootprintCategory;
  recommendations: Recommendation[];
  priorityFocus: string;
}

// ── Goals ─────────────────────────────────────────────────────────────────────
export type GoalType = "reduce_percent" | "weekly_frequency" | "absolute_target";
export type GoalStatus = "active" | "completed" | "abandoned";
export type GoalCategory =
  | "transport"
  | "electricity"
  | "water"
  | "food"
  | "waste"
  | "shopping"
  | "general";

export interface Goal {
  id: number;
  user_id: number;
  title: string;
  category: GoalCategory;
  goal_type: GoalType;
  target_value: number;
  baseline_value: number;
  current_value: number;
  unit: string;
  status: GoalStatus;
  start_date: string;
  target_date: string | null;
  created_at: string;
  updated_at: string;
  progressPercent: number;
}

export interface CreateGoalInput {
  title: string;
  category: GoalCategory;
  goalType: GoalType;
  targetValue: number;
  baselineValue?: number;
  unit: string;
  targetDate?: string;
}

// ── Daily Actions ─────────────────────────────────────────────────────────────
export interface DailyAction {
  key: string;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedSavingGramsCO2: number;
  completed: boolean;
}

export interface DailyActionsResponse {
  date: string;
  actions: DailyAction[];
  totalCompletedAllTime: number;
}

// ── Simulator ─────────────────────────────────────────────────────────────────
export type ScenarioKey =
  | "switch_to_public_transit"
  | "go_vegetarian"
  | "go_vegan"
  | "reduce_electricity_20pct"
  | "switch_to_renewables"
  | "reduce_car_50pct"
  | "reduce_shopping_30pct"
  | "increase_recycling";

export interface SimulatorResult {
  scenario: ScenarioKey;
  title: string;
  description: string;
  current: { totalMonthlyKg: number; totalYearlyKg: number };
  projected: { totalMonthlyKg: number; totalYearlyKg: number };
  savings: {
    monthlySavingKg: number;
    yearlySavingKg: number;
    reductionPercent: number;
    treesEquivalent: number;
  };
}

// ── Gamification ──────────────────────────────────────────────────────────────
export interface Badge {
  key: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface GamificationState {
  points: number;
  streakCount: number;
  lastActiveDate: string | null;
  badges: Badge[];
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface TrendPoint {
  date: string;
  monthlyKg: number;
}

export interface DashboardData {
  footprint: (FootprintResult & {
    benchmarkMonthlyKg: number;
    lastUpdated: string;
  }) | null;
  trend: TrendPoint[];
  goals: { active: number; completed: number };
  todayActions: { completed: number; total: number };
  gamification: GamificationState;
}
