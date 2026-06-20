/**
 * Emission factors used to convert raw activity data into kilograms of CO2
 * equivalent (kgCO2e). Figures are deliberately conservative, order-of-
 * magnitude approximations drawn from widely cited public sources (IPCC,
 * IEA, Our World in Data, EPA) rather than precise regional measurements.
 * They are isolated here, with units in their names, so the methodology is
 * auditable and can be swapped for region-specific data without touching
 * calculation logic.
 */
export const EMISSION_FACTORS = {
  transport: {
    carKgPerKm: 0.192, // average petrol/diesel passenger car, per IEA/EPA averages
    publicTransitKgPerKm: 0.041, // bus/rail blended average
    shortFlightKgPerFlight: 250, // domestic / <1500km round-trip equivalent
    longFlightKgPerFlight: 900 // international / long-haul round-trip equivalent
  },
  electricity: {
    gridKgPerKwh: 0.475 // global average grid carbon intensity
  },
  water: {
    kgPerLiter: 0.000344 // treatment, pumping & heating average
  },
  food: {
    // kgCO2e per day, by diet pattern (Poore & Nemecek-style ordering)
    dietKgPerDay: {
      meat_heavy: 7.19,
      average: 5.04,
      vegetarian: 3.81,
      vegan: 2.89
    } as Record<string, number>,
    wastedFoodMultiplier: 0.15 // extra share of food emissions wasted, scaled by reported waste %
  },
  waste: {
    landfillKgPerKg: 0.5,
    recyclingOffsetKgPerKg: 0.2 // emissions avoided per kg diverted from landfill
  },
  shopping: {
    kgPerCurrencyUnit: 0.45 // blended spend-based factor for goods & services
  }
} as const;

export const DIET_TYPES = Object.keys(EMISSION_FACTORS.food.dietKgPerDay) as Array<
  keyof typeof EMISSION_FACTORS.food.dietKgPerDay
>;

/** Approximate national/global average monthly footprint, used as a benchmark for UI comparisons. */
export const BENCHMARK_MONTHLY_KG_CO2E = 833; // ~10 tonnes/year global per-capita average
