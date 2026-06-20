import { z } from "zod";
import { DIET_TYPES } from "./emissionFactors";

const percent = z.coerce.number().min(0, "Must be 0 or more").max(100, "Must be 100 or less");
const nonNegative = z.coerce.number().min(0, "Must be 0 or more").max(100000, "Value is unrealistically large");

export const footprintInputSchema = z.object({
  carKmPerWeek: nonNegative,
  publicKmPerWeek: nonNegative,
  shortFlightsPerYear: z.coerce.number().int().min(0).max(200),
  longFlightsPerYear: z.coerce.number().int().min(0).max(200),
  electricityKwhPerMonth: nonNegative,
  renewableSharePercent: percent,
  waterLitersPerDay: nonNegative,
  dietType: z.enum(DIET_TYPES as [string, ...string[]]),
  foodWastePercent: percent,
  wasteKgPerWeek: nonNegative,
  recyclingSharePercent: percent,
  shoppingSpendPerMonth: nonNegative
});

export type FootprintInputDto = z.infer<typeof footprintInputSchema>;

export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(12),
  offset: z.coerce.number().int().min(0).default(0)
});
