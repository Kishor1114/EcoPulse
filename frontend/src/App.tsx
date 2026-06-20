import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Spinner } from "@/components/ui/Primitives";

// Auth pages are needed immediately (first paint for logged-out users), so
// they are loaded eagerly. Every other route is behind a JWT check, so it's
// safe to split them into separate chunks loaded only once a user logs in.
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { LandingPage } from "@/features/landing/LandingPage";

const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const CalculatorPage = lazy(() => import("@/features/calculator/CalculatorPage").then((m) => ({ default: m.CalculatorPage })));
const CoachPage = lazy(() => import("@/features/coach/CoachPage").then((m) => ({ default: m.CoachPage })));
const GoalsPage = lazy(() => import("@/features/goals/GoalsPage").then((m) => ({ default: m.GoalsPage })));
const SimulatorPage = lazy(() => import("@/features/simulator/SimulatorPage").then((m) => ({ default: m.SimulatorPage })));
const DailyActionsPage = lazy(() => import("@/features/actions/DailyActionsPage").then((m) => ({ default: m.DailyActionsPage })));
const AchievementsPage = lazy(() => import("@/features/gamification/AchievementsPage").then((m) => ({ default: m.AchievementsPage })));

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Suspense fallback={<Spinner label="Loading page" />}>{children}</Suspense>
      </AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/calculator" element={<Protected><CalculatorPage /></Protected>} />
          <Route path="/coach" element={<Protected><CoachPage /></Protected>} />
          <Route path="/goals" element={<Protected><GoalsPage /></Protected>} />
          <Route path="/simulator" element={<Protected><SimulatorPage /></Protected>} />
          <Route path="/actions" element={<Protected><DailyActionsPage /></Protected>} />
          <Route path="/achievements" element={<Protected><AchievementsPage /></Protected>} />

          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
