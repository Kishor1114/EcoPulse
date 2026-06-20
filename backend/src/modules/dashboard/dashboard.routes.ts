import { Router, Request, Response } from "express";
import { asyncHandler } from "@/middleware/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import { getPreparedStatement } from "@/db/connection";
import { gamificationService } from "@/modules/gamification/gamification.service";
import { BENCHMARK_MONTHLY_KG_CO2E } from "@/modules/footprint/emissionFactors";
import { CategoryResult } from "@/modules/footprint/footprint.types";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

/** GET /api/dashboard - combined overview for the frontend dashboard */
dashboardRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // Latest footprint entry
    const latest = getPreparedStatement("SELECT * FROM footprint_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
      .get(userId) as
      | {
          id: number;
          total_monthly_kg: number;
          total_yearly_kg: number;
          breakdown_json: string;
          created_at: string;
        }
      | undefined;

    // Trend: last 6 entries for chart
    const trendRaw = getPreparedStatement(
        "SELECT total_monthly_kg, created_at FROM footprint_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 6"
      )
      .all(userId) as Array<{ total_monthly_kg: number; created_at: string }>;

    const trend = trendRaw.reverse().map((r) => ({
      date: r.created_at.slice(0, 10),
      monthlyKg: r.total_monthly_kg
    }));

    // Goals summary
    const activeGoals = (
      getPreparedStatement("SELECT COUNT(*) as c FROM goals WHERE user_id = ? AND status = 'active'")
        .get(userId) as { c: number }
    ).c;

    const completedGoals = (
      getPreparedStatement("SELECT COUNT(*) as c FROM goals WHERE user_id = ? AND status = 'completed'")
        .get(userId) as { c: number }
    ).c;

    // Today's action completion
    const today = new Date().toISOString().slice(0, 10);
    const completedToday = (
      getPreparedStatement(
          "SELECT COUNT(*) as c FROM daily_action_log WHERE user_id = ? AND action_date = ? AND completed = 1"
        )
        .get(userId, today) as { c: number }
    ).c;

    const gamification = gamificationService.getState(userId);

    const categories = latest ? (JSON.parse(latest.breakdown_json) as CategoryResult[]) : [];

    res.json({
      footprint: latest
        ? {
            totalMonthlyKg: latest.total_monthly_kg,
            totalYearlyKg: latest.total_yearly_kg,
            vsGlobalAverageMonthlyPercent: Math.round(
              ((latest.total_monthly_kg - BENCHMARK_MONTHLY_KG_CO2E) / BENCHMARK_MONTHLY_KG_CO2E) * 100
            ),
            benchmarkMonthlyKg: BENCHMARK_MONTHLY_KG_CO2E,
            categories,
            lastUpdated: latest.created_at
          }
        : null,
      trend,
      goals: { active: activeGoals, completed: completedGoals },
      todayActions: { completed: completedToday, total: 5 },
      gamification
    });
  })
);
