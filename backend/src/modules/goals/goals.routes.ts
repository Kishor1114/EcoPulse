import { Router, Request, Response } from "express";
import { asyncHandler } from "@/middleware/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { NotFoundError, ForbiddenError } from "@/middleware/errors";
import { getDb } from "@/db/connection";
import { gamificationService } from "@/modules/gamification/gamification.service";
import { CreateGoalInput, UpdateGoalProgressInput, createGoalSchema, updateGoalProgressSchema } from "./goals.validation";

// ─── Repository ──────────────────────────────────────────────────────────────

interface GoalRecord {
  id: number;
  user_id: number;
  title: string;
  category: string;
  goal_type: string;
  target_value: number;
  baseline_value: number;
  current_value: number;
  unit: string;
  status: string;
  start_date: string;
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

const goalsRepo = {
  create(userId: number, input: CreateGoalInput): GoalRecord {
    const db = getDb();
    const result = db
      .prepare(`INSERT INTO goals (user_id, title, category, goal_type, target_value, baseline_value, current_value, unit, target_date)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        userId,
        input.title,
        input.category,
        input.goalType,
        input.targetValue,
        input.baselineValue,
        input.baselineValue, // current_value starts equal to baseline: zero progress, not a false 100%
        input.unit,
        input.targetDate ?? null
      );
    return db.prepare("SELECT * FROM goals WHERE id = ?").get(result.lastInsertRowid) as unknown as GoalRecord;
  },

  findById(id: number): GoalRecord | undefined {
    return getDb().prepare("SELECT * FROM goals WHERE id = ?").get(id) as unknown as GoalRecord | undefined;
  },

  findByUser(userId: number, status?: string): GoalRecord[] {
    if (status) {
      return getDb()
        .prepare("SELECT * FROM goals WHERE user_id = ? AND status = ? ORDER BY created_at DESC")
        .all(userId, status) as unknown as GoalRecord[];
    }
    return getDb()
      .prepare("SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId) as unknown as GoalRecord[];
  },

  updateProgress(id: number, currentValue: number, status: string): void {
    getDb()
      .prepare("UPDATE goals SET current_value = ?, status = ?, updated_at = datetime('now') WHERE id = ?")
      .run(currentValue, status, id);
  },

  delete(id: number): void {
    getDb().prepare("DELETE FROM goals WHERE id = ?").run(id);
  }
};

// ─── Service ─────────────────────────────────────────────────────────────────

function computeStatus(goal: GoalRecord, newValue: number): "active" | "completed" {
  if (goal.goal_type === "reduce_percent") {
    const targetValue = goal.baseline_value * (1 - goal.target_value / 100);
    return newValue <= targetValue ? "completed" : "active";
  }
  return newValue >= goal.target_value ? "completed" : "active";
}

function computeProgressPercent(goal: GoalRecord): number {
  if (goal.goal_type === "reduce_percent") {
    const totalReductionNeeded = goal.baseline_value * (goal.target_value / 100);
    const achieved = goal.baseline_value - goal.current_value;
    if (totalReductionNeeded <= 0) return 100;
    return Math.min(Math.round((achieved / totalReductionNeeded) * 100), 100);
  }
  if (goal.target_value <= 0) return 100;
  return Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100);
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export const goalsRouter = Router();
goalsRouter.use(requireAuth);

goalsRouter.post(
  "/",
  validate(createGoalSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const goal = goalsRepo.create(req.user!.id, req.body as CreateGoalInput);
    gamificationService.recordActivity(req.user!.id, gamificationService.POINTS.GOAL_CREATED);
    res.status(201).json({ ...goal, progressPercent: computeProgressPercent(goal) });
  })
);

goalsRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const goals = goalsRepo.findByUser(req.user!.id, status);
    res.json(goals.map((g) => ({ ...g, progressPercent: computeProgressPercent(g) })));
  })
);

goalsRouter.patch(
  "/:id/progress",
  validate(updateGoalProgressSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const goal = goalsRepo.findById(Number(req.params.id));
    if (!goal) throw new NotFoundError("Goal not found");
    if (goal.user_id !== req.user!.id) throw new ForbiddenError();

    const { currentValue } = req.body as unknown as UpdateGoalProgressInput;
    const newStatus = computeStatus(goal, currentValue);
    goalsRepo.updateProgress(goal.id, currentValue, newStatus);

    if (newStatus === "completed" && goal.status !== "completed") {
      gamificationService.recordActivity(req.user!.id, gamificationService.POINTS.GOAL_COMPLETED);
    }

    const updated = goalsRepo.findById(goal.id)!;
    res.json({ ...updated, progressPercent: computeProgressPercent(updated) });
  })
);

goalsRouter.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const goal = goalsRepo.findById(Number(req.params.id));
    if (!goal) throw new NotFoundError("Goal not found");
    if (goal.user_id !== req.user!.id) throw new ForbiddenError();
    goalsRepo.delete(goal.id);
    res.status(204).send();
  })
);
