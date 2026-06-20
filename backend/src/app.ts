import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import { env } from "@/config/env";
import { apiLimiter } from "@/middleware/rateLimiters";
import { errorHandler, notFoundHandler } from "@/middleware/errors";
import { authRouter } from "@/modules/auth/auth.routes";
import { footprintRouter } from "@/modules/footprint/footprint.routes";
import { coachRouter } from "@/modules/coach/coach.routes";
import { simulatorRouter } from "@/modules/simulator/simulator.routes";
import { goalsRouter } from "@/modules/goals/goals.routes";
import { dailyActionsRouter } from "@/modules/dailyActions/dailyActions.routes";
import { dashboardRouter } from "@/modules/dashboard/dashboard.routes";
import { gamificationRouter } from "@/modules/gamification/gamification.routes";

export function createApp(): express.Application {
  const app = express();

  // ── Security middleware ────────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: env.isProduction, // only enforce full CSP in production
      crossOriginEmbedderPolicy: false
    })
  );

  app.use(
    cors({
      origin: env.corsOrigins,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 600
    })
  );

  // ── Request processing ────────────────────────────────────────────────────
  app.use(express.json({ limit: "100kb" })); // prevent payload inflation attacks
  app.use(compression());
  if (!env.isTest) {
    app.use(morgan(env.isProduction ? "combined" : "dev"));
  }

  // ── Health check (exempt from rate limiting and auth) ─────────────────────
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ── API routes ─────────────────────────────────────────────────────────────
  app.use("/api", apiLimiter);
  app.use("/api/auth", authRouter);
  app.use("/api/footprint", footprintRouter);
  app.use("/api/coach", coachRouter);
  app.use("/api/simulator", simulatorRouter);
  app.use("/api/goals", goalsRouter);
  app.use("/api/daily-actions", dailyActionsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/gamification", gamificationRouter);

  // ── Error handling ─────────────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
