import type { ReactNode, CSSProperties } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`card animate-fade-in ${className}`} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="section-title">{title}</h3>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  unit,
  trend,
  trendLabel,
  icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  icon?: ReactNode;
}) {
  const trendColor =
    trend === "up" ? "text-rose-400" : trend === "down" ? "text-forest-400" : "text-slate-400";

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 font-medium">{label}</p>
          <p className="stat-value text-white mt-1">
            {value}
            {unit && <span className="text-base font-medium text-slate-400 ml-1">{unit}</span>}
          </p>
          {trendLabel && <p className={`text-sm mt-1.5 font-medium ${trendColor}`}>{trendLabel}</p>}
        </div>
        {icon && <div className="text-slate-500" aria-hidden="true">{icon}</div>}
      </div>
    </Card>
  );
}

export function ProgressBar({
  percent,
  colorClassName = "bg-forest-500",
  label,
  height = "h-2.5",
}: {
  percent: number;
  colorClassName?: string;
  label?: string;
  height?: string;
}) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>{label}</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        className={`w-full bg-slate-800 rounded-full overflow-hidden ${height}`}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`${height} ${colorClassName} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-slate-400 py-10" role="status">
      <Loader2 className="animate-spin" size={20} aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-4"
    >
      <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="text-center py-12 px-4">
      <p className="text-lg font-medium text-white">{title}</p>
      <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
