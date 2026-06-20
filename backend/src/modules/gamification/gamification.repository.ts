import { getPreparedStatement } from "@/db/connection";

export interface GamificationRecord {
  user_id: number;
  points: number;
  streak_count: number;
  last_active_date: string | null;
  badges_json: string;
  updated_at: string;
}

export const gamificationRepository = {
  findOrCreate(userId: number): GamificationRecord {
    const existing = getPreparedStatement("SELECT * FROM gamification_state WHERE user_id = ?")
      .get(userId) as unknown as GamificationRecord | undefined;

    if (existing) return existing;

    getPreparedStatement("INSERT OR IGNORE INTO gamification_state (user_id) VALUES (?)")
      .run(userId);

    return getPreparedStatement("SELECT * FROM gamification_state WHERE user_id = ?")
      .get(userId) as unknown as GamificationRecord;
  },

  addPoints(userId: number, points: number): void {
    getPreparedStatement("UPDATE gamification_state SET points = points + ?, updated_at = datetime('now') WHERE user_id = ?")
      .run(points, userId);
  },

  updateStreak(userId: number, streakCount: number, lastActiveDate: string): void {
    getPreparedStatement(
        "UPDATE gamification_state SET streak_count = ?, last_active_date = ?, updated_at = datetime('now') WHERE user_id = ?"
      )
      .run(streakCount, lastActiveDate, userId);
  },

  updateBadges(userId: number, badgesJson: string): void {
    getPreparedStatement("UPDATE gamification_state SET badges_json = ?, updated_at = datetime('now') WHERE user_id = ?")
      .run(badgesJson, userId);
  }
};
