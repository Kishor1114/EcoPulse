import { createApp } from "./app";
import { env } from "./config/env";
import { getDb } from "./db/connection";

const app = createApp();

// Eagerly open and initialise the database before accepting connections
getDb();

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🌱 Carbon Footprint API running on port ${env.PORT} [${env.NODE_ENV}]`);
});

// Graceful shutdown: drain existing connections before exiting
process.on("SIGTERM", () => {
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log("Server closed");
    process.exit(0);
  });
});
