import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Calculator,
  Sparkles,
  Target,
  Lightbulb,
  CalendarCheck,
  Trophy,
  LogOut,
  Leaf,
  Menu,
  X,
  User,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/calculator", label: "Calculator", icon: Calculator },
  { to: "/coach", label: "AI Coach", icon: Sparkles },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/simulator", label: "Simulator", icon: Lightbulb },
  { to: "/actions", label: "Actions", icon: CalendarCheck },
  { to: "/achievements", label: "Badges", icon: Trophy },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login");
  }

  // Active items for mobile bottom bar
  const mobileCoreTabs = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/calculator", label: "Calculator", icon: Calculator },
    { to: "/coach", label: "AI Coach", icon: Sparkles },
    { to: "/goals", label: "Goals", icon: Target },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Skip link for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 bg-forest-600 text-white px-4 py-2 rounded-lg"
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar (visible on md+) */}
      <aside className="hidden md:flex md:flex-col w-64 border-r border-slate-900 bg-slate-900/20 backdrop-blur-md py-6 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-6 mb-8">
          <div className="w-9 h-9 rounded-xl bg-forest-500/15 flex items-center justify-center shadow-inner">
            <Leaf size={18} className="text-forest-400" aria-hidden="true" />
          </div>
          <span className="font-extrabold text-white text-lg tracking-tight">CarbonTrack</span>
        </div>

        <nav aria-label="Main navigation" className="flex-1 px-3 space-y-1.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-forest-500/10 border border-forest-500/20 text-forest-400 shadow-md shadow-forest-950/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                }`
              }
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Profile Card & Logout */}
        <div className="px-3 mt-6 pt-6 border-t border-slate-900">
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-900/30 border border-slate-900/60 mb-3">
            <div className="w-8 h-8 rounded-full bg-forest-500/15 text-forest-400 flex items-center justify-center font-bold text-xs uppercase">
              {user?.name?.slice(0, 2) || "US"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-200 border border-transparent"
          >
            <LogOut size={18} aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 inset-x-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/60 flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-forest-500/15 flex items-center justify-center">
            <Leaf size={16} className="text-forest-400" aria-hidden="true" />
          </div>
          <span className="font-extrabold text-white text-base tracking-tight">CarbonTrack</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-forest-500/10 text-forest-400 flex items-center justify-center font-bold text-[10px] uppercase border border-forest-500/20">
            {user?.name?.slice(0, 2) || "US"}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Navigation */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-slate-900 flex justify-around items-center py-2 px-3 pb-safe"
      >
        {mobileCoreTabs.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all duration-200 ${
                isActive ? "text-forest-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon size={20} className={isActive ? "stroke-[2.5px]" : ""} aria-hidden="true" />
              <span className="text-[10px] font-bold tracking-wide">{label}</span>
            </NavLink>
          );
        })}

        {/* More Options Button */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all duration-200 ${
            menuOpen ? "text-forest-400" : "text-slate-400 hover:text-slate-200"
          }`}
          aria-expanded={menuOpen}
          aria-label="Toggle menu options"
        >
          {menuOpen ? <X size={20} className="stroke-[2.5px]" /> : <Menu size={20} />}
          <span className="text-[10px] font-bold tracking-wide">More</span>
        </button>
      </nav>

      {/* Mobile Bottom Sheet Overlay for 'More' Options */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute bottom-16 inset-x-0 bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2">
              <span className="font-bold text-white text-sm">More Actions</span>
              <button onClick={() => setMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NavLink
                to="/simulator"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isActive
                      ? "bg-forest-500/10 border-forest-500/30 text-forest-400"
                      : "bg-slate-950/40 border-slate-800/80 text-slate-300"
                  }`
                }
              >
                <Lightbulb size={18} />
                <span className="text-xs font-semibold">Simulator</span>
              </NavLink>

              <NavLink
                to="/actions"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isActive
                      ? "bg-forest-500/10 border-forest-500/30 text-forest-400"
                      : "bg-slate-950/40 border-slate-800/80 text-slate-300"
                  }`
                }
              >
                <CalendarCheck size={18} />
                <span className="text-xs font-semibold">Daily Actions</span>
              </NavLink>

              <NavLink
                to="/achievements"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isActive
                      ? "bg-forest-500/10 border-forest-500/30 text-forest-400"
                      : "bg-slate-950/40 border-slate-800/80 text-slate-300"
                  }`
                }
              >
                <Trophy size={18} />
                <span className="text-xs font-semibold">Achievements</span>
              </NavLink>

              <div className="p-3 rounded-xl bg-slate-950/20 border border-slate-800/40 flex items-center gap-3 text-slate-400">
                <User size={18} />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-200 truncate">{user?.name}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-bold hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main
        id="main-content"
        className="flex-1 min-w-0 pb-20 md:pb-8 pt-4 md:pt-0"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
