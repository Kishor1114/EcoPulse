import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Card,
  StatCard,
  ProgressBar,
  ErrorAlert,
  EmptyState,
} from "@/components/ui/Primitives";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Hello world</Card>);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });
});

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="Monthly footprint" value={250} unit="kg" />);
    expect(screen.getByText("Monthly footprint")).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
    expect(screen.getByText("kg")).toBeInTheDocument();
  });

  it("applies the down-trend color for reductions", () => {
    render(<StatCard label="Change" value="-10%" trend="down" trendLabel="Improved" />);
    const trendText = screen.getByText("Improved");
    expect(trendText.className).toContain("text-forest-400");
  });
});

describe("ProgressBar", () => {
  it("clamps percent values above 100 to 100 for the aria attribute", () => {
    render(<ProgressBar percent={150} label="Test progress" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "100");
  });

  it("clamps negative percent values to 0", () => {
    render(<ProgressBar percent={-20} label="Test progress" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "0");
  });

  it("renders the provided label", () => {
    render(<ProgressBar percent={42} label="Goal progress" />);
    expect(screen.getByText("Goal progress")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
  });
});

describe("ErrorAlert", () => {
  it("renders with role=alert for screen reader announcement", () => {
    render(<ErrorAlert message="Something went wrong" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });
});

describe("EmptyState", () => {
  it("renders title, description, and optional action", async () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No data"
        description="Try again later"
        action={<button onClick={onClick}>Retry</button>}
      />
    );
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(screen.getByText("Try again later")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
