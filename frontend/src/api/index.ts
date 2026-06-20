import axios, { AxiosError } from "axios";
import type {
  AuthResponse,
  CoachReport,
  CreateGoalInput,
  DailyActionsResponse,
  DashboardData,
  FootprintInput,
  FootprintResult,
  Goal,
  HistoryItem,
  LatestFootprint,
  ScenarioKey,
  SimulatorResult,
  GamificationState,
} from "@/types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export const api = axios.create({ baseURL: BASE_URL, timeout: 15_000 });

// Attach JWT on every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("cf_token");
      localStorage.removeItem("cf_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? err.message;
  }
  return "An unexpected error occurred.";
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (name: string, email: string, password: string) =>
    api.post<AuthResponse>("/auth/register", { name, email, password }).then((r) => r.data),
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }).then((r) => r.data),
};

// ── Footprint ─────────────────────────────────────────────────────────────────
export const footprintApi = {
  calculate: (input: FootprintInput) =>
    api.post<FootprintResult>("/footprint", input).then((r) => r.data),
  getLatest: () =>
    api.get<LatestFootprint | null>("/footprint/latest").then((r) => r.data),
  getHistory: (limit = 12, offset = 0) =>
    api.get<{ items: HistoryItem[]; total: number }>(`/footprint/history?limit=${limit}&offset=${offset}`).then((r) => r.data),
};

// ── Coach ─────────────────────────────────────────────────────────────────────
export const coachApi = {
  getRecommendations: () =>
    api.get<CoachReport>("/coach/recommendations").then((r) => r.data),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: () => api.get<DashboardData>("/dashboard").then((r) => r.data),
};

// ── Goals ─────────────────────────────────────────────────────────────────────
export const goalsApi = {
  create: (input: CreateGoalInput) =>
    api.post<Goal>("/goals", input).then((r) => r.data),
  list: (status?: string) =>
    api.get<Goal[]>(`/goals${status ? `?status=${status}` : ""}`).then((r) => r.data),
  updateProgress: (id: number, currentValue: number) =>
    api.patch<Goal>(`/goals/${id}/progress`, { currentValue }).then((r) => r.data),
  delete: (id: number) =>
    api.delete(`/goals/${id}`),
};

// ── Daily Actions ─────────────────────────────────────────────────────────────
export const actionsApi = {
  getToday: () =>
    api.get<DailyActionsResponse>("/daily-actions/today").then((r) => r.data),
  complete: (actionKey: string) =>
    api.post<{ success: boolean; alreadyCompleted: boolean }>("/daily-actions/complete", { actionKey }).then((r) => r.data),
};

// ── Simulator ─────────────────────────────────────────────────────────────────
export const simulatorApi = {
  run: (scenario: ScenarioKey, currentInput: FootprintInput) =>
    api.post<SimulatorResult>("/simulator/run", { scenario, currentInput }).then((r) => r.data),
  getScenarios: () =>
    api.get<Array<{ key: ScenarioKey; title: string; description: string }>>("/simulator/scenarios").then((r) => r.data),
};

// ── Gamification ──────────────────────────────────────────────────────────────
export const gamificationApi = {
  getState: () =>
    api.get<GamificationState>("/gamification/state").then((r) => r.data),
};
