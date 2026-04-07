import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.POSTGRES_USER || "saas"}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST || "localhost"}:${process.env.POSTGRES_PORT || "5432"}/${process.env.POSTGRES_DB || "saas"}`,
  max: 20,
  idleTimeoutMillis: 30000,
});

export default pool;
