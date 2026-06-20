import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  Trophy,
  Target,
  Calculator,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Circle,
  Plus,
  ArrowRight,
  CalendarCheck,
  Award,
} from "lucide-react";
import { dashboardApi, coachApi, goalsApi, actionsApi } from "@/api";
import { useAsync } from "@/hooks";
import { Card, CardHeader, Spinner, ErrorAlert, EmptyState } from "@/components/ui/Primitives";
import { RingChart } from "@/components/charts/RingChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { formatKg } from "@/utils/categories";

function calculateCarbonScore(totalMonthlyKg: number): number {
  if (totalMonthlyKg <= 0) return 100;
  // If user is exactly at average (833), score is 60.
  // If user is at 0, score is 100.
  // If user is at 2000 (very high), score is 10.
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
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      stroke: "#34d399",
      desc: "Your footprint is exceptionally low. Top 5% global citizen!",
      tip: "Focus on offsets to reach absolute net-zero.",
    };
  }
  if (score >= 70) {
    return {
      label: "Good",
      color: "text-forest-400 bg-forest-500/10 border-forest-500/20",
      stroke: "#22c55e",
      desc: "You are doing better than the average. Keep optimizing!",
      tip: "Reduce meat consumption to boost your score above 90.",
    };
  }
  if (score >= 50) {
    return {
      label: "Moderate",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      stroke: "#fbbf24",
      desc: "Your emissions are average. There is room to improve.",
      tip: "Switching to green electricity could increase your score by 15 pts.",
    };
  }
  return {
    label: "Needs Work",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    stroke: "#fb7185",
    desc: "Your emissions are high. Let's use the AI Coach to cut them down!",
    tip: "Use public transit and reduce long-haul flights.",
  };
}

function getSustainabilityLevel(points: number) {
  const lvl = Math.floor(points / 100) + 1;
  const xpInLvl = points % 100;
  let title = "Eco Novice";
  if (lvl === 2) title = "Carbon Cadet";
  else if (lvl === 3) title = "Climate Champion";
  else if (lvl === 4) title = "Green Guardian";
  else if (lvl === 5) title = "Sustainability Sage";
  else if (lvl >= 6) title = "Earth Hero";

  return { lvl, xpInLvl, title };
}

export function DashboardPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [goalLoadingKey, setGoalLoadingKey] = useState<string | null>(null);

  // Custom data loader that fetches dashboard state AND AI recommendations
  const { data, loading, error, refetch } = useAsync(async () => {
    const dash = await dashboardApi.get();
    let recommendations: any[] = [];
    if (dash.footprint) {
      try {
        const coach = await coachApi.getRecommendations();
        recommendations = coach.recommendations;
      } catch (err) {
        console.warn("Failed to load coach recommendations", err);
      }
    }
    return { ...dash, recommendations };
  }, []);

  async function handleActionComplete(key: string) {
    setActionLoadingKey(key);
    try {
      await actionsApi.complete(key);
      showToast("Habit completed! +15 XP");
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingKey(null);
    }
  }

  async function handleConvertRecommendationToGoal(rec: any) {
    setGoalLoadingKey(rec.id);
    try {
      await goalsApi.create({
        title: rec.title,
        category: rec.category,
        goalType: "reduce_percent",
        targetValue: 15,
        unit: "%",
      });
      showToast(`Goal set: ${rec.title}`);
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setGoalLoadingKey(null);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  if (loading) return <Spinner label="Loading executive dashboard" />;
  if (error) return <ErrorAlert message={error} />;
  if (!data) return null;

  const { footprint, trend, goals, todayActions, gamification, recommendations = [] } = data;

  // Compute stats details
  const score = footprint ? calculateCarbonScore(footprint.totalMonthlyKg) : 0;
  const tier = getScoreTier(score);
  const levelInfo = getSustainabilityLevel(gamification.points);

  let improvementPercent = 0;
  let improvementLabel = "vs. Global Average";
  let isPositive = false;

  if (trend && trend.length >= 2) {
    const prev = trend[trend.length - 2].monthlyKg;
    const current = trend[trend.length - 1].monthlyKg;
    if (prev > 0) {
      improvementPercent = Math.round(((prev - current) / prev) * 100);
      improvementLabel = "vs. Last Month";
      isPositive = improvementPercent >= 0;
    }
  } else if (footprint) {
    improvementPercent = Math.round(footprint.vsGlobalAverageMonthlyPercent);
    improvementLabel = "vs. Global Benchmark";
    isPositive = improvementPercent <= 0; // negative vs global average is good
  }

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
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title text-3xl font-extrabold tracking-tight text-white">
            Welcome back, {gamification.streakCount > 0 ? "Champ" : "Friend"}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Here's your climate performance overview for this month.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
          <div className="w-8 h-8 rounded-xl bg-forest-500/10 flex items-center justify-center text-forest-400">
            <Award size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Climate Rank</p>
            <p className="text-xs font-bold text-white leading-tight">{levelInfo.title}</p>
          </div>
        </div>
      </header>

      {!footprint ? (
        <Card className="bg-slate-900/50 border border-slate-900">
          <EmptyState
            title="Dashboard Locked"
            description="Complete your baseline carbon footprint calculation to unlock premium dashboard insights, active goals, and your AI coach."
            action={
              <Link to="/calculator" className="btn-primary">
                <Calculator size={18} aria-hidden="true" />
                Start My Calculation
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {/* Top Row: Core Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Carbon Score Card */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden flex items-center gap-4">
              <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="10" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={tier.stroke}
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * score) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <span className="absolute text-lg font-black text-white">{score}</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Carbon Score</p>
                <p className="text-base font-extrabold text-white mt-0.5">{tier.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight truncate max-w-[130px]">
                  {tier.tip}
                </p>
              </div>
            </div>

            {/* 2. Monthly Emissions */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monthly Footprint</p>
                  <p className="text-2xl font-black text-white mt-1">
                    {formatKg(footprint.totalMonthlyKg)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    CO₂e (yearly: {formatKg(footprint.totalYearlyKg)})
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                  <Calculator size={18} />
                </div>
              </div>
            </div>

            {/* 3. Improvement Percentage */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {improvementLabel}
                  </p>
                  <p className="text-2xl font-black text-white mt-1">
                    {trend && trend.length >= 2 ? (
                      isPositive ? `${improvementPercent}%` : `+${Math.abs(improvementPercent)}%`
                    ) : (
                      `${improvementPercent > 0 ? "+" : ""}${improvementPercent}%`
                    )}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-[10px] font-bold">
                    {trend && trend.length >= 2 ? (
                      isPositive ? (
                        <span className="text-forest-400 flex items-center gap-0.5"><TrendingDown size={12} /> Reduction</span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-0.5"><TrendingUp size={12} /> Increase</span>
                      )
                    ) : (
                      improvementPercent <= 0 ? (
                        <span className="text-forest-400">Below Global Average</span>
                      ) : (
                        <span className="text-rose-400">Above Global Average</span>
                      )
                    )}
                  </div>
                </div>
                <div className={`p-2 rounded-xl ${isPositive || (improvementPercent <= 0 && trend.length < 2) ? "bg-forest-500/10 text-forest-400" : "bg-rose-500/10 text-rose-400"}`}>
                  {isPositive || (improvementPercent <= 0 && trend.length < 2) ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                </div>
              </div>
            </div>

            {/* 4. Streak Tracking */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Streak</p>
                  <p className="text-2xl font-black text-white mt-1">
                    {gamification.streakCount} <span className="text-sm font-semibold text-slate-400">days</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Active check-in habits
                  </p>
                </div>
                <div className={`p-2 rounded-xl ${gamification.streakCount > 0 ? "bg-amber-500/10 text-amber-500 animate-pulse" : "bg-slate-850 text-slate-500"}`}>
                  <Flame size={18} className={gamification.streakCount > 0 ? "fill-amber-500" : ""} />
                </div>
              </div>
            </div>
          </div>

          {/* Second Row: Charts Column */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border border-slate-850">
              <CardHeader title="Emissions Share" subtitle="Category distribution of your footprint" />
              <div className="py-2 flex items-center justify-center">
                <RingChart
                  categories={footprint.categories}
                  totalLabel="kg CO₂e / month"
                  totalValue={formatKg(footprint.totalMonthlyKg)}
                />
              </div>
            </Card>

            <Card className="bg-slate-900 border border-slate-850">
              <CardHeader title="Historical Footprint Trend" subtitle="Monthly emission trajectory" />
              <div className="py-4">
                <TrendChart data={trend} />
              </div>
            </Card>
          </div>

          {/* Third Row: AI Coach Recommendations & Active Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Recommendations */}
            <Card className="bg-slate-900 border border-slate-850">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-forest-400" />
                  <h3 className="section-title text-base font-bold">Priority Recommendations</h3>
                </div>
                <Link to="/coach" className="text-xs text-forest-400 hover:text-forest-300 font-bold flex items-center gap-0.5">
                  See Coach <ArrowRight size={12} />
                </Link>
              </div>

              {recommendations.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  Calculations ready. Tap Coach page to generate recommendations.
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.slice(0, 2).map((rec: any) => (
                    <div key={rec.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 relative overflow-hidden">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
                            rec.impactLabel === "High"
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          } uppercase`}>
                            {rec.impactLabel} Impact
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-850 border border-slate-800 text-slate-400 uppercase">
                            ~{formatKg(rec.estimatedMonthlySavingKg)}/mo saving
                          </span>
                        </div>
                        <button
                          onClick={() => handleConvertRecommendationToGoal(rec)}
                          disabled={goalLoadingKey === rec.id}
                          className="text-[10px] font-bold text-forest-400 hover:text-forest-300 transition-colors border border-forest-500/20 hover:border-forest-500/40 bg-forest-500/5 px-2 py-1 rounded-lg"
                        >
                          {goalLoadingKey === rec.id ? "Setting..." : "Set Goal"}
                        </button>
                      </div>
                      <h4 className="text-sm font-bold text-white">{rec.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-normal">{rec.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Active Goals */}
            <Card className="bg-slate-900 border border-slate-850">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-forest-400" />
                  <h3 className="section-title text-base font-bold">Active Goals</h3>
                </div>
                <Link to="/goals" className="text-xs text-forest-400 hover:text-forest-300 font-bold flex items-center gap-0.5">
                  Manage Goals <ArrowRight size={12} />
                </Link>
              </div>

              <div className="flex items-center gap-6 py-2 px-1">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>Active Goals</span>
                    <span className="font-bold text-white">{goals.active}</span>
                  </div>
                  <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-forest-500 h-full transition-all duration-500"
                      style={{ width: `${goals.active > 0 ? (goals.completed / (goals.active + goals.completed)) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold pt-1">
                    <span>{goals.completed} Completed</span>
                    <span>{goals.active + goals.completed} Total Goals</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-forest-500/10 text-forest-400 flex items-center justify-center font-black flex-shrink-0">
                  {goals.active}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-850 text-center">
                <Link
                  to="/goals"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-950/50 border border-slate-850 hover:border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all"
                >
                  <Plus size={14} /> Create a custom carbon goal
                </Link>
              </div>
            </Card>
          </div>

          {/* Fourth Row: Daily Green Actions & Achievement Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Actions Checklist */}
            <Card className="bg-slate-900 border border-slate-850">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <CalendarCheck size={18} className="text-forest-400" />
                  <h3 className="section-title text-base font-bold">Today's Habits</h3>
                </div>
                <Link to="/actions" className="text-xs text-forest-400 hover:text-forest-300 font-bold flex items-center gap-0.5">
                  See Checklist <ArrowRight size={12} />
                </Link>
              </div>

              {/* Progress today */}
              <div className="flex justify-between items-center text-xs text-slate-400 mb-4 px-1">
                <span>Daily completion rate</span>
                <span className="font-bold text-forest-400">
                  {todayActions.completed} of {todayActions.total}
                </span>
              </div>

              {/* Mini action list */}
              <div className="space-y-2">
                {todayActions.total === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No actions scheduled. Complete calculator to view.
                  </div>
                ) : (
                  // We simulate a basic daily actions list
                  [
                    { key: "unplug_standby", title: "Unplug standby appliances", carbon: "50g", category: "electricity" },
                    { key: "shorter_shower", title: "Take a 5-min shower", carbon: "120g", category: "water" },
                    { key: "zero_waste_lunch", title: "Pack zero-waste lunch", carbon: "180g", category: "food" },
                  ].map((act) => {
                    return (
                      <div
                        key={act.key}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-850 text-xs hover:border-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => handleActionComplete(act.key)}
                            disabled={actionLoadingKey === act.key}
                            className="text-forest-400 hover:text-forest-300"
                          >
                            <Circle size={18} className="text-slate-600" />
                          </button>
                          <span className="font-semibold text-white truncate">{act.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-md">
                          -{act.carbon} CO₂e
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Achievements & Level Progress */}
            <Card className="bg-slate-900 border border-slate-850">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-amber-400" />
                  <h3 className="section-title text-base font-bold">Climate Experience</h3>
                </div>
                <Link to="/achievements" className="text-xs text-forest-400 hover:text-forest-300 font-bold flex items-center gap-0.5">
                  All Badges <ArrowRight size={12} />
                </Link>
              </div>

              {/* Level progress info */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-forest-950/30 to-slate-950/40 border border-forest-500/10 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black text-forest-400 uppercase tracking-widest bg-forest-500/10 px-2.5 py-0.5 rounded-full border border-forest-500/20">
                      Level {levelInfo.lvl}
                    </span>
                    <h4 className="text-sm font-extrabold text-white mt-1.5">{levelInfo.title}</h4>
                  </div>
                  <span className="text-xs font-black text-slate-300 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                    {gamification.points} <span className="text-slate-500 font-semibold text-[10px]">XP</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                    <span>XP towards Level {levelInfo.lvl + 1}</span>
                    <span>{levelInfo.xpInLvl}/100 XP</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                    <div
                      className="bg-forest-500 h-full transition-all duration-700 ease-out"
                      style={{ width: `${levelInfo.xpInLvl}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Achievements state */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                {gamification.badges.slice(0, 3).map((badge) => (
                  <div
                    key={badge.key}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 ${
                      badge.unlocked
                        ? "bg-amber-500/5 border-amber-500/20 text-amber-400"
                        : "bg-slate-950/20 border-slate-900 text-slate-650"
                    }`}
                  >
                    <Trophy size={16} className={badge.unlocked ? "text-amber-400" : "text-slate-700"} />
                    <span className={`text-[9px] font-bold truncate max-w-[80px] ${badge.unlocked ? "text-white" : "text-slate-500"}`}>
                      {badge.title}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
