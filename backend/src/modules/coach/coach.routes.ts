import { Router, Request, Response } from "express";
import { asyncHandler } from "@/middleware/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import { NotFoundError } from "@/middleware/errors";
import { footprintRepository } from "@/modules/footprint/footprint.repository";
import { CategoryResult } from "@/modules/footprint/footprint.types";
import { generateCoachReport } from "./coach.engine";

export const coachRouter = Router();
coachRouter.use(requireAuth);

/** GET /api/coach/recommendations - AI coaching report based on latest footprint */
coachRouter.get(
  "/recommendations",
  asyncHandler(async (req: Request, res: Response) => {
    const latest = footprintRepository.findLatestByUser(req.user!.id);
    if (!latest) {
      throw new NotFoundError(
        "No footprint data found. Please complete a carbon footprint calculation first."
      );
    }

    const categories = JSON.parse(latest.breakdown_json) as CategoryResult[];
    const report = generateCoachReport(
      categories,
      latest.diet_type,
      latest.recycling_share_pct,
      latest.total_monthly_kg
    );

    res.json(report);
  })
);
