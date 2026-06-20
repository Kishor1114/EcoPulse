import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Calculator as CalcIcon,
  Car,
  Zap,
  Droplets,
  UtensilsCrossed,
  Trash2,
  ShoppingBag,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { footprintApi, extractError } from "@/api";
import type { FootprintInput, FootprintResult, DietType } from "@/types";
import { Card, CardHeader, ErrorAlert } from "@/components/ui/Primitives";
import { RingChart } from "@/components/charts/RingChart";
import { formatKg, formatKgLong } from "@/utils/categories";

const DEFAULT_INPUT: FootprintInput = {
  carKmPerWeek: 80,
  publicKmPerWeek: 20,
  shortFlightsPerYear: 1,
  longFlightsPerYear: 0,
  electricityKwhPerMonth: 250,
  renewableSharePercent: 10,
  waterLitersPerDay: 130,
  dietType: "average",
  foodWastePercent: 15,
  wasteKgPerWeek: 6,
  recyclingSharePercent: 30,
  shoppingSpendPerMonth: 250,
};

const DIET_OPTIONS: { value: DietType; label: string; description: string }[] = [
  { value: "meat_heavy", label: "Meat-heavy", description: "Meat with most meals" },
  { value: "average", label: "Average", description: "Mixed diet, meat a few times a week" },
  { value: "vegetarian", label: "Vegetarian", description: "No meat or fish" },
  { value: "vegan", label: "Vegan", description: "No animal products" },
];

function calculateCarbonScore(totalMonthlyKg: number): number {
  if (totalMonthlyKg <= 0) return 100;
  let score = 100 - (totalMonthlyKg / 833) * 40;
  if (score < 10) {
    score = Math.max(5, Math.round(20 - (totalMonthlyKg / 1666) * 10));
  }
  return Math.min(100, Math.max(0, Math.round(score)));
}

function getScoreTier(score: number) {
  if (score >= 90) {
    return {
      label: "Excellent",
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
      stroke: "#34d399",
      desc: "Your footprint is exceptionally low. Top 5% global citizenship!",
      tip: "You're leading the charge. Focus on secondary offset mechanisms now.",
    };
  }
  if (score >= 70) {
    return {
      label: "Good",
      color: "text-forest-400 border-forest-500/20 bg-forest-500/5",
      stroke: "#22c55e",
      desc: "You are doing better than the average. Keep optimizing!",
      tip: "Try switching 20% more travel to public transit or cycling.",
    };
  }
  if (score >= 50) {
    return {
      label: "Moderate",
      color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
      stroke: "#fbbf24",
      desc: "Your emissions are average. There is room to improve.",
      tip: "Switching utility tariffs to 100% renewables is your highest leverage action.",
    };
  }
  return {
    label: "Needs Work",
    color: "text-rose-400 border-rose-500/20 bg-rose-500/5",
    stroke: "#fb7185",
    desc: "Your emissions are high. Let's use the AI Coach to cut them down!",
    tip: "Halve car usage or transition your diet to vegetarian to quickly boost your score.",
  };
}

function NumberField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = 10000,
  step = 1,
  unit,
  icon,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="label flex items-center gap-2 text-sm font-semibold text-slate-300">
        {icon && <span className="text-slate-500">{icon}</span>}
        {label}
      </label>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-forest-500"
          aria-describedby={`${id}-value`}
        />
        <div className="flex items-center gap-2 w-28 flex-shrink-0 self-end sm:self-auto">
          <input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="input py-1.5 px-3 text-sm text-center w-20 font-bold bg-slate-900 border-slate-800 focus:border-forest-500"
            id={`${id}-value`}
            aria-label={`${label} value`}
          />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{unit}</span>
        </div>
      </div>
    </div>
  );
}

export function CalculatorPage() {
  const [input, setInput] = useState<FootprintInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<FootprintResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FootprintInput>(key: K, value: FootprintInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const r = await footprintApi.calculate(input);
      setResult(r);
      setTimeout(() => {
        document.getElementById("result-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const score = result ? calculateCarbonScore(result.totalMonthlyKg) : 0;
  const scoreTier = getScoreTier(score);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="page-title text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <CalcIcon className="text-forest-400" />
          Carbon Footprint Calculator
        </h1>
        <p className="text-slate-400 mt-1 max-w-xl text-sm">
          Fine-tune details about your travel, utility bills, food consumption, and waste habits. Your inputs are kept secure locally.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {error && <ErrorAlert message={error} />}

        {/* Transportation */}
        <Card className="bg-slate-900 border-slate-850">
          <CardHeader title="Transportation Metrics" subtitle="How do you travel each week?" />
          <div className="space-y-4">
            <NumberField id="carKm" label="Weekly Private Car Commute" value={input.carKmPerWeek} onChange={(v) => update("carKmPerWeek", v)} max={1000} unit="km" icon={<Car size={16} />} />
            <NumberField id="publicKm" label="Weekly Public Transit (Bus/Train)" value={input.publicKmPerWeek} onChange={(v) => update("publicKmPerWeek", v)} max={1000} unit="km" />
            <NumberField id="shortFlights" label="Short flights (< 1,500km)" value={input.shortFlightsPerYear} onChange={(v) => update("shortFlightsPerYear", v)} max={50} unit="/yr" />
            <NumberField id="longFlights" label="Long-haul flights (> 1,500km)" value={input.longFlightsPerYear} onChange={(v) => update("longFlightsPerYear", v)} max={20} unit="/yr" />
          </div>
        </Card>

        {/* Utilities */}
        <Card className="bg-slate-900 border-slate-850">
          <CardHeader title="Home Utilities" subtitle="Average monthly utility throughput" />
          <div className="space-y-4">
            <NumberField id="electricity" label="Grid Electricity Usage" value={input.electricityKwhPerMonth} onChange={(v) => update("electricityKwhPerMonth", v)} max={2000} unit="kWh" icon={<Zap size={16} />} />
            <NumberField id="renewable" label="Utility Renewable Power Share" value={input.renewableSharePercent} onChange={(v) => update("renewableSharePercent", v)} max={100} unit="%" />
            <NumberField id="water" label="Daily Water Utilization" value={input.waterLitersPerDay} onChange={(v) => update("waterLitersPerDay", v)} max={1000} unit="liters" icon={<Droplets size={16} />} />
          </div>
        </Card>

        {/* Diet */}
        <Card className="bg-slate-900 border-slate-850">
          <CardHeader title="Nutrition & Diet" subtitle="What are your food consumption patterns?" />
          <div className="space-y-5">
            <fieldset>
              <legend className="label mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-300">
                <UtensilsCrossed size={16} className="text-slate-500" />
                Primary Diet Pattern
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DIET_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex flex-col gap-1 border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                      input.dietType === opt.value
                        ? "border-forest-500 bg-forest-500/5 shadow-md shadow-forest-950/10"
                        : "border-slate-850 bg-slate-950/20 hover:border-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="dietType"
                        value={opt.value}
                        checked={input.dietType === opt.value}
                        onChange={() => update("dietType", opt.value)}
                        className="w-4 h-4 accent-forest-500 focus:ring-forest-500 bg-slate-850 border-slate-700"
                      />
                      <span className="font-bold text-white text-sm">{opt.label}</span>
                    </span>
                    <span className="text-xs text-slate-400 ml-6.5 leading-normal">{opt.description}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="pt-2">
              <NumberField id="foodWaste" label="Estimated Food Wasted (Discarded Share)" value={input.foodWastePercent} onChange={(v) => update("foodWastePercent", v)} max={100} unit="%" />
            </div>
          </div>
        </Card>

        {/* Waste */}
        <Card className="bg-slate-900 border-slate-850">
          <CardHeader title="Waste Management" subtitle="Weekly waste output" />
          <div className="space-y-4">
            <NumberField id="waste" label="Weekly General Landfill Waste" value={input.wasteKgPerWeek} onChange={(v) => update("wasteKgPerWeek", v)} max={50} unit="kg" icon={<Trash2 size={16} />} />
            <NumberField id="recycling" label="Share of Materials Recycled/Composted" value={input.recyclingSharePercent} onChange={(v) => update("recyclingSharePercent", v)} max={100} unit="%" />
          </div>
        </Card>

        {/* Shopping */}
        <Card className="bg-slate-900 border-slate-850">
          <CardHeader title="Consumer Spending" subtitle="Discretionary monthly purchases" />
          <NumberField id="shopping" label="Goods & Services Purchases" value={input.shoppingSpendPerMonth} onChange={(v) => update("shoppingSpendPerMonth", v)} max={5000} step={10} unit="$" icon={<ShoppingBag size={16} />} />
        </Card>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full sm:w-auto justify-center py-3.5 px-6 font-bold shadow-lg shadow-forest-950/40"
        >
          <CalcIcon size={18} aria-hidden="true" />
          {submitting ? "Processing Diagnostics…" : "Calculate Footprint"}
        </button>
      </form>

      {/* Results Section */}
      {result && (
        <section aria-labelledby="result-heading" className="space-y-6 pt-6 border-t border-slate-900">
          <h2 id="result-heading" className="text-xl font-bold text-white tracking-tight">
            Diagnostic Analysis Results
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category breakdown (donut) */}
            <Card className="bg-slate-900 border-slate-850 lg:col-span-1">
              <CardHeader title="Category Breakdown" />
              <div className="py-2">
                <RingChart
                  categories={result.categories}
                  totalLabel="kg CO₂e / month"
                  totalValue={formatKg(result.totalMonthlyKg)}
                />
              </div>
            </Card>

            {/* Carbon Score Progress Ring widget */}
            <Card className="bg-slate-900 border-slate-850 lg:col-span-1 flex flex-col justify-between">
              <div>
                <CardHeader title="Carbon Score" subtitle="Eco-friendliness index (0-100)" />
                <div className="flex flex-col items-center py-4">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={scoreTier.stroke}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * score) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-black text-white">{score}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Index</span>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <span className={`badge border font-black uppercase text-xs px-3 py-1 rounded-full ${scoreTier.color}`}>
                      {scoreTier.label} Tier
                    </span>
                    <p className="text-xs text-slate-400 mt-2.5 max-w-[220px] leading-relaxed mx-auto">
                      {scoreTier.desc}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-2 bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 text-xs">
                <p className="font-bold text-slate-300">Improvement Focus:</p>
                <p className="text-slate-400 mt-1 leading-normal">{scoreTier.tip}</p>
              </div>
            </Card>

            {/* Overview Stats */}
            <Card className="bg-slate-900 border-slate-850 lg:col-span-1 flex flex-col justify-between">
              <div>
                <CardHeader title="Emissions Summary" subtitle="Baseline values" />
                <div className="space-y-4 mt-2">
                  <div className="bg-slate-950/40 border border-slate-850/80 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Projected Annual Total</span>
                    <h4 className="text-2xl font-black text-white mt-1">
                      {formatKgLong(result.totalYearlyKg)} CO₂e
                    </h4>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-850/80 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">vs. Global Average</span>
                    <div className="flex items-center gap-2 mt-1">
                      <h4 className={`text-xl font-bold ${result.vsGlobalAverageMonthlyPercent > 0 ? "text-rose-400" : "text-forest-400"}`}>
                        {result.vsGlobalAverageMonthlyPercent > 0 ? "+" : ""}
                        {result.vsGlobalAverageMonthlyPercent}%
                      </h4>
                      <span className="text-xs text-slate-400">
                        {result.vsGlobalAverageMonthlyPercent > 0 ? "above standard" : "below standard"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Link
                  to="/coach"
                  className="w-full inline-flex items-center justify-center gap-2 bg-forest-600 hover:bg-forest-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-forest-950/20"
                >
                  <Sparkles size={16} />
                  Analyze with AI Coach
                  <ArrowRight size={14} />
                </Link>
              </div>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
