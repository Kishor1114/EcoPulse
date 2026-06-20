process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-not-for-production-use-only-min-16";
process.env.DATABASE_PATH = ":memory:";
process.env.PORT = "4999";
process.env.RATE_LIMIT_WINDOW_MS = "60000";
process.env.RATE_LIMIT_MAX = "1000";
process.env.AUTH_RATE_LIMIT_MAX = "1000";
