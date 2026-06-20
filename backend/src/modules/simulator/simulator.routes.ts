import { Router, Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "@/middleware/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { calculateFootprint } from "@/modules/footprint/carbonCalculator";
import { FootprintInput } from "@/modules/footprint/footprint.types";

const simulationSchema = z.object({
  scenario: z.enum([
    "switch_to_public_transit",
    "go_vegetarian",
    "go_vegan",
    "reduce_electricity_20pct",
    "switch_to_renewables",
    "reduce_car_50pct",
    "reduce_shopping_30pct",
    "increase_recycling"
  ]),
  currentInput: z.object({
    carKmPerWeek: z.number().min(0),
    publicKmPerWeek: z.number().min(0),
    shortFlightsPerYear: z.number().int().min(0),
    longFlightsPerYear: z.number().int().min(0),
    electricityKwhPerMonth: z.number().min(0),
    renewableSharePercent: z.number().min(0).max(100),
    waterLitersPerDay: z.number().min(0),
    dietType: z.enum(["meat_heavy", "average", "vegetarian", "vegan"]),
    foodWastePercent: z.number().min(0).max(100),
    wasteKgPerWeek: z.number().min(0),
    recyclingSharePercent: z.number().min(0).max(100),
    shoppingSpendPerMonth: z.number().min(0)
  })
});

type Scenario = z.infer<typeof simulationSchema>["scenario"];
type SimInput = z.infer<typeof simulationSchema>["currentInput"];

const SCENARIO_LABELS: Record<Scenario, { title: string; description: string }> = {
  switch_to_public_transit: {
    title: "Switch to public transport",
    description: "Move all current car travel to public transit"
  },
  go_vegetarian: {
    title: "Adopt a vegetarian diet",
    description: "Switch from your current diet to vegetarian"
  },
  go_vegan: {
    title: "Adopt a vegan diet",
    description: "Switch from your current diet to vegan"
  },
  reduce_electricity_20pct: {
    title: "Reduce electricity use by 20%",
    description: "Through efficiency improvements and habit change"
  },
  switch_to_renewables: {
    title: "Switch to renewable electricity",
    description: "Move to a 100% renewable energy tariff"
  },
  reduce_car_50pct: {
    title: "Halve car usage",
    description: "Replace 50% of current car km with walking, cycling, or transit"
  },
  reduce_shopping_30pct: {
    title: "Cut discretionary spending by 30%",
    description: "Buy less, buy second-hand, and repair instead of replace"
  },
  increase_recycling: {
    title: "Recycle 80% of waste",
    description: "Sort waste carefully and compost food scraps"
  }
};

function applyScenario(input: SimInput, scenario: Scenario): FootprintInput {
  const base: FootprintInput = { ...input };
  switch (scenario) {
    case "switch_to_public_transit":
      return { ...base, publicKmPerWeek: base.publicKmPerWeek + base.carKmPerWeek, carKmPerWeek: 0 };
    case "go_vegetarian":
      return { ...base, dietType: "vegetarian" };
    case "go_vegan":
      return { ...base, dietType: "vegan" };
    case "reduce_electricity_20pct":
      return { ...base, electricityKwhPerMonth: base.electricityKwhPerMonth * 0.8 };
    case "switch_to_renewables":
      return { ...base, renewableSharePercent: 100 };
    case "reduce_car_50pct":
      return {
        ...base,
        carKmPerWeek: base.carKmPerWeek * 0.5,
        publicKmPerWeek: base.publicKmPerWeek + base.carKmPerWeek * 0.5
      };
    case "reduce_shopping_30pct":
      return { ...base, shoppingSpendPerMonth: base.shoppingSpendPerMonth * 0.7 };
    case "increase_recycling":
      return { ...base, recyclingSharePercent: 80 };
    default:
      return base;
  }
}

export const simulatorRouter = Router();
simulatorRouter.use(requireAuth);

/** POST /api/simulator/run - compute what-if projection */
simulatorRouter.post(
  "/run",
  validate(simulationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { scenario, currentInput } = req.body as z.infer<typeof simulationSchema>;
    const modified = applyScenario(currentInput, scenario);

    const current = calculateFootprint(currentInput);
    const projected = calculateFootprint(modified);

    const monthlySavingKg = current.totalMonthlyKg - projected.totalMonthlyKg;
    const yearlySavingKg = monthlySavingKg * 12;
    const reductionPercent =
      current.totalMonthlyKg > 0
        ? Math.round((monthlySavingKg / current.totalMonthlyKg) * 100)
        : 0;

    res.json({
      scenario,
      ...SCENARIO_LABELS[scenario],
      current: {
        totalMonthlyKg: current.totalMonthlyKg,
        totalYearlyKg: current.totalYearlyKg
      },
      projected: {
        totalMonthlyKg: projected.totalMonthlyKg,
        totalYearlyKg: projected.totalYearlyKg
      },
      savings: {
        monthlySavingKg: Math.round(monthlySavingKg * 10) / 10,
        yearlySavingKg: Math.round(yearlySavingKg * 10) / 10,
        reductionPercent,
        treesEquivalent: Math.round(yearlySavingKg / 21) // ~21 kg CO₂ absorbed per tree per year
      }
    });
  })
);

/** GET /api/simulator/scenarios - list available scenarios */
simulatorRouter.get(
  "/scenarios",
  asyncHandler(async (_req: Request, res: Response) => {
    const list = (Object.keys(SCENARIO_LABELS) as Scenario[]).map((key) => ({
      key,
      ...SCENARIO_LABELS[key]
    }));
    res.json(list);
  })
);
