import { getDb } from "@/db/connection";
import { FootprintInput, FootprintResult } from "./footprint.types";

export interface FootprintEntryRecord {
  id: number;
  user_id: number;
  car_km_per_week: number;
  public_km_per_week: number;
  short_flights_year: number;
  long_flights_year: number;
  electricity_kwh_mo: number;
  renewable_share_pct: number;
  water_liters_day: number;
  diet_type: string;
  food_waste_pct: number;
  waste_kg_week: number;
  recycling_share_pct: number;
  shopping_spend_mo: number;
  breakdown_json: string;
  total_monthly_kg: number;
  total_yearly_kg: number;
  created_at: string;
}

export const footprintRepository = {
  insert(userId: number, input: FootprintInput, result: FootprintResult): FootprintEntryRecord {
    const stmt = getDb().prepare(`
      INSERT INTO footprint_entries (
        user_id, car_km_per_week, public_km_per_week, short_flights_year, long_flights_year,
        electricity_kwh_mo, renewable_share_pct, water_liters_day, diet_type, food_waste_pct,
        waste_kg_week, recycling_share_pct, shopping_spend_mo, breakdown_json,
        total_monthly_kg, total_yearly_kg
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertResult = stmt.run(
      userId,
      input.carKmPerWeek,
      input.publicKmPerWeek,
      input.shortFlightsPerYear,
      input.longFlightsPerYear,
      input.electricityKwhPerMonth,
      input.renewableSharePercent,
      input.waterLitersPerDay,
      input.dietType,
      input.foodWastePercent,
      input.wasteKgPerWeek,
      input.recyclingSharePercent,
      input.shoppingSpendPerMonth,
      JSON.stringify(result.categories),
      result.totalMonthlyKg,
      result.totalYearlyKg
    );

    return getDb()
      .prepare("SELECT * FROM footprint_entries WHERE id = ?")
      .get(insertResult.lastInsertRowid) as unknown as FootprintEntryRecord;
  },

  findLatestByUser(userId: number): FootprintEntryRecord | undefined {
    return getDb()
      .prepare("SELECT * FROM footprint_entries WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 1")
      .get(userId) as unknown as FootprintEntryRecord | undefined;
  },

  findHistoryByUser(userId: number, limit: number, offset: number): FootprintEntryRecord[] {
    return getDb()
      .prepare(
        "SELECT * FROM footprint_entries WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?"
      )
      .all(userId, limit, offset) as unknown as FootprintEntryRecord[];
  },

  countByUser(userId: number): number {
    const row = getDb()
      .prepare("SELECT COUNT(*) as count FROM footprint_entries WHERE user_id = ?")
      .get(userId) as { count: number };
    return row.count;
  }
};
