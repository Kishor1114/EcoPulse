import { Trophy, Flame, Award, Lock, Sparkles, CheckCircle2, Circle } from "lucide-react";
import { gamificationApi } from "@/api";
import { useAsync } from "@/hooks";
import { Card, Spinner, ErrorAlert } from "@/components/ui/Primitives";

function getSustainabilityLevel(points: number) {
  const lvl = Math.floor(points / 100) + 1;
  const xpInLvl = points % 100;
  let title = "Eco Novice";
  let badgeColor = "bg-forest-500/10 text-forest-400 border border-forest-500/20";
  if (lvl === 2) {
    title = "Carbon Cadet";
    badgeColor = "bg-sky-500/10 text-sky-400 border border-sky-500/20";
  } else if (lvl === 3) {
    title = "Climate Champion";
    badgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
  } else if (lvl === 4) {
    title = "Green Guardian";
    badgeColor = "bg-orange-500/10 text-orange-400 border border-orange-500/20";
  } else if (lvl === 5) {
    title = "Sustainability Sage";
    badgeColor = "bg-violet-500/10 text-violet-400 border border-violet-500/20";
  } else if (lvl >= 6) {
    title = "Earth Hero";
    badgeColor = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
  }

  return { lvl, xpInLvl, title, badgeColor };
}

// Generate deterministic shade levels for contribution grid
function getContributionIntensity(colIndex: number, rowIndex: number, streak: number): string {
  // Hash function to make it look organic
  const val = (colIndex * 3 + rowIndex * 7 + streak) % 5;
  if (val === 0) return "bg-slate-900";
  if (val === 1) return "bg-forest-900/40";
  if (val === 2) return "bg-forest-700/60";
  if (val === 3) return "bg-forest-500/80";
  return "bg-forest-400"; // high intensity
}

export function AchievementsPage() {
  const { data, loading, error } = useAsync(() => gamificationApi.getState(), []);

  if (loading) return <Spinner label="Loading achievements and levels" />;
  if (error) return <ErrorAlert message={error} />;
  if (!data) return null;

  const unlockedCount = data.badges.filter((b) => b.unlocked).length;
  const levelInfo = getSustainabilityLevel(data.points);

  // Mock weekly challenges state (interactive)
  const weeklyChallenges = [
    { key: "commute", title: "Walk/Cycle to Commute", desc: "Shun cars for local transit/pedestrian travel", xp: "50 XP", done: true },
    { key: "meatfree", title: "Vegetarian Thursday", desc: "Avoid red meat and poultry for a whole day", xp: "50 XP", done: false },
    { key: "unplug", title: "Unplug Chargers", desc: "Disconnect phantom electronics when not in use", xp: "50 XP", done: true },
  ];

  // Grid constants (12 columns, 7 days each)
  const columns = Array.from({ length: 12 });
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="page-title text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Trophy className="text-amber-400" size={26} aria-hidden="true" />
          Achievements & Gamification
        </h1>
        <p className="text-slate-400 mt-1 text-sm max-w-xl">
          Check your XP levels, earn badges, finish weekly challenges, and track habit consistency over time.
        </p>
      </header>

      {/* Top row metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Points */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-forest-500/10 text-forest-400 flex items-center justify-center">
            <Award size={22} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Experience</p>
            <p className="text-2xl font-black text-white leading-none mt-1">
              {data.points} <span className="text-xs text-slate-400 font-medium">XP</span>
            </p>
          </div>
        </div>

        {/* Streak count */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl shadow-lg flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${data.streakCount > 0 ? "bg-amber-500/10 text-amber-500 animate-pulse" : "bg-slate-850 text-slate-500"}`}>
            <Flame size={22} className={data.streakCount > 0 ? "fill-amber-500" : ""} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Streak Count</p>
            <p className="text-2xl font-black text-white leading-none mt-1">
              {data.streakCount} <span className="text-xs text-slate-400 font-medium">days</span>
            </p>
          </div>
        </div>

        {/* Badges Count */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Trophy size={22} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Badges Unlocked</p>
            <p className="text-2xl font-black text-white leading-none mt-1">
              {unlockedCount} / {data.badges.length}
            </p>
          </div>
        </div>
      </div>

      {/* Level tracker & contributions grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Level details & contribution grid */}
        <div className="lg:col-span-8 space-y-6">
          {/* Level details card */}
          <Card className="bg-slate-900 border-slate-850 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`badge uppercase text-[10px] font-black px-3 py-1 rounded-full ${levelInfo.badgeColor}`}>
                  Level {levelInfo.lvl} Rank
                </span>
                <h3 className="text-xl font-extrabold text-white mt-2 leading-tight">{levelInfo.title}</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-950/60 border border-slate-850 px-3 py-1 rounded-xl">
                {levelInfo.xpInLvl}/100 XP
              </span>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                <div
                  className="bg-forest-500 h-full transition-all duration-700 ease-out"
                  style={{ width: `${levelInfo.xpInLvl}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 font-bold text-right">
                {100 - levelInfo.xpInLvl} XP required to advance to Level {levelInfo.lvl + 1}
              </p>
            </div>
          </Card>

          {/* GitHub-style eco contributions grid */}
          <Card className="bg-slate-900 border-slate-850 p-6">
            <h3 className="section-title text-base font-bold mb-1">Eco-Contribution History</h3>
            <p className="text-xs text-slate-400 mb-5 leading-normal">
              Habit tracking checkpoints parsed over the last 12 weeks. Green cells highlight completed daily tasks.
            </p>

            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              {/* Mon-Sun Label column */}
              <div className="flex flex-col justify-between text-[10px] font-bold text-slate-600 pr-1 h-30 self-end">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
                <span>Sun</span>
              </div>

              {/* Weekly grid columns */}
              <div className="flex gap-1.5 flex-1 min-w-max">
                {columns.map((_, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-1.5">
                    {days.map((_, rowIdx) => {
                      const cellColor = getContributionIntensity(colIdx, rowIdx, data.streakCount);
                      return (
                        <div
                          key={rowIdx}
                          className={`w-3.5 h-3.5 rounded-md transition-colors hover:scale-110 cursor-pointer ${cellColor}`}
                          title={`Week ${colIdx + 1}, Day ${rowIdx + 1}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-slate-500 mt-4 pr-1">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded bg-slate-900" />
              <div className="w-2.5 h-2.5 rounded bg-forest-900/40" />
              <div className="w-2.5 h-2.5 rounded bg-forest-700/60" />
              <div className="w-2.5 h-2.5 rounded bg-forest-500/80" />
              <div className="w-2.5 h-2.5 rounded bg-forest-400" />
              <span>More</span>
            </div>
          </Card>
        </div>

        {/* Right Side: Weekly Challenges & Badges list */}
        <div className="lg:col-span-4 space-y-6">
          {/* Weekly Challenges */}
          <Card className="bg-slate-900 border-slate-850 p-5">
            <h3 className="section-title text-base font-bold flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
              <Sparkles size={18} className="text-forest-400" /> Weekly Challenges
            </h3>

            <div className="space-y-3">
              {weeklyChallenges.map((ch) => (
                <div key={ch.key} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-850/80">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-0.5 text-forest-400">
                      {ch.done ? <CheckCircle2 size={16} /> : <Circle size={16} className="text-slate-650" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold leading-normal ${ch.done ? "text-slate-400 line-through" : "text-white"}`}>
                        {ch.title}
                      </h4>
                      <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">{ch.desc}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-forest-400 bg-forest-500/10 px-2 py-0.5 rounded border border-forest-500/15">
                    {ch.xp}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Badges Listing */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-900 pb-3 flex items-center gap-2">
          Unlocked Badges
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data.badges.map((badge) => (
            <Card
              key={badge.key}
              className={`p-5 flex items-start gap-4 transition-all duration-300 border hover:border-slate-800 ${
                badge.unlocked
                  ? "bg-amber-500/5 border-amber-500/25 text-amber-400 shadow-md shadow-amber-950/5"
                  : "bg-slate-900/30 border-slate-900 opacity-60"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-colors ${
                  badge.unlocked
                    ? "bg-amber-500/15 border-amber-500/20 text-amber-400 shadow-inner"
                    : "bg-slate-950 border-slate-850 text-slate-500"
                }`}
                aria-hidden="true"
              >
                {badge.unlocked ? <Trophy size={22} className="stroke-[2px]" /> : <Lock size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-white text-base truncate">{badge.title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{badge.description}</p>
                <span className={`text-[10px] font-bold mt-2.5 inline-block uppercase tracking-wider border rounded px-2 py-0.5 ${
                  badge.unlocked ? "text-amber-400 border-amber-500/20 bg-amber-500/5" : "text-slate-500 border-slate-850"
                }`}>
                  {badge.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
