import { Router, Request, Response } from "express";
import { asyncHandler } from "@/middleware/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { footprintService } from "./footprint.service";
import { footprintInputSchema, historyQuerySchema, FootprintInputDto } from "./footprint.validation";
import { FootprintInput } from "./footprint.types";

function dtoToInput(dto: FootprintInputDto): FootprintInput {
  return {
    carKmPerWeek: dto.carKmPerWeek,
    publicKmPerWeek: dto.publicKmPerWeek,
    shortFlightsPerYear: dto.shortFlightsPerYear,
    longFlightsPerYear: dto.longFlightsPerYear,
    electricityKwhPerMonth: dto.electricityKwhPerMonth,
    renewableSharePercent: dto.renewableSharePercent,
    waterLitersPerDay: dto.waterLitersPerDay,
    dietType: dto.dietType as FootprintInput["dietType"],
    foodWastePercent: dto.foodWastePercent,
    wasteKgPerWeek: dto.wasteKgPerWeek,
    recyclingSharePercent: dto.recyclingSharePercent,
    shoppingSpendPerMonth: dto.shoppingSpendPerMonth
  };
}

export const footprintRouter = Router();

footprintRouter.use(requireAuth);

/** POST /api/footprint - submit a new footprint calculation */
footprintRouter.post(
  "/",
  validate(footprintInputSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const input = dtoToInput(req.body as FootprintInputDto);
    const result = footprintService.calculate(userId, input);
    res.status(201).json(result);
  })
);

/** GET /api/footprint/latest - most recent calculation for the logged-in user */
footprintRouter.get(
  "/latest",
  asyncHandler(async (req: Request, res: Response) => {
    const result = footprintService.getLatest(req.user!.id);
    res.json(result ?? null);
  })
);

/** GET /api/footprint/history?limit&offset - paginated history */
footprintRouter.get(
  "/history",
  validate(historyQuerySchema, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const { limit, offset } = req.query as unknown as { limit: number; offset: number };
    const data = footprintService.getHistory(req.user!.id, limit, offset);
    res.json(data);
  })
);
