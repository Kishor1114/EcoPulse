import { generateCoachReport } from "../../src/modules/coach/coach.engine";
import { CategoryResult } from "../../src/modules/footprint/footprint.types";

function makeCategories(overrides: Partial<Record<string, number>> = {}): CategoryResult[] {
  const defaults: Record<string, number> = {
    transport: 50,
    electricity: 40,
    water: 5,
    food: 80,
    waste: 10,
    shopping: 30
  };
  const merged: Record<string, number> = { ...defaults };
  for (const [k, v] of Object.entries(overrides)) {
    if (v !== undefined) merged[k] = v;
  }
  const values = Object.values(merged) as number[];
  const total: number = values.reduce((s: number, v: number) => s + v, 0);
  return (Object.entries(merged) as Array<[string, number]>).map(([category, monthlyKg]) => ({
    category: category as CategoryResult["category"],
    monthlyKg: monthlyKg,
    percentOfTotal: total > 0 ? Math.round((monthlyKg / total) * 100) : 0
  }));
}

describe("coach engine – generateCoachReport()", () => {
  it("returns a non-empty summary string", () => {
    const report = generateCoachReport(makeCategories(), "average", 30, 215);
    expect(typeof report.summary).toBe("string");
    expect(report.summary.length).toBeGreaterThan(0);
  });

  it("identifies the highest-emission category correctly", () => {
    const cats = makeCategories({ food: 400, transport: 50, electricity: 40, water: 5, waste: 10, shopping: 30 });
    const report = generateCoachReport(cats, "meat_heavy", 30, 535);
    expect(report.highestEmissionCategory).toBe("food");
  });

  it("returns at most 6 recommendations", () => {
    const heavyCats = makeCategories({ transport: 300, electricity: 200, food: 250, waste: 60, shopping: 150, water: 10 });
    const report = generateCoachReport(heavyCats, "meat_heavy", 10, 970);
    expect(report.recommendations.length).toBeLessThanOrEqual(6);
  });

  it("recommendations are sorted by estimatedMonthlySavingKg descending", () => {
    const report = generateCoachReport(
      makeCategories({ transport: 300, electricity: 200, food: 250 }),
      "meat_heavy",
      10,
      900
    );
    for (let i = 0; i < report.recommendations.length - 1; i++) {
      expect(report.recommendations[i].estimatedMonthlySavingKg).toBeGreaterThanOrEqual(
        report.recommendations[i + 1].estimatedMonthlySavingKg
      );
    }
  });

  it("each recommendation has required fields", () => {
    const report = generateCoachReport(makeCategories({ transport: 300 }), "average", 30, 515);
    for (const rec of report.recommendations) {
      expect(rec).toHaveProperty("id");
      expect(rec).toHaveProperty("title");
      expect(rec).toHaveProperty("description");
      expect(rec).toHaveProperty("impactLabel");
      expect(rec).toHaveProperty("estimatedMonthlySavingKg");
      expect(rec).toHaveProperty("actionSteps");
      expect(rec).toHaveProperty("reasoning");
    }
  });

  it("produces no recommendations when all categories are low", () => {
    const lowCats = makeCategories({ transport: 10, electricity: 5, food: 30, waste: 2, shopping: 3, water: 1 });
    const report = generateCoachReport(lowCats, "vegan", 70, 51);
    expect(report.recommendations.length).toBe(0);
  });

  it("includes a transport recommendation when car usage is very high", () => {
    const cats = makeCategories({ transport: 350, electricity: 40, food: 80, waste: 10, shopping: 30, water: 5 });
    const report = generateCoachReport(cats, "average", 30, 515);
    const hasTransport = report.recommendations.some((r) => r.category === "transport");
    expect(hasTransport).toBe(true);
  });
});
