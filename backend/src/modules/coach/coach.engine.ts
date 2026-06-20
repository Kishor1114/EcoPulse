import { CategoryResult } from "@/modules/footprint/footprint.types";

export interface Recommendation {
  id: string;
  category: CategoryResult["category"];
  title: string;
  description: string;
  impactLabel: string; // e.g. "High", "Medium", "Low"
  estimatedMonthlySavingKg: number;
  actionSteps: string[];
  reasoning: string;
}

export interface CoachReport {
  summary: string;
  highestEmissionCategory: CategoryResult["category"];
  recommendations: Recommendation[];
  priorityFocus: string;
}

const thresholds = {
  transport: { high: 250, medium: 100 },
  electricity: { high: 150, medium: 60 },
  water: { high: 10, medium: 4 },
  food: { high: 200, medium: 130 },
  waste: { high: 30, medium: 15 },
  shopping: { high: 120, medium: 50 }
};

type ImpactLevel = "High" | "Medium" | "Low";

function impactLevel(category: CategoryResult["category"], monthlyKg: number): ImpactLevel {
  const t = thresholds[category];
  if (monthlyKg >= t.high) return "High";
  if (monthlyKg >= t.medium) return "Medium";
  return "Low";
}

/**
 * Rule-based expert system. Each recommendation function receives the
 * category result and returns a recommendation only when the category
 * emissions exceed the relevant threshold. This keeps the coach adaptive –
 * it surfaces advice relevant to the user's actual profile and explains
 * *why* each suggestion was made via the `reasoning` field.
 */
function buildTransportRecommendations(cat: CategoryResult): Recommendation[] {
  if (cat.monthlyKg < thresholds.transport.medium) return [];
  const recs: Recommendation[] = [];

  if (cat.monthlyKg >= thresholds.transport.medium) {
    recs.push({
      id: "transport_public_transit",
      category: "transport",
      title: "Switch to public transport or cycling",
      description:
        "Public transit emits 80% less CO₂ per km than driving alone. Even two car-free days per week makes a meaningful difference.",
      impactLabel: impactLevel("transport", cat.monthlyKg),
      estimatedMonthlySavingKg: Math.round(cat.monthlyKg * 0.35),
      actionSteps: [
        "Identify one commute day you could replace with transit or cycling",
        "Download a local transit app and plan the journey in advance",
        "If cycling, check if an e-bike would make it practical"
      ],
      reasoning: `Your transport footprint (${cat.monthlyKg} kg CO₂/month) is above the moderate threshold. Reducing car trips is the fastest route to emission cuts in this category.`
    });
  }

  if (cat.monthlyKg >= thresholds.transport.high) {
    recs.push({
      id: "transport_carpool_remote",
      category: "transport",
      title: "Explore carpooling and remote work",
      description:
        "Sharing rides halves per-person emissions immediately. One work-from-home day a week saves the equivalent of 50+ kg of CO₂ monthly for most commuters.",
      impactLabel: "High",
      estimatedMonthlySavingKg: Math.round(cat.monthlyKg * 0.2),
      actionSteps: [
        "Propose one remote-work day per week to your employer",
        "Check apps like BlaBlaCar or Waze Carpool for shared commute routes",
        "Track fuel saved as a direct motivator"
      ],
      reasoning: `Your driving emissions are in the high range. Each avoided journey delivers an outsized saving compared to changes in other categories.`
    });
  }

  return recs;
}

function buildElectricityRecommendations(cat: CategoryResult): Recommendation[] {
  if (cat.monthlyKg < thresholds.electricity.medium) return [];
  const recs: Recommendation[] = [];

  recs.push({
    id: "electricity_efficiency",
    category: "electricity",
    title: "Cut standby power and improve efficiency",
    description:
      "Standby appliances account for 5–10% of home electricity. LED lighting, smart strips, and turning off idle devices can cut usage noticeably with zero lifestyle change.",
    impactLabel: impactLevel("electricity", cat.monthlyKg),
    estimatedMonthlySavingKg: Math.round(cat.monthlyKg * 0.12),
    actionSteps: [
      "Replace remaining incandescent bulbs with LEDs (saves ~75% per bulb)",
      "Use a smart power strip for your TV/gaming setup",
      "Set screen-off timers on computers to 5 minutes"
    ],
    reasoning: `Electricity is ${Math.round(cat.percentOfTotal)}% of your total footprint. Small efficiency gains stack up quickly.`
  });

  if (cat.monthlyKg >= thresholds.electricity.high) {
    recs.push({
      id: "electricity_renewables",
      category: "electricity",
      title: "Switch to a renewable energy tariff",
      description:
        "Many utility providers offer 100% renewable electricity options with little or no premium. This can eliminate the grid-carbon component of your electricity footprint entirely.",
      impactLabel: "High",
      estimatedMonthlySavingKg: Math.round(cat.monthlyKg * 0.8),
      actionSteps: [
        "Check your utility's renewable tariff or switch providers",
        "Consider a solar panel quote if you own your home",
        "Look into community solar programmes if rooftop isn't possible"
      ],
      reasoning: `Your electricity footprint is high. Switching to renewables offers the biggest single reduction in this category.`
    });
  }

  return recs;
}

function buildFoodRecommendations(cat: CategoryResult, dietType: string): Recommendation[] {
  if (cat.monthlyKg < thresholds.food.medium) return [];
  const recs: Recommendation[] = [];

  if (dietType === "meat_heavy" || dietType === "average") {
    recs.push({
      id: "food_reduce_meat",
      category: "food",
      title: "Introduce two meat-free days per week",
      description:
        "Beef alone produces 20× more greenhouse gas than pulses per gram of protein. Just two plant-based days can cut food emissions by 15–20% without a complete diet overhaul.",
      impactLabel: impactLevel("food", cat.monthlyKg),
      estimatedMonthlySavingKg: Math.round(cat.monthlyKg * 0.18),
      actionSteps: [
        "Choose Monday and Thursday as plant-based days",
        "Swap beef mince for lentils in pasta bolognese — same texture, ¼ the emissions",
        "Explore a new plant-based recipe each week to build variety"
      ],
      reasoning: `Your diet type (${dietType}) is among the more carbon-intensive patterns. Reducing red meat frequency is the single highest-impact food change available.`
    });
  }

  recs.push({
    id: "food_reduce_waste",
    category: "food",
    title: "Plan meals to reduce food waste",
    description:
      "Globally, ~one-third of all food produced is wasted. Reducing household waste by half could save the equivalent of 20 kg CO₂ per month for an average household.",
    impactLabel: "Medium",
    estimatedMonthlySavingKg: Math.round(cat.monthlyKg * 0.08),
    actionSteps: [
      "Write a weekly meal plan before shopping — buy only what you'll use",
      "Freeze bread and meat before they expire",
      "Keep a 'use first' shelf in the fridge for items nearing their date"
    ],
    reasoning: "Food waste amplifies the emissions of every meal by discarding embodied carbon without nutritional benefit."
  });

  return recs;
}

function buildWasteRecommendations(cat: CategoryResult, recyclingPercent: number): Recommendation[] {
  if (cat.monthlyKg < thresholds.waste.medium) return [];

  return [
    {
      id: "waste_recycle_more",
      category: "waste",
      title: "Increase recycling and composting",
      description: `You're currently recycling around ${recyclingPercent}% of your waste. Pushing this above 60% and composting food scraps can cut your waste emissions by a third.`,
      impactLabel: impactLevel("waste", cat.monthlyKg),
      estimatedMonthlySavingKg: Math.round(cat.monthlyKg * 0.3),
      actionSteps: [
        "Set up clearly labelled bins for recycling, composting, and landfill",
        "Check your local council's accepted materials list — many people recycle incorrectly",
        "Start a small countertop compost bin for food scraps"
      ],
      reasoning: `Your current recycling rate (${recyclingPercent}%) leaves significant diversion potential on the table. Landfill waste generates methane, a potent short-term greenhouse gas.`
    }
  ];
}

function buildShoppingRecommendations(cat: CategoryResult): Recommendation[] {
  if (cat.monthlyKg < thresholds.shopping.medium) return [];

  return [
    {
      id: "shopping_conscious",
      category: "shopping",
      title: "Adopt a 'buy less, buy better' approach",
      description:
        "Consumer goods account for a surprising share of personal footprints. Cutting discretionary purchases by 20% and choosing second-hand or durable items reduces embodied carbon.",
      impactLabel: impactLevel("shopping", cat.monthlyKg),
      estimatedMonthlySavingKg: Math.round(cat.monthlyKg * 0.2),
      actionSteps: [
        "Apply a 48-hour pause before any non-essential purchase",
        "Check Vinted, eBay, or local charity shops first for clothing and electronics",
        "Prioritise products with credible eco-certifications (FSC, Fairtrade, B Corp)"
      ],
      reasoning: `Discretionary shopping is contributing ${cat.monthlyKg} kg CO₂/month. Demand-side reduction has an immediate impact because no emission occurs if the product isn't produced.`
    }
  ];
}

/**
 * Main entry point for the coach. Takes a full footprint breakdown and
 * extra context from the user's profile, returns a prioritised set of
 * recommendations with explanations.
 */
export function generateCoachReport(
  categories: CategoryResult[],
  dietType: string,
  recyclingPercent: number,
  totalMonthlyKg: number
): CoachReport {
  const sorted = [...categories].sort((a, b) => b.monthlyKg - a.monthlyKg);
  const highest = sorted[0];

  const allRecommendations: Recommendation[] = [];

  for (const cat of sorted) {
    switch (cat.category) {
      case "transport":
        allRecommendations.push(...buildTransportRecommendations(cat));
        break;
      case "electricity":
        allRecommendations.push(...buildElectricityRecommendations(cat));
        break;
      case "food":
        allRecommendations.push(...buildFoodRecommendations(cat, dietType));
        break;
      case "waste":
        allRecommendations.push(...buildWasteRecommendations(cat, recyclingPercent));
        break;
      case "shopping":
        allRecommendations.push(...buildShoppingRecommendations(cat));
        break;
    }
  }

  // Sort by estimated saving descending so the user sees the highest-impact advice first
  allRecommendations.sort((a, b) => b.estimatedMonthlySavingKg - a.estimatedMonthlySavingKg);

  const vsAverage =
    totalMonthlyKg > 833
      ? `Your footprint is ${Math.round(((totalMonthlyKg - 833) / 833) * 100)}% above the global monthly average.`
      : `Your footprint is ${Math.round(((833 - totalMonthlyKg) / 833) * 100)}% below the global monthly average — keep it up!`;

  const summary = `Your total footprint is ${totalMonthlyKg} kg CO₂e this month. ${vsAverage} Your biggest opportunity for reduction is in ${highest.category}, which accounts for ${highest.percentOfTotal}% of your total.`;

  return {
    summary,
    highestEmissionCategory: highest.category,
    recommendations: allRecommendations.slice(0, 6), // cap at 6 to avoid overwhelming the user
    priorityFocus: highest.category
  };
}
