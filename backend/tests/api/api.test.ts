import request from "supertest";
import { createApp } from "../../src/app";
import { closeDb, getDb } from "../../src/db/connection";

const app = createApp();

// Initialise DB before tests, reset between suites
beforeAll(() => {
  getDb();
});

afterAll(() => {
  closeDb();
});

// ─── Auth routes ─────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  it("201 with token on valid data", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test1@example.com",
      password: "Password1"
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe("test1@example.com");
  });

  it("409 on duplicate email", async () => {
    const payload = { name: "Dup User", email: "dup@example.com", password: "Password1" };
    await request(app).post("/api/auth/register").send(payload);
    const res = await request(app).post("/api/auth/register").send(payload);
    expect(res.status).toBe(409);
  });

  it("422 on weak password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "T", email: "t@e.com", password: "weak" });
    expect(res.status).toBe(422);
  });

  it("422 on invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email: "not-an-email", password: "Password1" });
    expect(res.status).toBe(422);
  });
});

describe("POST /api/auth/login", () => {
  beforeAll(async () => {
    await request(app).post("/api/auth/register").send({
      name: "Login User",
      email: "login@example.com",
      password: "Password1"
    });
  });

  it("200 with token on valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "Password1" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("401 on wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "WrongPass1" });
    expect(res.status).toBe(401);
  });

  it("401 on unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "Password1" });
    expect(res.status).toBe(401);
  });
});

// ─── Footprint routes ─────────────────────────────────────────────────────────

const validFootprint = {
  carKmPerWeek: 100,
  publicKmPerWeek: 20,
  shortFlightsPerYear: 2,
  longFlightsPerYear: 1,
  electricityKwhPerMonth: 250,
  renewableSharePercent: 20,
  waterLitersPerDay: 150,
  dietType: "average",
  foodWastePercent: 20,
  wasteKgPerWeek: 4,
  recyclingSharePercent: 40,
  shoppingSpendPerMonth: 200
};

describe("Footprint API", () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Footprint User",
      email: `fp${Date.now()}@example.com`,
      password: "Password1"
    });
    token = res.body.token as string;
  });

  it("401 without token", async () => {
    const res = await request(app).post("/api/footprint").send(validFootprint);
    expect(res.status).toBe(401);
  });

  it("201 with valid footprint data", async () => {
    const res = await request(app)
      .post("/api/footprint")
      .set("Authorization", `Bearer ${token}`)
      .send(validFootprint);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("totalMonthlyKg");
    expect(res.body).toHaveProperty("categories");
    expect(res.body.categories).toHaveLength(6);
  });

  it("GET /api/footprint/latest returns the submitted entry", async () => {
    await request(app)
      .post("/api/footprint")
      .set("Authorization", `Bearer ${token}`)
      .send(validFootprint);

    const res = await request(app)
      .get("/api/footprint/latest")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalMonthlyKg");
  });

  it("GET /api/footprint/history returns paginated results", async () => {
    const res = await request(app)
      .get("/api/footprint/history?limit=5&offset=0")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("items");
    expect(res.body).toHaveProperty("total");
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it("422 on negative carKmPerWeek", async () => {
    const res = await request(app)
      .post("/api/footprint")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validFootprint, carKmPerWeek: -10 });
    expect(res.status).toBe(422);
  });

  it("422 on invalid dietType", async () => {
    const res = await request(app)
      .post("/api/footprint")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validFootprint, dietType: "carnivore" });
    expect(res.status).toBe(422);
  });
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

describe("GET /api/dashboard", () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Dashboard User",
      email: `dash${Date.now()}@example.com`,
      password: "Password1"
    });
    token = res.body.token as string;
  });

  it("200 and includes expected top-level keys", async () => {
    const res = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("footprint");
    expect(res.body).toHaveProperty("trend");
    expect(res.body).toHaveProperty("goals");
    expect(res.body).toHaveProperty("gamification");
  });
});

// ─── Health ───────────────────────────────────────────────────────────────────

describe("GET /health", () => {
  it("returns 200 ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
