import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing in .env");
}

const isLocalDatabase =
  databaseUrl.includes("localhost") ||
  databaseUrl.includes("127.0.0.1");

const pool = new Pool({
  connectionString: databaseUrl,

  // Local PostgreSQL → SSL off
  // Render PostgreSQL → SSL on
  ssl: isLocalDatabase
    ? false
    : {
        rejectUnauthorized: false,
      },
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

export default pool;