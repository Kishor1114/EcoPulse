import type { CategoryResult } from "@/types";
import { CATEGORY_META, formatKg } from "@/utils/categories";

interface RingChartProps {
  categories: CategoryResult[];
  totalLabel: string;
  totalValue: string;
  size?: number;
}

/**
 * A multi-ring donut chart: each category gets its own concentric arc sized
 * by its share of the total, rather than a single stacked ring. This keeps
 * every category visually distinct and readable even when several are close
 * in value, which a single stacked donut tends to obscure.
 */
export function RingChart({ categories, totalLabel, totalValue, size = 220 }: RingChartProps) {
  const sorted = [...categories].sort((a, b) => b.monthlyKg - a.monthlyKg);
  const strokeWidth = 14;
  const gap = 6;
  const center = size / 2;
  const baseRadius = center - strokeWidth;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          {sorted.map((cat, i) => {
            const radius = baseRadius - i * (strokeWidth + gap);
            if (radius <= 0) return null;
            const circumference = 2 * Math.PI * radius;
            const pct = Math.min(cat.percentOfTotal, 100) / 100;
            const dash = circumference * pct;
            const meta = CATEGORY_META[cat.category];
            return (
              <g key={cat.category} transform={`rotate(-90 ${center} ${center})`}>
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={meta.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </g>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="text-2xl font-bold text-white leading-tight">{totalValue}</p>
          <p className="text-xs text-slate-400 mt-0.5">{totalLabel}</p>
        </div>
      </div>

      {/* Screen-reader and low-vision friendly data table, visually hidden but always present */}
      <table className="sr-only">
        <caption>Carbon footprint breakdown by category</caption>
        <thead>
          <tr><th>Category</th><th>Monthly emissions</th><th>Share of total</th></tr>
        </thead>
        <tbody>
          {sorted.map((cat) => (
            <tr key={cat.category}>
              <td>{CATEGORY_META[cat.category].label}</td>
              <td>{formatKg(cat.monthlyKg)} CO₂e</td>
              <td>{cat.percentOfTotal}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Visible legend doubles as the accessible description of the chart */}
      <ul className="grid grid-cols-2 gap-2 mt-5 w-full max-w-xs" aria-label="Category legend">
        {sorted.map((cat) => {
          const meta = CATEGORY_META[cat.category];
          return (
            <li key={cat.category} className="flex items-center gap-2 text-sm">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: meta.color }}
                aria-hidden="true"
              />
              <span className="text-slate-300 truncate">{meta.label}</span>
              <span className="text-slate-500 ml-auto">{cat.percentOfTotal}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
