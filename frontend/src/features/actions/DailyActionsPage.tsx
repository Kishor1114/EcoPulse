import { useState, useCallback, useMemo } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Circle,
  Car,
  Zap,
  Droplets,
  UtensilsCrossed,
  Trash2,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { actionsApi } from "@/api";
import { useAsync } from "@/hooks";
import { Card, Spinner, ErrorAlert, ProgressBar } from "@/components/ui/Primitives";

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  hard: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

function getCategoryIcon(cat: string) {
  const c = cat.toLowerCase();
  if (c.includes("transport") || c.includes("car") || c.includes("travel")) return <Car size={16} />;
  if (c.includes("electricity") || c.includes("power") || c.includes("energy") || c.includes("utility"))
    return <Zap size={16} />;
  if (c.includes("water") || c.includes("shower")) return <Droplets size={16} />;
  if (c.includes("food") || c.includes("diet") || c.includes("lunch") || c.includes("meal"))
    return <UtensilsCrossed size={16} />;
  if (c.includes("waste") || c.includes("recycl")) return <Trash2 size={16} />;
  return <ShoppingBag size={16} />;
}

export function DailyActionsPage() {
  const { data, loading, error, refetch } = useAsync(() => actionsApi.getToday(), []);
  const [completingKey, setCompletingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleComplete = useCallback(async (key: string) => {
    setCompletingKey(key);
    try {
      await actionsApi.complete(key);
      showToast("Habit logged! +15 XP earned");
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingKey(null);
    }
  }, [refetch]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  if (loading) return <Spinner label="Generating today's actions" />;
  if (error) return <ErrorAlert message={error} />;
  if (!data) return null;

  const stats = useMemo(() => {
    const total = data.actions.length;
    const pending = data.actions.filter((a) => !a.completed);
    const completed = data.actions.filter((a) => a.completed);
    const completedCountVal = completed.length;
    const percentVal = total > 0 ? (completedCountVal / total) * 100 : 0;
    return {
      totalActions: total,
      pendingActions: pending,
      completedActions: completed,
      completedCount: completedCountVal,
      percent: percentVal,
    };
  }, [data]);

  const { totalActions, pendingActions, completedActions, completedCount, percent } = stats;

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
          <CalendarCheck className="text-forest-400" size={26} aria-hidden="true" />
          Daily Habit Tracker
        </h1>
        <p className="text-slate-400 mt-1 text-sm max-w-xl">
          Build micro-sustainability routines by logging eco-actions. Earn XP and streaks on completion.
        </p>
      </header>

      {/* Progress metrics */}
      <Card className="bg-slate-900 border-slate-850 p-5">
        <ProgressBar
          percent={percent}
          colorClassName="bg-forest-500"
          label={`${completedCount} of ${totalActions} actions completed today`}
        />
      </Card>

      <div className="space-y-6">
        {/* Pending Actions Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">
            Pending Actions ({pendingActions.length})
          </h3>
          {pendingActions.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-850 bg-slate-900/10 rounded-2xl text-center text-slate-500 text-xs">
              All daily actions logged! You're fully eco-aligned for today. 🌟
            </div>
          ) : (
            pendingActions.map((action) => (
              <Card
                key={action.key}
                className="bg-slate-900 border-slate-850 p-4.5 hover:border-slate-800 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleComplete(action.key)}
                    disabled={completingKey === action.key}
                    aria-label={`Mark "${action.title}" as complete`}
                    className="flex-shrink-0 mt-0.5 text-slate-500 hover:text-forest-400 transition-colors"
                  >
                    <Circle size={22} className="stroke-[2px]" />
                  </button>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-bold text-white text-base leading-tight truncate">{action.title}</h3>
                      <span className={`badge text-[9px] font-black uppercase px-2 py-0.5 rounded border ${DIFFICULTY_COLOR[action.difficulty]}`}>
                        {action.difficulty}
                      </span>
                      <span className="badge text-[9px] font-bold uppercase px-2 py-0.5 rounded border border-slate-800 bg-slate-950/40 text-slate-450 flex items-center gap-1">
                        {getCategoryIcon(action.category)}
                        {action.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{action.description}</p>
                    <p className="text-[10px] text-forest-400 font-extrabold">
                      Projected Saving: ~{action.estimatedSavingGramsCO2}g CO₂e
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Completed Actions Section */}
        {completedActions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">
              Completed Today ({completedActions.length})
            </h3>
            <div className="space-y-3">
              {completedActions.map((action) => (
                <Card key={action.key} className="bg-slate-900/30 border-slate-950 opacity-60 p-4.5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5 text-forest-400">
                      <CheckCircle2 size={22} className="stroke-[2.5px]" />
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="font-bold text-slate-300 text-base leading-tight line-through truncate">
                          {action.title}
                        </h3>
                        <span className="badge text-[9px] font-bold uppercase px-2 py-0.5 rounded border border-slate-950 bg-slate-950/20 text-slate-500">
                          {action.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-through">{action.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="text-sm text-slate-500 text-center border-t border-slate-900 pt-6 mt-6">
        You've completed <span className="font-bold text-slate-300">{data.totalCompletedAllTime}</span> eco habits
        all-time. Keep up the momentum! 🌍
      </footer>
    </div>
  );
}
