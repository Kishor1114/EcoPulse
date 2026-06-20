import { gamificationService } from "@/modules/gamification/gamification.service";
import { calculateFootprint } from "./carbonCalculator";
import { footprintRepository, FootprintEntryRecord } from "./footprint.repository";
import { FootprintInput, FootprintResult } from "./footprint.types";
import { CategoryResult } from "./footprint.types";

export interface HistoryItem {
  id: number;
  totalMonthlyKg: number;
  totalYearlyKg: number;
  categories: CategoryResult[];
  createdAt: string;
}

function recordToInput(record: FootprintEntryRecord): FootprintInput {
  return {
    carKmPerWeek: record.car_km_per_week,
    publicKmPerWeek: record.public_km_per_week,
    shortFlightsPerYear: record.short_flights_year,
    longFlightsPerYear: record.long_flights_year,
    electricityKwhPerMonth: record.electricity_kwh_mo,
    renewableSharePercent: record.renewable_share_pct,
    waterLitersPerDay: record.water_liters_day,
    dietType: record.diet_type as FootprintInput["dietType"],
    foodWastePercent: record.food_waste_pct,
    wasteKgPerWeek: record.waste_kg_week,
    recyclingSharePercent: record.recycling_share_pct,
    shoppingSpendPerMonth: record.shopping_spend_mo
  };
}

export const footprintService = {
  /** Calculate, persist, then credit gamification points. */
  calculate(userId: number, input: FootprintInput): FootprintResult {
    const result = calculateFootprint(input);
    footprintRepository.insert(userId, input, result);
    gamificationService.recordActivity(userId, gamificationService.POINTS.FOOTPRINT_LOGGED);
    return result;
  },

  /**
   * Returns the most recent calculation, including the original raw inputs.
   * The raw inputs are essential for the impact simulator, which needs a
   * real baseline to recompute "what if" scenarios against.
   */
  getLatest(userId: number): (FootprintResult & { id: number; createdAt: string; input: FootprintInput }) | null {
    const record = footprintRepository.findLatestByUser(userId);
    if (!record) return null;

    return {
      id: record.id,
      createdAt: record.created_at,
      input: recordToInput(record),
      categories: JSON.parse(record.breakdown_json) as CategoryResult[],
      totalMonthlyKg: record.total_monthly_kg,
      totalYearlyKg: record.total_yearly_kg,
      vsGlobalAverageMonthlyPercent: 0 // recomputed client-side / dashboard endpoint to avoid stale benchmark
    };
  },

  getHistory(userId: number, limit: number, offset: number): { items: HistoryItem[]; total: number } {
    const records = footprintRepository.findHistoryByUser(userId, limit, offset);
    const total = footprintRepository.countByUser(userId);
    const items: HistoryItem[] = records.map((r) => ({
      id: r.id,
      totalMonthlyKg: r.total_monthly_kg,
      totalYearlyKg: r.total_yearly_kg,
      categories: JSON.parse(r.breakdown_json) as CategoryResult[],
      createdAt: r.created_at
    }));

    return { items, total };
  }
};
