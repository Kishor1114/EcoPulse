import { getPreparedStatement } from "@/db/connection";

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export const authRepository = {
  findByEmail(email: string): UserRecord | undefined {
    return getPreparedStatement("SELECT * FROM users WHERE email = ?").get(email) as unknown as UserRecord | undefined;
  },

  findById(id: number): UserRecord | undefined {
    return getPreparedStatement("SELECT * FROM users WHERE id = ?").get(id) as unknown as UserRecord | undefined;
  },

  create(name: string, email: string, passwordHash: string): UserRecord {
    const result = getPreparedStatement("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
      .run(name, email, passwordHash);

    return this.findById(Number(result.lastInsertRowid)) as unknown as UserRecord;
  }
};
