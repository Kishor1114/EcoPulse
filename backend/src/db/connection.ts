import { DatabaseSync, StatementSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import { env } from "@/config/env";

let instance: DatabaseSync | null = null;
const statementCache = new Map<string, StatementSync>();

/**
 * Returns a singleton SQLite connection.
 */
export function getDb(): DatabaseSync {
  if (instance) return instance;

  const dbPath = env.DATABASE_PATH;
  if (dbPath !== ":memory:") {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  instance = new DatabaseSync(dbPath);
  instance.exec("PRAGMA journal_mode = WAL");
  instance.exec("PRAGMA foreign_keys = ON");

  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  instance.exec(schema);

  return instance;
}

/**
 * Prepares and caches a SQL statement to avoid recompilation on every execution.
 */
export function getPreparedStatement(sql: string): StatementSync {
  let stmt = statementCache.get(sql);
  if (!stmt) {
    const db = getDb();
    stmt = db.prepare(sql);
    statementCache.set(sql, stmt);
  }
  return stmt;
}

/** Test/teardown helper - closes and clears the singleton connection. */
export function closeDb(): void {
  if (instance) {
    statementCache.clear();
    instance.close();
    instance = null;
  }
}
