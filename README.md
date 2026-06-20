# 🌱 CarbonTrack — Carbon Footprint Awareness Platform

An AI-powered platform that helps individuals understand, track, and reduce their carbon footprint through personalized recommendations, goal tracking, "what-if" impact simulation, and gamified daily habits.

---

## 1. Project Overview

CarbonTrack is a full-stack web application that turns abstract climate guilt into concrete, prioritized, explainable actions. A user enters their everyday habits — commute, electricity, water, diet, waste, shopping — and the platform:

1. Calculates a transparent, category-by-category carbon footprint (monthly + yearly).
2. Runs that footprint through a rule-based **AI Carbon Coach** that explains *why* each category matters and *what to do about it*, ranked by impact.
3. Lets the user set goals, simulate "what if" lifestyle changes before committing to them, complete daily green actions, and track progress through points, streaks, and badges.

## 2. Chosen Vertical

**Carbon Footprint Awareness Platform** — personal sustainability / climate-tech, individual behavior change track.

## 3. Problem Statement

Most people have only a vague sense of where their emissions come from and even less sense of which changes would actually matter. Generic "save the planet" advice ("recycle more!") is rarely prioritized, rarely personalized, and rarely tied to a number the person can see move. The result is awareness without action.

## 4. Solution Approach

CarbonTrack closes the loop between **measurement → insight → action → feedback**:

- **Measurement**: a structured calculator across six categories (transport, electricity, water, food, waste, shopping) using transparent, documented emission factors.
- **Insight**: an AI Coach that doesn't just say "drive less" — it explains *why* (your transport is 31% of your total, above the moderate threshold) and gives concrete steps.
- **Action**: goals, daily micro-actions, and an impact simulator so the user can preview a change ("switch to public transport") before adopting it.
- **Feedback**: a dashboard with trend charts, plus gamification (points/streaks/badges) so progress is visible and rewarding, not just virtuous.

## 5. Architecture

A two-tier, modular monorepo:

```
carbon-footprint-platform/
├── backend/                     # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── app.ts               # Express app factory (composable, testable)
│   │   ├── server.ts            # Process entrypoint (binds port, handles SIGTERM)
│   │   ├── config/env.ts        # Zod-validated environment configuration
│   │   ├── db/                  # SQLite connection + schema
│   │   ├── middleware/          # auth, validation, rate limiting, error handling
│   │   ├── types/                # Express type augmentation
│   │   └── modules/              # one folder per feature (see below)
│   │       ├── auth/
│   │       ├── footprint/        # calculator + persistence
│   │       ├── coach/            # AI recommendation engine
│   │       ├── goals/
│   │       ├── simulator/        # what-if scenario engine
│   │       ├── dailyActions/
│   │       ├── gamification/     # points / streaks / badges
│   │       └── dashboard/        # aggregation endpoint
│   └── tests/
│       ├── unit/                 # pure-function tests (calculator, coach engine)
│       └── api/                  # supertest HTTP integration tests
│
└── frontend/                     # React + TypeScript + Tailwind SPA
    └── src/
        ├── api/                  # typed Axios client
        ├── components/
        │   ├── ui/               # Card, ProgressBar, StatCard, etc.
        │   ├── charts/           # RingChart (breakdown), TrendChart
        │   └── layout/           # AppLayout (sidebar, mobile nav, skip link)
        ├── features/             # one folder per feature, mirrors backend modules
        │   ├── auth/
        │   ├── dashboard/
        │   ├── calculator/
        │   ├── coach/
        │   ├── goals/
        │   ├── simulator/
        │   ├── actions/
        │   └── gamification/
        ├── hooks/                # useAsync, useDebounce, useLocalStorage
        └── types/                # shared TypeScript contracts mirroring the API
```

**Why this split?** Each backend module owns its own routes, validation, repository (SQL), and business logic — so a reviewer (or a future contributor) can understand "goals" or "coach" end-to-end by reading one folder, instead of hunting across a generic `controllers/`, `services/`, `models/` split. The frontend mirrors the same feature boundaries, so the mental model stays consistent across the stack.

### Request flow

```
React component → typed Axios client (src/api) → Express route
   → validate() [Zod] → requireAuth() [JWT] → controller/route handler
   → repository (parameterized SQL) → SQLite
   ← JSON response ← error middleware (on failure, never leaks internals)
```

## 6. Features

| Feature | Where | Notes |
|---|---|---|
| Carbon Footprint Calculator | `/calculator` | 6 categories, sliders + number inputs, instant results |
| AI Carbon Coach | `/coach` | Rule-based engine, ranked + explained recommendations |
| Carbon Dashboard | `/dashboard` | Total, breakdown ring chart, trend line, goals/actions summary |
| Goal Tracking | `/goals` | Create/track/delete goals, 3 goal types, live progress bar |
| Impact Simulator | `/simulator` | 8 "what-if" scenarios computed against your real latest entry |
| Daily Green Actions | `/actions` | 5 personalized actions/day, deterministic per user+date |
| Gamification | `/achievements` | Points, day-streaks, 7-badge catalog |

## 7. AI Logic

The "AI Coach" (`backend/src/modules/coach/coach.engine.ts`) and "Daily Actions" engine are implemented as **rule-based expert systems** rather than a call to an external LLM, by design:

- **Deterministic & auditable**: every recommendation can be traced to a specific rule and threshold — important for a tool giving people behavior advice.
- **No external API dependency / no cost / no latency** — the coach runs instantly, fully offline, with no API keys needed.
- **Decision process**:
  1. Categories are ranked by absolute monthly kgCO₂e.
  2. Each category is checked against tuned **impact thresholds** (`coach.engine.ts: thresholds`) to classify it Low/Medium/High.
  3. Category-specific rule functions (`buildTransportRecommendations`, `buildFoodRecommendations`, etc.) generate recommendations *only* when relevant — e.g., a vegan user with low food emissions gets no food advice; a heavy driver gets two transport recommendations, the second only unlocking at a higher severity threshold.
  4. Recommendations carry a human-readable **reasoning** string built from the user's actual numbers (not a canned line) and an **estimated saving**, then are sorted by saving size and capped at 6 so the user isn't overwhelmed.
  5. The **Impact Simulator** reuses the same deterministic `calculateFootprint()` function, recomputing the user's *actual* latest entry under a modified scenario — so projected savings are always internally consistent with the user's own data, not a generic average.
  6. **Daily Actions** are selected with a per-user, per-date deterministic shuffle (a seeded pseudo-random sort) so the list feels personalized and "fresh" daily, while remaining reproducible (idempotent) if the same day's data is requested twice.

This keeps the "AI Assistant Requirement" (analyze → prioritize → explain → adapt) fully met without requiring a model API key to run the project.

## 8. Assumptions

- **Single global emission-factor set.** Real per-user footprints vary by country/grid-mix; this project uses clearly isolated, documented global-average factors (`emissionFactors.ts`) so they can be swapped for regional data without touching calculation logic.
- **SQLite via Node's built-in `node:sqlite`** (stable since Node 22.5) is used instead of a third-party native binding like `better-sqlite3`. This was a deliberate choice made while building this project: it removes an entire class of native-compilation dependencies (node-gyp / Python / C++ toolchain) that frequently fail to install in sandboxed or restricted-network environments, at no cost to the synchronous, parameterized-query API the app relies on. **Requires Node.js ≥ 22.5.** Swapping to PostgreSQL or `better-sqlite3` would only require changes inside `src/db/` and the `*.repository.ts` files — the rest of the app is unaware of the underlying driver.
- **JWT in localStorage** is used for simplicity in this hackathon build. A production deployment should consider httpOnly cookies with CSRF protection instead (see Security, below).
- **Single-currency shopping factor.** The "shopping" emission factor is a blended, currency-agnostic estimate; it does not adjust for local purchasing power or currency.

## 9. Security Measures

| Concern | Mitigation |
|---|---|
| SQL injection | Every query uses parameterized statements (`db.prepare(sql).run(...params)`) — no string concatenation, anywhere. |
| Password storage | `bcryptjs` with 12 salt rounds. |
| Timing attacks on login | A dummy bcrypt hash is compared even when the email doesn't exist, so response time doesn't leak account existence. |
| Brute force / credential stuffing | Separate, stricter `express-rate-limit` on `/api/auth/*` (10 req/window) vs. general API (300 req/window). |
| Input validation | Every request body/query is parsed through a `zod` schema before reaching business logic (`middleware/validate.ts`); invalid input never reaches the database layer. |
| Payload size abuse | `express.json({ limit: "100kb" })` caps request body size. |
| Authorization (not just authentication) | Goal mutation routes check `goal.user_id === req.user.id` and return `403` otherwise — a valid token for User A cannot touch User B's data. |
| Transport-layer headers | `helmet()` sets standard security headers; CSP is enforced in production, relaxed in development to avoid blocking Vite's dev tooling. |
| CORS | Explicit allow-list via `CORS_ORIGIN` env var, not a wildcard. |
| Error handling | Centralized `errorHandler` middleware distinguishes operational `AppError`s (safe, intended messages) from unexpected exceptions (logged server-side, reduced to a generic message for the client — stack traces are never sent to the client, even in errors). |
| Secrets | All configuration is loaded and **validated** through `zod` in `config/env.ts` at startup — the app refuses to boot with a missing/weak `JWT_SECRET` rather than silently running insecurely. `.env` is git-ignored; `.env.example` documents required vars. |
| Known limitation | JWTs are stored in `localStorage` on the frontend (readable by JS, vulnerable to XSS exfiltration). For production hardening, migrate to httpOnly, SameSite cookies plus CSRF tokens. |

## 10. Accessibility Features

- **Semantic HTML** throughout: `<nav>`, `<main>`, `<header>`, `<fieldset>`/`<legend>` for the diet-type radio group, real `<table>` (visually hidden but screen-reader-accessible) as the textual equivalent of the ring chart.
- **Skip link** ("Skip to main content") as the first focusable element on every authenticated page.
- **Keyboard navigation**: all interactive elements are real `<button>`/`<a>`/`<input>` elements (no `<div onClick>`), so focus order and `Enter`/`Space` activation work without extra JS.
- **ARIA**: `role="progressbar"` with `aria-valuenow/min/max` on every progress bar; `role="alert"` on error messages so screen readers announce them immediately; `aria-pressed` on the daily-action completion toggle; `aria-label` on icon-only buttons (mobile menu, delete-goal, etc.); `aria-expanded` on the mobile nav toggle.
- **Screen-reader-only content**: the RingChart ships a visually-hidden `<table>` with the exact same data as the visual chart, plus a visible legend that doubles as its accessible description — so no information is conveyed by color alone.
- **Visible focus states**: a global `:focus-visible` outline (`outline-2 outline-forest-400`) instead of suppressing the browser default.
- **Color is never the only signal**: every colored badge (impact level, difficulty, status) is paired with text ("High impact", "Completed!", "easy").
- **Form labels**: every input has a real, associated `<label htmlFor>` (including visually-hidden labels for icon-driven inputs), and password fields include an `aria-describedby` hint rather than placeholder-only guidance.

## 11. Testing Strategy

**Backend** (Jest + Supertest + ts-jest): **55 tests, ~95% statement coverage**

- *Unit tests* (`tests/unit/`) test pure business logic with zero I/O:
  - `carbonCalculator.test.ts` — verifies category math, diet ordering (vegan < vegetarian < average < meat-heavy), renewables zeroing out grid carbon, recycling reducing waste emissions, yearly = 12× monthly, and global-average comparison sign.
  - `coachEngine.test.ts` — verifies the recommendation engine ranks correctly, caps at 6 recommendations, sorts by saving size, and produces zero recommendations for an already-efficient profile.
- *API/integration tests* (`tests/api/`) spin up the real Express app (in-memory SQLite) and exercise it through HTTP with Supertest: registration/login (incl. duplicate-email, weak-password, wrong-password cases), the full footprint → coach → dashboard pipeline, goals (create/list/update/delete, ownership enforcement), the simulator's 8 scenarios, daily actions (determinism, idempotent completion), and gamification (badge unlocking after real activity).

Run with coverage:
```bash
cd backend && npm run test:coverage
```

**Frontend** (Vitest + React Testing Library): **24 tests**

- Component tests for reusable primitives (`Card`, `StatCard`, `ProgressBar` — including ARIA clamping behavior, `ErrorAlert`, `EmptyState`).
- A dedicated accessibility-oriented test suite for `RingChart`, asserting the screen-reader table and legend are present and correct.
- Pure utility tests for `formatKg`/`formatKgLong`/`impactColor`/`CATEGORY_META`.
- An interaction test for `LoginPage` (mocked API) covering required-field validation, successful submission, and error display.

```bash
cd frontend && npm run test
```

## 12. Installation

### Prerequisites
- **Node.js ≥ 22.5** (required for the built-in `node:sqlite` module — check with `node -v`)
- npm

### Backend
```bash
cd backend
npm install
cp .env.example .env        # edit JWT_SECRET etc. for your environment
npm run build                # compiles TypeScript, resolves path aliases, copies schema.sql
npm start                    # runs the compiled server on PORT (default 4000)

# or, for local development with auto-reload:
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env         # set VITE_API_URL if your backend isn't on localhost:4000
npm run dev                  # http://localhost:5173
```

### Running tests
```bash
cd backend  && npm test      # Jest: 55 tests
cd frontend && npm test      # Vitest: 24 tests
```

## 13. Usage

1. Open the frontend, **sign up** for an account.
2. Go to **Calculator**, fill in your transport/electricity/water/food/waste/shopping habits, submit.
3. View your **Dashboard** for the category breakdown ring chart and trend.
4. Open **AI Coach** for prioritized, explained recommendations.
5. Create a **Goal** (e.g., "Reduce car travel by 15%") and update its progress over time.
6. Try the **Impact Simulator** to preview scenarios like "switch to public transport" or "go vegan" before committing.
7. Check off today's **Daily Green Actions**.
8. Track **Achievements** — points, streak, and unlocked badges.

## 14. Future Enhancements

- Swap the rule-based coach for an LLM-backed one (with the existing engine kept as a deterministic fallback/guardrail), using the same `CoachReport` contract so the frontend needs no changes.
- Region-aware emission factors (grid carbon intensity by country/state, local diet baselines).
- Migrate JWT storage to httpOnly cookies + CSRF tokens.
- Add refresh tokens / session revocation instead of long-lived access tokens.
- Multi-device sync and CSV/PDF export of footprint history.
- Social/community features (anonymized leaderboards, household sharing).
- PostgreSQL migration path for multi-instance horizontal scaling (the repository layer already isolates all SQL, so this is a contained change).

---

## Deployment Notes

- **Backend**: any Node ≥ 22.5 host (Render, Railway, Fly.io, a VPS). Run `npm run build && npm start`. Set `DATABASE_PATH` to a writable, persistent volume if not using `:memory:`. Set a strong, unique `JWT_SECRET`. Put it behind HTTPS (terminate TLS at a reverse proxy/load balancer — the app itself is plain HTTP).
- **Frontend**: `npm run build` produces a static `dist/` folder — deploy to any static host (Vercel, Netlify, Cloudflare Pages, S3+CloudFront) and set `VITE_API_URL` to your deployed backend's `/api` base URL at build time.
- **CORS**: set the backend's `CORS_ORIGIN` to your deployed frontend's exact origin.
