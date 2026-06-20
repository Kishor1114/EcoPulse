import { useState, useCallback, useMemo } from "react";
import type { FormEvent } from "react";
import { Plus, Target, Trash2, X, Trophy, CheckCircle2, Calendar, Award } from "lucide-react";
import { goalsApi, extractError } from "@/api";
import { useAsync } from "@/hooks";
import type { CreateGoalInput, GoalCategory, GoalType } from "@/types";
import { Card, Spinner, ErrorAlert, EmptyState } from "@/components/ui/Primitives";

const CATEGORY_OPTIONS: { value: GoalCategory; label: string }[] = [
  { value: "transport", label: "Transport" },
  { value: "electricity", label: "Electricity" },
  { value: "water", label: "Water" },
  { value: "food", label: "Food" },
  { value: "waste", label: "Waste" },
  { value: "shopping", label: "Shopping" },
  { value: "general", label: "General" },
];

const GOAL_TYPE_OPTIONS: { value: GoalType; label: string; hint: string }[] = [
  { value: "reduce_percent", label: "Reduce by %", hint: "e.g. reduce emissions by 10%" },
  { value: "weekly_frequency", label: "Weekly frequency", hint: "e.g. cycle 3 days/week" },
  { value: "absolute_target", label: "Absolute target", hint: "e.g. reach a specific value" },
];

function NewGoalForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<CreateGoalInput>({
    title: "",
    category: "transport",
    goalType: "reduce_percent",
    targetValue: 10,
    baselineValue: 0,
    unit: "%",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await goalsApi.create(form);
      onCreated();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-850 max-w-xl mx-auto">
      <div className="flex justify-between items-start mb-4 border-b border-slate-850 pb-3">
        <h3 className="section-title text-base font-bold">Create New Goal</h3>
        <button onClick={onCancel} aria-label="Cancel" className="text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <ErrorAlert message={error} />}

        <div>
          <label htmlFor="goal-title" className="label text-xs font-bold text-slate-400">Goal title</label>
          <input
            id="goal-title"
            required
            minLength={3}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="input w-full mt-1.5 focus:border-forest-500"
            placeholder="Reduce grid electricity usage"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="goal-category" className="label text-xs font-bold text-slate-400">Category</label>
            <select
              id="goal-category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as GoalCategory }))}
              className="input w-full mt-1.5 focus:border-forest-500"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="goal-type" className="label text-xs font-bold text-slate-400">Goal type</label>
            <select
              id="goal-type"
              value={form.goalType}
              onChange={(e) => setForm((f) => ({ ...f, goalType: e.target.value as GoalType }))}
              className="input w-full mt-1.5 focus:border-forest-500"
            >
              {GOAL_TYPE_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="goal-target" className="label text-xs font-bold text-slate-400">Target value</label>
            <input
              id="goal-target"
              type="number"
              required
              min={0.01}
              step="any"
              value={form.targetValue}
              onChange={(e) => setForm((f) => ({ ...f, targetValue: Number(e.target.value) }))}
              className="input w-full mt-1.5 focus:border-forest-500"
            />
          </div>
          <div>
            <label htmlFor="goal-unit" className="label text-xs font-bold text-slate-400">Unit</label>
            <input
              id="goal-unit"
              required
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              className="input w-full mt-1.5 focus:border-forest-500"
              placeholder="%, km, days"
            />
          </div>
        </div>

        {form.goalType === "reduce_percent" && (
          <div>
            <label htmlFor="goal-baseline" className="label text-xs font-bold text-slate-400">Current baseline value</label>
            <input
              id="goal-baseline"
              type="number"
              min={0}
              step="any"
              value={form.baselineValue}
              onChange={(e) => setForm((f) => ({ ...f, baselineValue: Number(e.target.value) }))}
              className="input w-full mt-1.5 focus:border-forest-500"
            />
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3 font-bold mt-2">
          {submitting ? "Saving..." : "Create Goal"}
        </button>
      </form>
    </Card>
  );
}

export function GoalsPage() {
  const { data: rawGoals, loading, error, refetch } = useAsync(() => goalsApi.list(), []);
  const goals = rawGoals || [];
  const [showForm, setShowForm] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [celebratedGoalTitle, setCelebratedGoalTitle] = useState<string | null>(null);

  const handleProgressUpdate = useCallback(async (goal: any, value: number) => {
    setUpdatingId(goal.id);
    try {
      await goalsApi.updateProgress(goal.id, value);

      // If the goal is newly completed, trigger the celebration
      if (value >= goal.target_value && goal.status !== "completed") {
        setCelebratedGoalTitle(goal.title);
      }

      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  }, [refetch]);

  const handleDelete = useCallback(async (id: number) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      await goalsApi.delete(id);
      await refetch();
    }
  }, [refetch]);

  const completedGoals = useMemo(() => goals.filter((g) => g.status === "completed"), [goals]);
  const completedCount = useMemo(() => completedGoals.length, [completedGoals]);

  // Milestone mapping
  const milestones = [
    { key: "first", title: "Eco Cadet Milestone", req: 1, desc: "Successfully complete 1 goal" },
    { key: "three", title: "Climate Advocate", req: 3, desc: "Successfully complete 3 goals" },
    { key: "five", title: "Sustainability Sage", req: 5, desc: "Successfully complete 5 goals" },
  ];

  return (
    <div className="space-y-6">
      {/* Celebration Modal Overlay */}
      {celebratedGoalTitle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-forest-500/20 max-w-sm w-full mx-4 rounded-3xl p-8 text-center space-y-5 shadow-2xl relative overflow-hidden animate-scale-up">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-forest-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="w-16 h-16 rounded-full bg-forest-500/10 border border-forest-500/20 text-forest-400 flex items-center justify-center mx-auto animate-pulse">
              <Trophy size={32} className="stroke-[2.5px]" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black text-forest-400 uppercase tracking-widest bg-forest-500/10 px-2.5 py-0.5 rounded-full border border-forest-500/20">
                Goal Unlocked!
              </span>
              <h3 className="text-xl font-extrabold text-white leading-tight">Congratulations!</h3>
              <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                You successfully reached your target for:
                <span className="font-extrabold text-slate-200 block mt-1">"{celebratedGoalTitle}"</span>
              </p>
            </div>
            <button
              onClick={() => setCelebratedGoalTitle(null)}
              className="w-full bg-forest-600 hover:bg-forest-500 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-forest-950/20"
            >
              Collect Rewards (+50 XP)
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Target className="text-forest-400" size={26} aria-hidden="true" />
            Goal Orchestration
          </h1>
          <p className="text-slate-400 mt-1 text-sm max-w-xl">
            Set custom carbon reduction metrics and track real-time visual progress indicators.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary inline-flex items-center gap-1.5 shadow-md shadow-forest-950/20"
          >
            <Plus size={18} aria-hidden="true" />
            New Goal
          </button>
        )}
      </header>

      {showForm && (
        <NewGoalForm
          onCreated={() => {
            setShowForm(false);
            refetch();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Grid of stats header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Goals listing */}
        <div className="lg:col-span-8 space-y-4">
          {loading ? (
            <Spinner label="Loading active goals" />
          ) : error ? (
            <ErrorAlert message={error} />
          ) : goals.length === 0 ? (
            <Card className="bg-slate-900 border-slate-850">
              <EmptyState
                title="Carbon Goals Empty"
                description="You don't have any carbon reduction goals yet. Create a goal to commit to active carbon reduction."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => {
                const percent = Math.round(Math.min(Math.max(goal.progressPercent, 0), 100));
                const radius = 22;
                const circum = 2 * Math.PI * radius;
                const strokeOffset = circum - (percent / 100) * circum;

                return (
                  <Card
                    key={goal.id}
                    className="bg-slate-900 border-slate-850 hover:border-slate-800 transition-colors p-5 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <span className="text-[9px] font-black text-forest-400 uppercase tracking-widest bg-forest-500/10 px-2 py-0.5 rounded border border-forest-500/15">
                          {goal.category}
                        </span>
                        <h3 className="font-bold text-white text-base mt-2 truncate max-w-[180px]" title={goal.title}>
                          {goal.title}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">
                          Type: {goal.goal_type.replace("_", " ")}
                        </p>
                      </div>

                      {/* Visual Circular Progress Ring */}
                      <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 50 50">
                          <circle cx="25" cy="25" r="22" stroke="#1e293b" strokeWidth="5.5" fill="transparent" />
                          <circle
                            cx="25"
                            cy="25"
                            r="22"
                            stroke={goal.status === "completed" ? "#22c55e" : "#38bdf8"}
                            strokeWidth="5.5"
                            fill="transparent"
                            strokeDasharray={circum}
                            strokeDashoffset={strokeOffset}
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>
                        <span className="absolute text-[10px] font-black text-white">
                          {percent}%
                        </span>
                      </div>
                    </div>

                    {/* Progress tracking display values */}
                    <div className="mt-4 bg-slate-950/30 p-2.5 rounded-xl border border-slate-850/50 flex justify-between text-xs text-slate-400 font-semibold">
                      <span>Baseline: {goal.baseline_value} {goal.unit}</span>
                      <span>Target: {goal.target_value} {goal.unit}</span>
                    </div>

                    {/* Input interaction for active goal */}
                    {goal.status !== "completed" ? (
                      <div className="mt-4 flex items-center gap-2 border-t border-slate-850/80 pt-3.5">
                        <div className="flex-1">
                          <label htmlFor={`update-${goal.id}`} className="sr-only">
                            Update {goal.title} progress
                          </label>
                          <input
                            id={`update-${goal.id}`}
                            type="number"
                            defaultValue={goal.current_value}
                            step="any"
                            disabled={updatingId === goal.id}
                            className="input w-full py-1.5 px-3 text-xs bg-slate-950 border-slate-850 text-center font-bold focus:border-forest-500"
                            placeholder="Current value"
                            onBlur={(e) => {
                              const val = Number(e.target.value);
                              if (!Number.isNaN(val)) handleProgressUpdate(goal, val);
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{goal.unit}</span>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          aria-label="Delete goal"
                          className="p-2 bg-rose-500/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border border-rose-500/5 rounded-xl transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center justify-between border-t border-slate-850/80 pt-3.5 text-xs text-forest-400 font-bold">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={14} /> Completed!
                        </span>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          aria-label="Delete goal"
                          className="p-1.5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-450 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Milestones & Weekly check-in calendar panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Weekly progress grid */}
          <Card className="bg-slate-900 border-slate-850 p-5">
            <h3 className="section-title text-base font-bold flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
              <Calendar size={18} className="text-forest-400" /> Weekly Check-In
            </h3>
            <p className="text-xs text-slate-400 leading-normal mb-3">
              Maintain your streak count by updating goals or check-marking daily eco-actions.
            </p>
            {/* Mon-Sun bubble trackers */}
            <div className="flex justify-between items-center py-2 px-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => {
                // mock lights on based on current completed status
                const isLit = idx < 4; // visual filler mockup representing streak progress
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-bold">{day}</span>
                    <div
                      className={`w-8.5 h-8.5 rounded-full flex items-center justify-center text-xs font-black border transition-all ${
                        isLit
                          ? "bg-forest-600 border-forest-500 text-white shadow-md shadow-forest-950/20"
                          : "bg-slate-950/40 border-slate-850 text-slate-500"
                      }`}
                    >
                      {isLit ? <CheckCircle2 size={13} /> : idx + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Milestones Panel */}
          <Card className="bg-slate-900 border-slate-850 p-5">
            <h3 className="section-title text-base font-bold flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
              <Award size={18} className="text-amber-400" /> Goal Milestones
            </h3>

            <div className="space-y-4">
              {milestones.map((m) => {
                const isMet = completedCount >= m.req;
                return (
                  <div
                    key={m.key}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                      isMet
                        ? "bg-amber-500/5 border-amber-500/15 text-amber-400"
                        : "bg-slate-950/30 border-slate-900 text-slate-600"
                    }`}
                  >
                    <Trophy size={18} className={`mt-0.5 ${isMet ? "text-amber-400" : "text-slate-700"}`} />
                    <div>
                      <h4 className={`text-xs font-bold leading-normal ${isMet ? "text-white" : "text-slate-400"}`}>
                        {m.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{m.desc}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-24 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850">
                          <div
                            className={`h-full ${isMet ? "bg-amber-500" : "bg-slate-700"}`}
                            style={{ width: `${Math.min((completedCount / m.req) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-slate-500">
                          {Math.min(completedCount, m.req)}/{m.req}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
