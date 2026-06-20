export interface FootprintInput {
  carKmPerWeek: number;
  publicKmPerWeek: number;
  shortFlightsPerYear: number;
  longFlightsPerYear: number;
  electricityKwhPerMonth: number;
  renewableSharePercent: number; // 0-100, share of electricity from renewables
  waterLitersPerDay: number;
  dietType: "meat_heavy" | "average" | "vegetarian" | "vegan";
  foodWastePercent: number; // 0-100
  wasteKgPerWeek: number;
  recyclingSharePercent: number; // 0-100
  shoppingSpendPerMonth: number;
}

export type FootprintCategory =
  | "transport"
  | "electricity"
  | "water"
  | "food"
  | "waste"
  | "shopping";

export interface CategoryResult {
  category: FootprintCategory;
  monthlyKg: number;
  percentOfTotal: number;
}

export interface FootprintResult {
  categories: CategoryResult[];
  totalMonthlyKg: number;
  totalYearlyKg: number;
  vsGlobalAverageMonthlyPercent: number; // negative = below average, positive = above
}
