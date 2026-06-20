import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Lightbulb, TreeDeciduous, Calculator, RefreshCw, Info, Car, Zap, UtensilsCrossed } from "lucide-react";
import { footprintApi } from "@/api";
import { useAsync } from "@/hooks";
import type { FootprintInput, DietType } from "@/types";
import { Card, CardHeader, Spinner, EmptyState } from "@/components/ui/Primitives";

// Constants matching backend calculation
const WEEKS_PER_MONTH = 4.345;
const MONTHS_PER_YEAR = 12;

const EMISSION_FACTORS = {
  transport: {
    carKgPerKm: 0.192,
    publicTransitKgPerKm: 0.041,
    shortFlightKgPerFlight: 250,
    longFlightKgPerFlight: 900,
  },
  electricity: {
    gridKgPerKwh: 0.475,
  },
  water: {
    kgPerLiter: 0.000344,
  },
  food: {
    dietKgPerDay: {
      meat_heavy: 7.19,
      average: 5.04,
      vegetarian: 3.81,
      vegan: 2.89,
    } as Record<DietType, number>,
    wastedFoodMultiplier: 0.15,
  },
  waste: {
    landfillKgPerKg: 0.5,
    recyclingOffsetKgPerKg: 0.2,
  },
  shopping: {
    kgPerCurrencyUnit: 0.45,
  },
};

function runLocalCalculation(input: FootprintInput): number {
  const transport =
    input.carKmPerWeek * EMISSION_FACTORS.transport.carKgPerKm * WEEKS_PER_MONTH +
    input.publicKmPerWeek * EMISSION_FACTORS.transport.publicTransitKgPerKm * WEEKS_PER_MONTH +
    (input.shortFlightsPerYear * EMISSION_FACTORS.transport.shortFlightKgPerFlight +
      input.longFlightsPerYear * EMISSION_FACTORS.transport.longFlightKgPerFlight) /
      MONTHS_PER_YEAR;

  const electricity =
    input.electricityKwhPerMonth *
    EMISSION_FACTORS.electricity.gridKgPerKwh *
    (1 - Math.min(Math.max(input.renewableSharePercent, 0), 100) / 100);

  const water = input.waterLitersPerDay * EMISSION_FACTORS.water.kgPerLiter * 30;

  const food =
    EMISSION_FACTORS.food.dietKgPerDay[input.dietType] *
    (1 + (Math.min(Math.max(input.foodWastePercent, 0), 100) / 100) * EMISSION_FACTORS.food.wastedFoodMultiplier) *
    30;

  const waste = (() => {
    const recyclingShare = Math.min(Math.max(input.recyclingSharePercent, 0), 100) / 100;
    const landfillShare = 1 - recyclingShare;
    const monthlyWasteKg = input.wasteKgPerWeek * WEEKS_PER_MONTH;
    const landfillEmissions = monthlyWasteKg * landfillShare * EMISSION_FACTORS.waste.landfillKgPerKg;
    const recycledEmissions =
      monthlyWasteKg * recyclingShare *
      (EMISSION_FACTORS.waste.landfillKgPerKg - EMISSION_FACTORS.waste.recyclingOffsetKgPerKg);
    return Math.max(landfillEmissions + recycledEmissions, 0);
  })();

  const shopping = input.shoppingSpendPerMonth * EMISSION_FACTORS.shopping.kgPerCurrencyUnit;

  return Math.round(transport + electricity + water + food + waste + shopping);
}

export function SimulatorPage() {
  const { data: latest, loading, error } = useAsync(() => footprintApi.getLatest(), []);
  const [simInput, setSimInput] = useState<FootprintInput | null>(null);
  const [projectedTotal, setProjectedTotal] = useState<number>(0);

  useEffect(() => {
    if (latest) {
      setSimInput({ ...latest.input });
      setProjectedTotal(Math.round(latest.totalMonthlyKg));
    }
  }, [latest]);

  if (loading) return <Spinner label="Loading Simulator Sandbox" />;

  if (!latest || error) {
    return (
      <Card className="bg-slate-900 border-slate-850">
        <EmptyState
          title="Baseline Calculation Required"
          description="The interactive simulator sandbox requires your current carbon footprint details as a baseline. Complete the calculator to unlock what-if sliders."
          action={
            <Link to="/calculator" className="btn-primary">
              <Calculator size={18} aria-hidden="true" />
              Go to Calculator
            </Link>
          }
        />
      </Card>
    );
  }

  if (!simInput) return null;

  function handleSliderChange<K extends keyof FootprintInput>(key: K, val: FootprintInput[K]) {
    if (!simInput) return;
    const updated = { ...simInput, [key]: val };
    setSimInput(updated);
    setProjectedTotal(runLocalCalculation(updated));
  }

  function handleReset() {
    if (latest) {
      setSimInput({ ...latest.input });
      setProjectedTotal(Math.round(latest.totalMonthlyKg));
    }
  }

  const currentTotal = Math.round(latest.totalMonthlyKg);
  const carbonSaved = Math.max(0, currentTotal - projectedTotal);
  const percentSaved = currentTotal > 0 ? Math.round((carbonSaved / currentTotal) * 100) : 0;
  const treesEquiv = Math.round((carbonSaved * 12) / 21); // ~21kg CO2 absorbed per tree per year

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Lightbulb className="text-forest-400 animate-pulse" size={26} aria-hidden="true" />
            Impact Simulator
          </h1>
          <p className="text-slate-400 mt-1 max-w-xl text-sm">
            Drag sliders to simulate shifting habits. Real-time projected improvements update instantly.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors"
        >
          <RefreshCw size={14} /> Reset Baseline
        </button>
      </header>

      {/* Simulator Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Hand: Sliders Panel */}
        <div className="lg:col-span-7 space-y-6">
          {/* Transportation sliders */}
          <Card className="bg-slate-900 border-slate-850">
            <CardHeader title="Transit Adjustments" subtitle="Simulate shifts in travel patterns" />
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-350 flex items-center gap-2">
                    <Car size={16} className="text-slate-500" /> Car Commute Distance
                  </span>
                  <span className="text-white">{simInput.carKmPerWeek} km/wk</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(latest.input.carKmPerWeek * 1.5, 100)}
                  value={simInput.carKmPerWeek}
                  onChange={(e) => handleSliderChange("carKmPerWeek", Number(e.target.value))}
                  className="w-full h-2 bg-slate-950/60 rounded-lg appearance-none cursor-pointer accent-forest-500 border border-slate-850"
                />
                <span className="text-[10px] text-slate-500 font-semibold block">
                  Current baseline: {latest.input.carKmPerWeek} km/week
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-350">Public Transit Commute</span>
                  <span className="text-white">{simInput.publicKmPerWeek} km/wk</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(latest.input.publicKmPerWeek * 1.5, 100)}
                  value={simInput.publicKmPerWeek}
                  onChange={(e) => handleSliderChange("publicKmPerWeek", Number(e.target.value))}
                  className="w-full h-2 bg-slate-950/60 rounded-lg appearance-none cursor-pointer accent-forest-500 border border-slate-850"
                />
                <span className="text-[10px] text-slate-500 font-semibold block">
                  Current baseline: {latest.input.publicKmPerWeek} km/week
                </span>
              </div>
            </div>
          </Card>

          {/* Electricity sliders */}
          <Card className="bg-slate-900 border-slate-850">
            <CardHeader title="Household Utilities" subtitle="Simulate electric utility and renewable load" />
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-350 flex items-center gap-2">
                    <Zap size={16} className="text-slate-500" /> Grid Electricity Use
                  </span>
                  <span className="text-white">{simInput.electricityKwhPerMonth} kWh/mo</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(latest.input.electricityKwhPerMonth * 1.5, 300)}
                  value={simInput.electricityKwhPerMonth}
                  onChange={(e) => handleSliderChange("electricityKwhPerMonth", Number(e.target.value))}
                  className="w-full h-2 bg-slate-950/60 rounded-lg appearance-none cursor-pointer accent-forest-500 border border-slate-850"
                />
                <span className="text-[10px] text-slate-500 font-semibold block">
                  Current baseline: {latest.input.electricityKwhPerMonth} kWh/mo
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-350">Renewable Energy Share</span>
                  <span className="text-white">{simInput.renewableSharePercent}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={simInput.renewableSharePercent}
                  onChange={(e) => handleSliderChange("renewableSharePercent", Number(e.target.value))}
                  className="w-full h-2 bg-slate-950/60 rounded-lg appearance-none cursor-pointer accent-forest-500 border border-slate-850"
                />
                <span className="text-[10px] text-slate-500 font-semibold block">
                  Current baseline: {latest.input.renewableSharePercent}%
                </span>
              </div>
            </div>
          </Card>

          {/* Diet and Waste */}
          <Card className="bg-slate-900 border-slate-850">
            <CardHeader title="Food Pattern & Recyclables" subtitle="Diet shifts and sorting waste efficiency" />
            <div className="space-y-5">
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-slate-350 flex items-center gap-2 mb-1">
                  <UtensilsCrossed size={16} className="text-slate-500" /> Diet Type
                </legend>
                <div className="grid grid-cols-4 gap-2 bg-slate-950/40 p-1.5 rounded-xl border border-slate-855">
                  {(["meat_heavy", "average", "vegetarian", "vegan"] as DietType[]).map((type) => {
                    const isSelected = simInput.dietType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleSliderChange("dietType", type)}
                        className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                          isSelected
                            ? "bg-forest-600 text-white shadow-md shadow-forest-950/20"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {type.replace("_", " ")}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-350">Recycling & Diverted Waste Share</span>
                  <span className="text-white">{simInput.recyclingSharePercent}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={simInput.recyclingSharePercent}
                  onChange={(e) => handleSliderChange("recyclingSharePercent", Number(e.target.value))}
                  className="w-full h-2 bg-slate-950/60 rounded-lg appearance-none cursor-pointer accent-forest-500 border border-slate-850"
                />
                <span className="text-[10px] text-slate-500 font-semibold block">
                  Current baseline: {latest.input.recyclingSharePercent}%
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Hand: real-time feedback board */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-slate-900 border-slate-850 p-6 sticky top-6">
            <h3 className="section-title text-base font-bold mb-4 flex items-center gap-2 border-b border-slate-850 pb-3">
              Real-Time Projection Board
            </h3>

            <div className="space-y-5">
              {/* Main Comparison bar chart */}
              <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-850/80">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    <span>Current Baseline</span>
                    <span className="text-slate-300 font-extrabold">{currentTotal} kg/mo</span>
                  </div>
                  <div className="w-full bg-slate-900 h-4.5 rounded-lg overflow-hidden border border-slate-850">
                    <div className="bg-slate-700 h-full w-full" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    <span>Projected Sandbox</span>
                    <span className="text-forest-400 font-extrabold">{projectedTotal} kg/mo</span>
                  </div>
                  <div className="w-full bg-slate-900 h-4.5 rounded-lg overflow-hidden border border-slate-850">
                    <div
                      className={`h-full transition-all duration-350 ${
                        projectedTotal <= currentTotal ? "bg-forest-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.min((projectedTotal / currentTotal) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Carbon Saved</p>
                  <p className="text-xl font-black text-white mt-1.5">{carbonSaved} kg</p>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">CO₂e / month</p>
                </div>

                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Improvement</p>
                  <p className={`text-xl font-black mt-1.5 ${percentSaved > 0 ? "text-forest-400" : "text-white"}`}>
                    {projectedTotal <= currentTotal ? `+${percentSaved}%` : `-${Math.abs(percentSaved)}%`}
                  </p>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">efficiency increase</p>
                </div>
              </div>

              {/* Climate translation equivalence */}
              {carbonSaved > 0 && (
                <div className="bg-forest-500/10 border border-forest-500/15 rounded-2xl p-4 flex items-start gap-3 text-forest-300">
                  <TreeDeciduous size={20} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white leading-normal">Forest Equivalence</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Maintaining these habits represents carbon offsets equivalent to planting{" "}
                      <span className="font-extrabold text-forest-400">{treesEquiv}</span> mature trees per year!
                    </p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {carbonSaved > 0 ? (
                <div className="pt-2">
                  <Link
                    to="/goals"
                    className="w-full inline-flex items-center justify-center gap-2 bg-forest-600 hover:bg-forest-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-forest-950/20"
                  >
                    Commit: Create Reduction Goal
                  </Link>
                </div>
              ) : (
                <div className="bg-slate-950/20 border border-slate-900 p-4 rounded-2xl flex items-start gap-2.5 text-xs text-slate-400">
                  <Info size={16} className="mt-0.5 text-slate-500 flex-shrink-0" />
                  <p className="leading-relaxed">
                    Drag the sliders to reduce car travel, lower electricity use, switch diet patterns, or recycle more to simulate footprint reductions.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
