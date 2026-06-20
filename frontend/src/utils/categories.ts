import type { FootprintCategory } from "@/types";

export const CATEGORY_META: Record<
  FootprintCategory,
  { label: string; color: string; bgColor: string; textColor: string; emoji: string }
> = {
  transport:   { label: "Transport",    color: "#38bdf8", bgColor: "bg-sky-500/10",    textColor: "text-sky-400",    emoji: "🚗" },
  electricity: { label: "Electricity",  color: "#fbbf24", bgColor: "bg-amber-500/10",  textColor: "text-amber-400",  emoji: "⚡" },
  water:       { label: "Water",        color: "#60a5fa", bgColor: "bg-blue-500/10",   textColor: "text-blue-400",   emoji: "💧" },
  food:        { label: "Food",         color: "#4ade80", bgColor: "bg-forest-500/10", textColor: "text-forest-400", emoji: "🌱" },
  waste:       { label: "Waste",        color: "#a78bfa", bgColor: "bg-violet-500/10", textColor: "text-violet-400", emoji: "♻️" },
  shopping:    { label: "Shopping",     color: "#fb7185", bgColor: "bg-rose-500/10",   textColor: "text-rose-400",   emoji: "🛍️" },
};

export function formatKg(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${Math.round(kg)} kg`;
}

export function formatKgLong(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} tonnes`;
  return `${kg.toFixed(1)} kg`;
}

export function impactColor(label: string): string {
  if (label === "High") return "text-rose-400 bg-rose-500/10";
  if (label === "Medium") return "text-amber-400 bg-amber-500/10";
  return "text-forest-400 bg-forest-500/10";
}
