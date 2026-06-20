import { calculateFootprint } from "../../src/modules/footprint/carbonCalculator";
import { FootprintInput } from "../../src/modules/footprint/footprint.types";
import { BENCHMARK_MONTHLY_KG_CO2E } from "../../src/modules/footprint/emissionFactors";

const baseInput: FootprintInput = {
  carKmPerWeek: 0,
  publicKmPerWeek: 0,
  shortFlightsPerYear: 0,
  longFlightsPerYear: 0,
  electricityKwhPerMonth: 0,
  renewableSharePercent: 0,
  waterLitersPerDay: 0,
  dietType: "vegan",
  foodWastePercent: 0,
  wasteKgPerWeek: 0,
  recyclingSharePercent: 0,
  shoppingSpendPerMonth: 0
};

describe("carbonCalculator", () => {
  describe("calculateFootprint()", () => {
    it("returns all six categories", () => {
      const result = calculateFootprint(baseInput);
      const categories = result.categories.map((c) => c.category);
      expect(categories).toContain("transport");
      expect(categories).toContain("electricity");
      expect(categories).toContain("water");
      expect(categories).toContain("food");
      expect(categories).toContain("waste");
      expect(categories).toContain("shopping");
    });

    it("sums category monthlyKg to approximately equal totalMonthlyKg", () => {
      const input: FootprintInput = {
        ...baseInput,
        carKmPerWeek: 100,
        electricityKwhPerMonth: 200,
        dietType: "average",
        wasteKgPerWeek: 5,
        shoppingSpendPerMonth: 300
      };
      const result = calculateFootprint(input);
      const sumOfCategories = result.categories.reduce((s, c) => s + c.monthlyKg, 0);
      expect(Math.abs(sumOfCategories - result.totalMonthlyKg)).toBeLessThan(0.1);
    });

    it("percentages across categories sum to ~100", () => {
      const input: FootprintInput = { ...baseInput, carKmPerWeek: 100, electricityKwhPerMonth: 150 };
      const result = calculateFootprint(input);
      const totalPct = result.categories.reduce((s, c) => s + c.percentOfTotal, 0);
      expect(totalPct).toBeCloseTo(100, 0);
    });

    it("yearly is 12× monthly", () => {
      const input: FootprintInput = { ...baseInput, carKmPerWeek: 50 };
      const result = calculateFootprint(input);
      expect(result.totalYearlyKg).toBeCloseTo(result.totalMonthlyKg * 12, 0);
    });

    describe("transport calculations", () => {
      it("zero car km produces zero transport from car", () => {
        const result = calculateFootprint(baseInput);
        const transport = result.categories.find((c) => c.category === "transport")!;
        expect(transport.monthlyKg).toBe(0);
      });

      it("car km produce positive transport emissions", () => {
        const result = calculateFootprint({ ...baseInput, carKmPerWeek: 100 });
        const transport = result.categories.find((c) => c.category === "transport")!;
        expect(transport.monthlyKg).toBeGreaterThan(0);
      });

      it("public transit emits less per km than driving", () => {
        const carResult = calculateFootprint({ ...baseInput, carKmPerWeek: 100 });
        const transitResult = calculateFootprint({ ...baseInput, publicKmPerWeek: 100 });
        const carKg = carResult.categories.find((c) => c.category === "transport")!.monthlyKg;
        const transitKg = transitResult.categories.find((c) => c.category === "transport")!.monthlyKg;
        expect(transitKg).toBeLessThan(carKg);
      });
    });

    describe("electricity calculations", () => {
      it("100% renewables eliminates grid carbon component", () => {
        const gridResult = calculateFootprint({ ...baseInput, electricityKwhPerMonth: 300, renewableSharePercent: 0 });
        const renewResult = calculateFootprint({ ...baseInput, electricityKwhPerMonth: 300, renewableSharePercent: 100 });
        const gridKg = gridResult.categories.find((c) => c.category === "electricity")!.monthlyKg;
        const renewKg = renewResult.categories.find((c) => c.category === "electricity")!.monthlyKg;
        expect(renewKg).toBe(0);
        expect(gridKg).toBeGreaterThan(0);
      });
    });

    describe("food calculations", () => {
      it("vegan < vegetarian < average < meat_heavy", () => {
        const diets = ["vegan", "vegetarian", "average", "meat_heavy"] as const;
        const footprints = diets.map((diet) =>
          calculateFootprint({ ...baseInput, dietType: diet }).categories.find((c) => c.category === "food")!.monthlyKg
        );
        for (let i = 0; i < footprints.length - 1; i++) {
          expect(footprints[i]).toBeLessThan(footprints[i + 1]);
        }
      });
    });

    describe("waste calculations", () => {
      it("100% recycling reduces waste emissions compared to 0%", () => {
        const noRecycle = calculateFootprint({ ...baseInput, wasteKgPerWeek: 5, recyclingSharePercent: 0 });
        const fullRecycle = calculateFootprint({ ...baseInput, wasteKgPerWeek: 5, recyclingSharePercent: 100 });
        const noRecycleKg = noRecycle.categories.find((c) => c.category === "waste")!.monthlyKg;
        const fullRecycleKg = fullRecycle.categories.find((c) => c.category === "waste")!.monthlyKg;
        expect(fullRecycleKg).toBeLessThan(noRecycleKg);
      });
    });

    describe("global average comparison", () => {
      it("reports negative percent when footprint is below benchmark", () => {
        const result = calculateFootprint(baseInput);
        expect(result.vsGlobalAverageMonthlyPercent).toBeLessThan(0);
      });

      it("reports positive percent when footprint exceeds benchmark", () => {
        const heavyInput: FootprintInput = {
          ...baseInput,
          carKmPerWeek: 500,
          electricityKwhPerMonth: 800,
          dietType: "meat_heavy",
          shoppingSpendPerMonth: 2000
        };
        const result = calculateFootprint(heavyInput);
        expect(result.vsGlobalAverageMonthlyPercent).toBeGreaterThan(0);
      });

      it("benchmark constant is positive", () => {
        expect(BENCHMARK_MONTHLY_KG_CO2E).toBeGreaterThan(0);
      });
    });
  });
});
