import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Sparkles, CheckCircle2, Calculator, Target, Info } from "lucide-react";
import { coachApi, goalsApi } from "@/api";
import { useAsync } from "@/hooks";
import { Card, Spinner, EmptyState } from "@/components/ui/Primitives";
import { CATEGORY_META, formatKg, impactColor } from "@/utils/categories";

function getDifficulty(rec: any): "Easy" | "Medium" | "Hard" {
  const title = rec.title.toLowerCase();
  const desc = rec.description.toLowerCase();
  if (
    title.includes("flight") ||
    title.includes("car") ||
    title.includes("solar") ||
    title.includes("electric vehicle") ||
    desc.includes("install solar") ||
    title.includes("commute")
  ) {
    return "Hard";
  }
  if (
    title.includes("led") ||
    title.includes("recycle") ||
    title.includes("thermostat") ||
    title.includes("water") ||
    title.includes("waste") ||
    title.includes("scrap")
  ) {
    return "Easy";
  }
  return "Medium";
}

export function CoachPage() {
  const { data, loading, error } = useAsync(() => coachApi.getRecommendations(), []);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleAddGoal = useCallback(async (rec: any) => {
    setSubmittingId(rec.id);
    try {
      await goalsApi.create({
        title: rec.title,
        category: rec.category,
        goalType: "reduce_percent",
        targetValue: 15,
        unit: "%",
      });
      showToast(`Goal set: ${rec.title}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingId(null);
    }
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  if (loading) return <Spinner label="AI Climate Coach analyzing your habits" />;

  if (error) {
    return (
      <Card className="bg-slate-900 border-slate-850">
        <EmptyState
          title="Diagnostics Required"
          description="Complete the carbon footprint calculator first so the AI coach can analyze your lifestyle and generate customized action cards."
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

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-forest-600 border border-forest-500 text-white font-bold py-3 px-5 rounded-2xl shadow-xl shadow-forest-950/20 animate-fade-in flex items-center gap-2">
          <Sparkles size={16} />
          {toast}
        </div>
      )}

      {/* Header */}
      <header>
        <h1 className="page-title text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Sparkles className="text-forest-400" size={26} aria-hidden="true" />
          AI Carbon Coach
        </h1>
        <p className="text-slate-400 mt-1 max-w-xl text-sm">
          Tailored, high-impact recommendations sorted by importance to help you cut carbon emissions efficiently.
        </p>
      </header>

      {/* Coach Summary Card */}
      <div className="bg-gradient-to-r from-forest-950/20 to-slate-900 border border-forest-500/10 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-forest-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-500/10 flex items-center justify-center text-forest-400 flex-shrink-0 mt-0.5">
            <Info size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Coach Overview</h3>
            <p className="text-slate-300 text-sm mt-1.5 leading-relaxed">{data.summary}</p>
          </div>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      {data.recommendations.length === 0 ? (
        <Card className="bg-slate-900 border-slate-850">
          <EmptyState
            title="Carbon Blueprint Pristine"
            description="Your habits are highly optimized. You have active net-zero patterns across all tracked indicators!"
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {data.recommendations.map((rec, idx) => {
            const meta = CATEGORY_META[rec.category];
            const diff = getDifficulty(rec);
            const isSubmitting = submittingId === rec.id;

            return (
              <Card
                key={rec.id}
                className="bg-slate-900 border-slate-850 p-6 animate-slide-up relative overflow-hidden hover:border-slate-800 transition-colors"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  {/* Badges row */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`badge text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${meta.bgColor} ${meta.textColor}`}>
                      {meta.emoji} {meta.label}
                    </span>
                    <span className={`badge text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${impactColor(rec.impactLabel)}`}>
                      {rec.impactLabel} Priority
                    </span>
                    <span className={`badge text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                      diff === "Easy"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                        : diff === "Medium"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/10"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/10"
                    }`}>
                      {diff} Difficulty
                    </span>
                  </div>

                  <div className="text-sm font-bold text-forest-400 bg-forest-500/5 border border-forest-500/15 rounded-lg px-2.5 py-1">
                    Saves ~{formatKg(rec.estimatedMonthlySavingKg)} CO₂e/mo
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-extrabold text-white tracking-tight">{rec.title}</h3>
                    <p className="text-slate-350 text-sm leading-relaxed">{rec.description}</p>

                    {/* Why this matters block */}
                    <div className="bg-slate-950/40 border border-slate-850/80 rounded-xl p-4 mt-4">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Why This Matters</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{rec.reasoning}</p>
                    </div>

                    {/* Action steps checklist */}
                    <div className="pt-2">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">Suggested Checklist</h4>
                      <ul className="space-y-2">
                        {rec.actionSteps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                            <CheckCircle2 size={15} className="text-forest-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Right hand Action button */}
                  <div className="flex-shrink-0 self-end lg:self-start">
                    <button
                      onClick={() => handleAddGoal(rec)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 text-slate-300 hover:text-white text-xs font-bold py-3 px-4.5 rounded-xl transition-all shadow-sm"
                    >
                      <Target size={15} />
                      {isSubmitting ? "Converting..." : "Convert to Goal"}
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
