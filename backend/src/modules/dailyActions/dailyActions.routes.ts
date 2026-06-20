import { Router, Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "@/middleware/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { getDb } from "@/db/connection";
import { gamificationService } from "@/modules/gamification/gamification.service";

// ─── Action catalog ───────────────────────────────────────────────────────────

interface ActionTemplate {
  key: string;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedSavingGramsCO2: number;
}

const ACTION_CATALOG: ActionTemplate[] = [
  { key: "reusable_bottle", title: "Carry a reusable water bottle", description: "Avoid single-use plastic bottles throughout the day.", category: "waste", difficulty: "easy", estimatedSavingGramsCO2: 83 },
  { key: "switch_off_lights", title: "Switch off unused lights", description: "Turn off lights in every room you leave today.", category: "electricity", difficulty: "easy", estimatedSavingGramsCO2: 150 },
  { key: "meatless_meal", title: "Eat one meatless meal", description: "Choose a plant-based option for lunch or dinner.", category: "food", difficulty: "easy", estimatedSavingGramsCO2: 600 },
  { key: "short_shower", title: "Keep showers under 5 minutes", description: "A shorter shower saves water and the energy used to heat it.", category: "water", difficulty: "easy", estimatedSavingGramsCO2: 100 },
  { key: "walk_short_distance", title: "Walk or cycle for a short journey", description: "Any trip under 2 km is faster to walk or cycle than to find parking.", category: "transport", difficulty: "easy", estimatedSavingGramsCO2: 320 },
  { key: "unplug_chargers", title: "Unplug chargers and standby devices", description: "Standby devices can account for 10% of home electricity use.", category: "electricity", difficulty: "easy", estimatedSavingGramsCO2: 120 },
  { key: "use_transit", title: "Use public transport instead of driving", description: "Swap one car journey for bus, tram, or rail today.", category: "transport", difficulty: "medium", estimatedSavingGramsCO2: 1900 },
  { key: "compost_scraps", title: "Compost food scraps", description: "Divert organic waste from landfill, where it emits methane.", category: "waste", difficulty: "medium", estimatedSavingGramsCO2: 200 },
  { key: "cold_wash", title: "Wash laundry on a cold cycle", description: "90% of a washing machine's energy goes to heating water. Cold cycles work just as well.", category: "electricity", difficulty: "easy", estimatedSavingGramsCO2: 500 },
  { key: "buy_local", title: "Buy locally grown produce", description: "Local food cuts transport emissions and supports your regional economy.", category: "food", difficulty: "medium", estimatedSavingGramsCO2: 300 },
  { key: "no_single_use_plastic", title: "Avoid single-use plastic today", description: "Bring your own bag, cup, and utensils and refuse disposable packaging.", category: "waste", difficulty: "medium", estimatedSavingGramsCO2: 150 },
  { key: "digital_over_print", title: "Choose digital over printed documents", description: "Read digitally and avoid unnecessary printing.", category: "shopping", difficulty: "easy", estimatedSavingGramsCO2: 70 }
];

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Select 5 actions for the day, seeded by user ID and date for reproducibility */
function selectDailyActions(userId: number, dateStr: string, catalog = ACTION_CATALOG): ActionTemplate[] {
  const seed = userId * 100000 + parseInt(dateStr.replace(/-/g, ""), 10);
  const shuffled = [...catalog].sort((a, b) => {
    const ha = ((seed * 9301 + 49297) % 233280) / 233280;
    const hb = ((seed * 9302 + 49298) % 233281) / 233281;
    return ha - hb || a.key.localeCompare(b.key);
  });
  return shuffled.slice(0, 5);
}

// ─── Repository ───────────────────────────────────────────────────────────────

interface ActionLogRecord {
  id: number;
  user_id: number;
  action_key: string;
  title: string;
  category: string;
  action_date: string;
  completed: number;
  completed_at: string | null;
}

const actionLogRepo = {
  upsertDailyActions(userId: number, actions: ActionTemplate[], dateStr: string): void {
    const stmt = getDb().prepare(`
      INSERT OR IGNORE INTO daily_action_log (user_id, action_key, title, category, action_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const a of actions) {
      stmt.run(userId, a.key, a.title, a.category, dateStr);
    }
  },

  findByUserAndDate(userId: number, dateStr: string): ActionLogRecord[] {
    return getDb()
      .prepare("SELECT * FROM daily_action_log WHERE user_id = ? AND action_date = ?")
      .all(userId, dateStr) as unknown as ActionLogRecord[];
  },

  markComplete(userId: number, actionKey: string, dateStr: string): boolean {
    const result = getDb()
      .prepare(
        "UPDATE daily_action_log SET completed = 1, completed_at = datetime('now') WHERE user_id = ? AND action_key = ? AND action_date = ? AND completed = 0"
      )
      .run(userId, actionKey, dateStr);
    return result.changes > 0;
  },

  getTotalCompleted(userId: number): number {
    const row = getDb()
      .prepare("SELECT COUNT(*) as c FROM daily_action_log WHERE user_id = ? AND completed = 1")
      .get(userId) as { c: number };
    return row.c;
  }
};

// ─── Routes ───────────────────────────────────────────────────────────────────

const completeActionSchema = z.object({
  actionKey: z.string().min(1).max(100)
});

export const dailyActionsRouter = Router();
dailyActionsRouter.use(requireAuth);

/** GET /api/daily-actions/today - today's personalized action list */
dailyActionsRouter.get(
  "/today",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const today = getTodayString();
    const dailyActions = selectDailyActions(userId, today);
    actionLogRepo.upsertDailyActions(userId, dailyActions, today);

    const logged = actionLogRepo.findByUserAndDate(userId, today);
    const completedKeys = new Set(logged.filter((l) => l.completed).map((l) => l.action_key));

    const enriched = dailyActions.map((a) => {
      const catalog = ACTION_CATALOG.find((c) => c.key === a.key)!;
      return {
        key: a.key,
        title: a.title,
        description: a.description,
        category: a.category,
        difficulty: catalog.difficulty,
        estimatedSavingGramsCO2: catalog.estimatedSavingGramsCO2,
        completed: completedKeys.has(a.key)
      };
    });

    const totalCompleted = actionLogRepo.getTotalCompleted(userId);
    res.json({ date: today, actions: enriched, totalCompletedAllTime: totalCompleted });
  })
);

/** POST /api/daily-actions/complete - mark an action as done */
dailyActionsRouter.post(
  "/complete",
  validate(completeActionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { actionKey } = req.body as { actionKey: string };
    const today = getTodayString();
    const changed = actionLogRepo.markComplete(req.user!.id, actionKey, today);

    if (changed) {
      gamificationService.recordActivity(req.user!.id, gamificationService.POINTS.DAILY_ACTION_COMPLETED);
    }

    res.json({ success: true, alreadyCompleted: !changed });
  })
);
