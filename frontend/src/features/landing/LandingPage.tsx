import { Link } from "react-router-dom";
import { Leaf, Sparkles, Shield, Rocket, ArrowRight, Activity, Zap, CheckCircle2, ChevronRight } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen overflow-x-hidden selection:bg-forest-700 selection:text-white">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-forest-500/15 flex items-center justify-center">
              <Leaf size={18} className="text-forest-400" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">CarbonTrack</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#preview" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#stats" className="hover:text-white transition-colors">Global Impact</a>
            <a href="#benefits" className="hover:text-white transition-colors">Benefits</a>
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard" className="inline-flex items-center gap-1.5 bg-forest-600 hover:bg-forest-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all shadow-md shadow-forest-900/20">
                Go to Dashboard
                <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="inline-flex items-center gap-1 bg-forest-600 hover:bg-forest-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all shadow-md shadow-forest-900/20">
                  Get Started
                  <ChevronRight size={15} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 max-w-7xl mx-auto">
        {/* Decorative blur elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-forest-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-500/10 border border-forest-500/20 text-forest-400 text-xs font-semibold tracking-wide uppercase animate-fade-in">
            <Sparkles size={12} />
            Next-Gen Climate Action Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Decarbonize your life,{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-forest-400 to-sky-400 bg-clip-text text-transparent">
              one habit at a time.
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            CarbonTrack empowers individuals to measure their footprint with audit-grade calculators, receive AI-driven reduction coaching, and gamify sustainability with active goal tracking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-forest-600 to-emerald-600 hover:from-forest-500 hover:to-emerald-500 text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-forest-900/30 scale-100 hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Free Calculation
              <ArrowRight size={18} />
            </Link>
            <a
              href="#preview"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold px-7 py-3.5 rounded-xl transition-all"
            >
              See App Features
            </a>
          </div>
        </div>
      </section>

      {/* Carbon Score & Coach Preview Section */}
      <section id="preview" className="py-20 px-6 border-t border-slate-900 bg-slate-900/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold tracking-wide uppercase">
              <Activity size={12} />
              Interactive Analytics
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              An intelligent, gamified dashboard built for impact.
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Experience the visual elegance of a premium financial dashboard combined with the habit-forming science of Duolingo. CarbonTrack features a proprietary Carbon Score system that maps your daily choices to a simple 0-100 sustainability index.
            </p>

            <ul className="space-y-3.5">
              {[
                { title: "Circular Carbon Scoring", desc: "Instantly gauge if you are Excellent, Good, or Need Improvement." },
                { title: "AI-Priority Diagnostics", desc: "Personalized coaching cards that sort impact by difficulty and priority." },
                { title: "Live What-If Simulator", desc: "Drag sliders to simulate shifting to solar power or driving less in real time." }
              ].map((item, idx) => (
                <li key={idx} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-forest-500/15 text-forest-400 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle2 size={13} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">{item.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Interactive Previews Cards */}
          <div className="space-y-6 lg:ml-6">
            {/* Mock Carbon Score Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-forest-500/5 rounded-full blur-3xl" />
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Eco Status</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">Carbon Score</h3>
                </div>
                <span className="badge bg-forest-500/10 text-forest-400 border border-forest-500/20">
                  Level 3 Cadet
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                    <circle cx="50" cy="50" r="40" stroke="#16a34a" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset="55" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(22,163,74,0.4)]" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-white">78</span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Good</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-white">You're doing better than average!</p>
                  <p className="text-xs text-slate-400 leading-relaxed">Your emissions are ~18% lower than the average citizen in your region. Cut 40kg more to unlock "Excellent" tier.</p>
                  <div className="pt-2 text-xs font-semibold text-forest-400 flex items-center gap-1">
                    See details <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            </div>

            {/* Mock AI Coach Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-3xl" />
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-forest-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">AI Recommendation</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 uppercase">High Priority</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-forest-500/10 border border-forest-500/20 text-forest-400 uppercase">Easy</span>
              </div>
              <h4 className="text-base font-bold text-white">Transition to LED Home Lighting</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Replacing 10 standard incandescent bulbs with LED alternatives cuts energy consumption dramatically.</p>
              <div className="mt-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
                <span className="text-xs text-slate-400">Projected Savings</span>
                <span className="text-xs font-bold text-forest-400">~15.4 kg CO₂e / mo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="stats" className="py-20 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white tracking-tight">Our Platform by the Numbers</h2>
            <p className="text-sm text-slate-400 mt-2">Connecting micro habits with global environmental restoration.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { val: "833 kg", label: "Global Monthly Average", desc: "Typical personal carbon emission baseline" },
              { val: "-22%", label: "Average Footprint Cut", desc: "Achieved by active users in the first 90 days" },
              { val: "2.4M+", label: "XP Points Accrued", desc: "By users completing daily green challenges" }
            ].map((stat, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-900 rounded-3xl p-8 text-center space-y-2 hover:border-slate-800 transition-all hover:bg-slate-900/60">
                <p className="text-4xl sm:text-5xl font-black text-white bg-gradient-to-r from-forest-400 to-emerald-400 bg-clip-text text-transparent">{stat.val}</p>
                <p className="font-semibold text-slate-200 text-sm">{stat.label}</p>
                <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-6 border-t border-slate-900 bg-slate-900/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-bold text-forest-400 uppercase tracking-widest bg-forest-500/10 px-3 py-1 rounded-full">Benefits</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-3">Why Top Climate Scientists Trust CarbonTrack</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Shield className="text-emerald-400" size={24} />,
                title: "Scientifically Backed Calculations",
                desc: "We use formulas derived directly from IPCC guidelines and regional grid intensities to offer an accurate picture of your personal impact."
              },
              {
                icon: <Zap className="text-amber-400" size={24} />,
                title: "Actionable, Non-Vague Advice",
                desc: "No more 'save the trees' generic copy. Get step-by-step guides, priority analysis, and savings values computed for your exact house size."
              },
              {
                icon: <Rocket className="text-sky-400" size={24} />,
                title: "Gamified Habit Building",
                desc: "Turn green actions into streaks. Unlock customized achievement badges, earn XP points, and rise through the climate action levels."
              }
            ].map((benefit, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 space-y-4 hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-bold text-white">{benefit.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-forest-900/40 to-slate-900/50 border border-forest-500/20 rounded-3xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-forest-500/10 rounded-full blur-[100px] pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to lead the climate transition?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Create an account, calculate your baseline footprint in 2 minutes, and unlock custom AI reduction coach insights today.
          </p>
          <div className="pt-2">
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-2 bg-forest-600 hover:bg-forest-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-forest-950/50"
            >
              Get Started for Free
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900 text-slate-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-6 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Leaf size={14} className="text-forest-500" />
            <span className="font-bold text-slate-400">CarbonTrack</span>
          </div>
          <p>© {new Date().getFullYear()} CarbonTrack Inc. All rights reserved. Hackathon build.</p>
        </div>
      </footer>
    </div>
  );
}
