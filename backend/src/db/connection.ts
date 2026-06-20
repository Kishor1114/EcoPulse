import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import { env } from "@/config/env";

let instance: DatabaseSync | null = null;

/**
 * Returns a singleton SQLite connection.
 *
 * This uses Node.js's built-in `node:sqlite` module (stable since Node 22.5)
 * instead of a third-party native binding such as better-sqlite3. That
 * removes an entire class of native-compilation dependencies (node-gyp,
 * Python, a C++ toolchain) from the project, which makes installs faster
 * and more portable across CI runners, containers, and contributors'
 * machines — a meaningful win for maintainability with no runtime
 * downside, since the API surface used here (prepare/run/get/all/exec) is
 * effectively identical to better-sqlite3's.
 *
 * Using ":memory:" (set via DATABASE_PATH) gives each test run a clean,
 * isolated database with zero setup/teardown cost.
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

/** Test/teardown helper - closes and clears the singleton connection. */
export function closeDb(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}
