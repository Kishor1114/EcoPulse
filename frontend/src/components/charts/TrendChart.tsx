import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { TrendPoint } from "@/types";

export function TrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-slate-500">
        Log a few more calculations to see your trend over time.
      </div>
    );
  }

  return (
    <div className="h-56" role="img" aria-label="Line chart showing monthly carbon footprint trend over time">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12 }}
            labelStyle={{ color: "#e2e8f0" }}
            formatter={(value) => [`${value ?? 0} kg CO₂e`, "Footprint"] as [string, string]}
          />
          <Line
            type="monotone"
            dataKey="monthlyKg"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={{ fill: "#22c55e", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
