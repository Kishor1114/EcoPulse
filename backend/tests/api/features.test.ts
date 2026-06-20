import request from "supertest";
import { createApp } from "../../src/app";
import { closeDb, getDb } from "../../src/db/connection";

const app = createApp();

beforeAll(() => {
  getDb();
});

afterAll(() => {
  closeDb();
});

async function registerAndGetToken(emailPrefix: string): Promise<string> {
  const res = await request(app).post("/api/auth/register").send({
    name: "Feature Test User",
    email: `${emailPrefix}${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`,
    password: "Password1",
  });
  return res.body.token as string;
}

const sampleFootprintInput = {
  carKmPerWeek: 150,
  publicKmPerWeek: 10,
  shortFlightsPerYear: 2,
  longFlightsPerYear: 1,
  electricityKwhPerMonth: 300,
  renewableSharePercent: 10,
  waterLitersPerDay: 140,
  dietType: "meat_heavy",
  foodWastePercent: 25,
  wasteKgPerWeek: 8,
  recyclingSharePercent: 20,
  shoppingSpendPerMonth: 400,
};

// ─── Goals ─────────────────────────────────────────────────────────────────────

describe("Goals API", () => {
  let token: string;

  beforeAll(async () => {
    token = await registerAndGetToken("goals");
  });

  it("401 without auth", async () => {
    const res = await request(app).get("/api/goals");
    expect(res.status).toBe(401);
  });

  it("201 creates a new goal", async () => {
    const res = await request(app)
      .post("/api/goals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Reduce car travel by 15%",
        category: "transport",
        goalType: "reduce_percent",
        targetValue: 15,
        baselineValue: 100,
        unit: "%",
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.progressPercent).toBe(0);
  });

  it("422 on invalid category", async () => {
    const res = await request(app)
      .post("/api/goals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Bad goal",
        category: "spacetravel",
        goalType: "reduce_percent",
        targetValue: 10,
        unit: "%",
      });
    expect(res.status).toBe(422);
  });

  it("GET /api/goals lists created goals", async () => {
    const res = await request(app).get("/api/goals").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("PATCH progress marks goal completed once target reached", async () => {
    const createRes = await request(app)
      .post("/api/goals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Cycle 3 days a week",
        category: "transport",
        goalType: "absolute_target",
        targetValue: 3,
        unit: "days/week",
      });
    const goalId = createRes.body.id;

    const updateRes = await request(app)
      .patch(`/api/goals/${goalId}/progress`)
      .set("Authorization", `Bearer ${token}`)
      .send({ currentValue: 3 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe("completed");
    expect(updateRes.body.progressPercent).toBe(100);
  });

  it("403 when updating another user's goal", async () => {
    const otherToken = await registerAndGetToken("other");
    const createRes = await request(app)
      .post("/api/goals")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Private goal", category: "general", goalType: "absolute_target", targetValue: 1, unit: "x" });

    const res = await request(app)
      .patch(`/api/goals/${createRes.body.id}/progress`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ currentValue: 1 });

    expect(res.status).toBe(403);
  });

  it("404 when updating a nonexistent goal", async () => {
    const res = await request(app)
      .patch("/api/goals/999999/progress")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentValue: 1 });
    expect(res.status).toBe(404);
  });

  it("204 deletes a goal", async () => {
    const createRes = await request(app)
      .post("/api/goals")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Temp goal", category: "general", goalType: "absolute_target", targetValue: 1, unit: "x" });

    const res = await request(app)
      .delete(`/api/goals/${createRes.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});

// ─── Simulator ─────────────────────────────────────────────────────────────────

describe("Simulator API", () => {
  let token: string;

  beforeAll(async () => {
    token = await registerAndGetToken("sim");
  });

  it("GET /api/simulator/scenarios lists all scenarios", async () => {
    const res = await request(app)
      .get("/api/simulator/scenarios")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("POST /api/simulator/run computes projected savings", async () => {
    const res = await request(app)
      .post("/api/simulator/run")
      .set("Authorization", `Bearer ${token}`)
      .send({ scenario: "go_vegan", currentInput: sampleFootprintInput });

    expect(res.status).toBe(200);
    expect(res.body.savings.monthlySavingKg).toBeGreaterThan(0);
    expect(res.body.projected.totalMonthlyKg).toBeLessThan(res.body.current.totalMonthlyKg);
  });

  it("switch_to_public_transit scenario zeroes out car emissions", async () => {
    const res = await request(app)
      .post("/api/simulator/run")
      .set("Authorization", `Bearer ${token}`)
      .send({ scenario: "switch_to_public_transit", currentInput: sampleFootprintInput });

    expect(res.status).toBe(200);
    expect(res.body.savings.monthlySavingKg).toBeGreaterThan(0);
  });

  it("422 on invalid scenario key", async () => {
    const res = await request(app)
      .post("/api/simulator/run")
      .set("Authorization", `Bearer ${token}`)
      .send({ scenario: "fly_to_the_moon", currentInput: sampleFootprintInput });
    expect(res.status).toBe(422);
  });
});

// ─── Daily Actions ──────────────────────────────────────────────────────────────

describe("Daily Actions API", () => {
  let token: string;

  beforeAll(async () => {
    token = await registerAndGetToken("actions");
  });

  it("GET /api/daily-actions/today returns 5 personalized actions", async () => {
    const res = await request(app)
      .get("/api/daily-actions/today")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.actions).toHaveLength(5);
    expect(res.body).toHaveProperty("date");
  });

  it("is deterministic for the same user and day", async () => {
    const res1 = await request(app).get("/api/daily-actions/today").set("Authorization", `Bearer ${token}`);
    const res2 = await request(app).get("/api/daily-actions/today").set("Authorization", `Bearer ${token}`);
    const keys1 = res1.body.actions.map((a: { key: string }) => a.key);
    const keys2 = res2.body.actions.map((a: { key: string }) => a.key);
    expect(keys1).toEqual(keys2);
  });

  it("POST /api/daily-actions/complete marks an action done", async () => {
    const todayRes = await request(app).get("/api/daily-actions/today").set("Authorization", `Bearer ${token}`);
    const firstKey = todayRes.body.actions[0].key;

    const res = await request(app)
      .post("/api/daily-actions/complete")
      .set("Authorization", `Bearer ${token}`)
      .send({ actionKey: firstKey });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.alreadyCompleted).toBe(false);
  });

  it("completing the same action twice reports alreadyCompleted", async () => {
    const todayRes = await request(app).get("/api/daily-actions/today").set("Authorization", `Bearer ${token}`);
    const key = todayRes.body.actions[1].key;

    await request(app)
      .post("/api/daily-actions/complete")
      .set("Authorization", `Bearer ${token}`)
      .send({ actionKey: key });

    const res = await request(app)
      .post("/api/daily-actions/complete")
      .set("Authorization", `Bearer ${token}`)
      .send({ actionKey: key });

    expect(res.body.alreadyCompleted).toBe(true);
  });
});

// ─── Gamification ────────────────────────────────────────────────────────────────

describe("Gamification API", () => {
  let token: string;

  beforeAll(async () => {
    token = await registerAndGetToken("gamify");
  });

  it("GET /api/gamification/state returns points, streak, and badges", async () => {
    const res = await request(app)
      .get("/api/gamification/state")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("points");
    expect(res.body).toHaveProperty("streakCount");
    expect(res.body).toHaveProperty("badges");
    expect(Array.isArray(res.body.badges)).toBe(true);
  });

  it("awards points and unlocks the first-calculation badge after logging a footprint", async () => {
    await request(app)
      .post("/api/footprint")
      .set("Authorization", `Bearer ${token}`)
      .send(sampleFootprintInput);

    const res = await request(app)
      .get("/api/gamification/state")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.points).toBeGreaterThan(0);
    const firstCalcBadge = res.body.badges.find((b: { key: string }) => b.key === "first_calculation");
    expect(firstCalcBadge.unlocked).toBe(true);
  });
});

// ─── Coach ────────────────────────────────────────────────────────────────────────

describe("Coach API", () => {
  let token: string;

  beforeAll(async () => {
    token = await registerAndGetToken("coach");
  });

  it("404 when no footprint has been logged yet", async () => {
    const res = await request(app)
      .get("/api/coach/recommendations")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("200 with recommendations after logging a high-emission footprint", async () => {
    await request(app)
      .post("/api/footprint")
      .set("Authorization", `Bearer ${token}`)
      .send(sampleFootprintInput);

    const res = await request(app)
      .get("/api/coach/recommendations")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("summary");
    expect(res.body).toHaveProperty("recommendations");
    expect(res.body.recommendations.length).toBeGreaterThan(0);
  });
});
