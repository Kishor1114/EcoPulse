import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RingChart } from "@/components/charts/RingChart";
import type { CategoryResult } from "@/types";

const sampleCategories: CategoryResult[] = [
  { category: "transport", monthlyKg: 100, percentOfTotal: 40 },
  { category: "electricity", monthlyKg: 75, percentOfTotal: 30 },
  { category: "food", monthlyKg: 50, percentOfTotal: 20 },
  { category: "waste", monthlyKg: 25, percentOfTotal: 10 },
];

describe("RingChart", () => {
  it("renders the total value and label", () => {
    render(<RingChart categories={sampleCategories} totalLabel="kg CO₂e / month" totalValue="250 kg" />);
    expect(screen.getByText("250 kg")).toBeInTheDocument();
    expect(screen.getByText("kg CO₂e / month")).toBeInTheDocument();
  });

  it("provides an accessible data table for screen readers", () => {
    render(<RingChart categories={sampleCategories} totalLabel="kg CO₂e / month" totalValue="250 kg" />);
    expect(screen.getByText("Carbon footprint breakdown by category")).toBeInTheDocument();
    expect(screen.getAllByText("Transport").length).toBeGreaterThan(0);
  });

  it("renders a legend entry for every category", () => {
    render(<RingChart categories={sampleCategories} totalLabel="kg CO₂e / month" totalValue="250 kg" />);
    const legend = screen.getByLabelText("Category legend");
    expect(legend).toBeInTheDocument();
    for (const cat of sampleCategories) {
      expect(legend.textContent).toContain(`${cat.percentOfTotal}%`);
    }
  });
});
