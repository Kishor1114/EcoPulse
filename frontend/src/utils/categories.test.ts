import { describe, it, expect } from "vitest";
import { formatKg, formatKgLong, impactColor, CATEGORY_META } from "@/utils/categories";

describe("formatKg", () => {
  it("formats values under 1000 as whole kg", () => {
    expect(formatKg(250.7)).toBe("251 kg");
  });

  it("formats values over 1000 as tonnes with one decimal", () => {
    expect(formatKg(2500)).toBe("2.5 t");
  });

  it("formats zero correctly", () => {
    expect(formatKg(0)).toBe("0 kg");
  });
});

describe("formatKgLong", () => {
  it("formats large values as tonnes with two decimals", () => {
    expect(formatKgLong(10000)).toBe("10.00 tonnes");
  });

  it("formats small values with one decimal", () => {
    expect(formatKgLong(45.6)).toBe("45.6 kg");
  });
});

describe("impactColor", () => {
  it("returns rose classes for High impact", () => {
    expect(impactColor("High")).toContain("rose");
  });

  it("returns amber classes for Medium impact", () => {
    expect(impactColor("Medium")).toContain("amber");
  });

  it("returns forest classes for Low impact", () => {
    expect(impactColor("Low")).toContain("forest");
  });
});

describe("CATEGORY_META", () => {
  it("has metadata for all six footprint categories", () => {
    const categories = ["transport", "electricity", "water", "food", "waste", "shopping"] as const;
    for (const cat of categories) {
      expect(CATEGORY_META[cat]).toBeDefined();
      expect(CATEGORY_META[cat].label).toBeTruthy();
      expect(CATEGORY_META[cat].color).toMatch(/^#/);
    }
  });
});
