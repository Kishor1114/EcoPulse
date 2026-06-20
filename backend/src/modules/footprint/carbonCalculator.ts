import { BENCHMARK_MONTHLY_KG_CO2E, EMISSION_FACTORS } from "./emissionFactors";
import { CategoryResult, FootprintInput, FootprintResult } from "./footprint.types";

const WEEKS_PER_MONTH = 4.345; // 52 weeks / 12 months, avoids drifting totals across the year
const MONTHS_PER_YEAR = 12;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function computeTransportKg(input: FootprintInput): number {
  const { carKgPerKm, publicTransitKgPerKm, shortFlightKgPerFlight, longFlightKgPerFlight } =
    EMISSION_FACTORS.transport;

  const carMonthly = input.carKmPerWeek * carKgPerKm * WEEKS_PER_MONTH;
  const transitMonthly = input.publicKmPerWeek * publicTransitKgPerKm * WEEKS_PER_MONTH;
  const flightsMonthly =
    ((input.shortFlightsPerYear * shortFlightKgPerFlight) +
      (input.longFlightsPerYear * longFlightKgPerFlight)) /
    MONTHS_PER_YEAR;

  return carMonthly + transitMonthly + flightsMonthly;
}

function computeElectricityKg(input: FootprintInput): number {
  const cleanShare = Math.min(Math.max(input.renewableSharePercent, 0), 100) / 100;
  const effectiveFactor = EMISSION_FACTORS.electricity.gridKgPerKwh * (1 - cleanShare);
  return input.electricityKwhPerMonth * effectiveFactor;
}

function computeWaterKg(input: FootprintInput): number {
  return input.waterLitersPerDay * EMISSION_FACTORS.water.kgPerLiter * 30;
}

function computeFoodKg(input: FootprintInput): number {
  const baseDailyKg = EMISSION_FACTORS.food.dietKgPerDay[input.dietType];
  const wasteSharePenalty = (Math.min(Math.max(input.foodWastePercent, 0), 100) / 100) *
    EMISSION_FACTORS.food.wastedFoodMultiplier;
  return baseDailyKg * (1 + wasteSharePenalty) * 30;
}

function computeWasteKg(input: FootprintInput): number {
  const recyclingShare = Math.min(Math.max(input.recyclingSharePercent, 0), 100) / 100;
  const landfillShare = 1 - recyclingShare;
  const monthlyWasteKg = input.wasteKgPerWeek * WEEKS_PER_MONTH;

  const landfillEmissions = monthlyWasteKg * landfillShare * EMISSION_FACTORS.waste.landfillKgPerKg;
  const recycledEmissions =
    monthlyWasteKg * recyclingShare *
    (EMISSION_FACTORS.waste.landfillKgPerKg - EMISSION_FACTORS.waste.recyclingOffsetKgPerKg);

  return Math.max(landfillEmissions + recycledEmissions, 0);
}

function computeShoppingKg(input: FootprintInput): number {
  return input.shoppingSpendPerMonth * EMISSION_FACTORS.shopping.kgPerCurrencyUnit;
}

/**
 * Computes a full footprint breakdown from raw lifestyle inputs.
 * Each category is calculated independently so individual figures can be
 * surfaced to the AI coach, the dashboard, and the impact simulator without
 * re-deriving them.
 */
export function calculateFootprint(input: FootprintInput): FootprintResult {
  const rawCategories: Record<string, number> = {
    transport: computeTransportKg(input),
    electricity: computeElectricityKg(input),
    water: computeWaterKg(input),
    food: computeFoodKg(input),
    waste: computeWasteKg(input),
    shopping: computeShoppingKg(input)
  };

  const totalMonthlyKg = Object.values(rawCategories).reduce((sum, v) => sum + v, 0);

  const categories: CategoryResult[] = (Object.entries(rawCategories) as Array<
    [CategoryResult["category"], number]
  >).map(([category, monthlyKg]) => ({
    category,
    monthlyKg: round2(monthlyKg),
    percentOfTotal: totalMonthlyKg > 0 ? round2((monthlyKg / totalMonthlyKg) * 100) : 0
  }));

  return {
    categories,
    totalMonthlyKg: round2(totalMonthlyKg),
    totalYearlyKg: round2(totalMonthlyKg * MONTHS_PER_YEAR),
    vsGlobalAverageMonthlyPercent: round2(
      ((totalMonthlyKg - BENCHMARK_MONTHLY_KG_CO2E) / BENCHMARK_MONTHLY_KG_CO2E) * 100
    )
  };
}
