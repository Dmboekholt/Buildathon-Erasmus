#!/usr/bin/env node
/**
 * Apply supabase/bootstrap.sql to a remote Supabase Postgres database.
 * Requires SUPABASE_DB_PASSWORD in .env (Settings → Database → database password).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const ref = process.env.VITE_SUPABASE_PROJECT_ID || "mcmlcfrincqzziubekfy";
const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error(
    "Missing SUPABASE_DB_PASSWORD in .env\n" +
      "Supabase Dashboard → Project Settings → Database → Database password\n" +
      "(This is NOT the API secret key.)",
  );
  process.exit(1);
}

const sql = readFileSync(join(root, "supabase/bootstrap.sql"), "utf8");

function pgConfig() {
  if (process.env.SUPABASE_DB_URL) {
    return { connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } };
  }
  const region = process.env.SUPABASE_DB_REGION || "eu-west-1";
  return {
    host: `aws-0-${region}.pooler.supabase.com`,
    port: 5432,
    user: `postgres.${ref}`,
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  };
}

const client = new pg.Client(pgConfig());

try {
  await client.connect();
  console.log(`Connected — applying bootstrap.sql …`);
  await client.query(sql);
  console.log("Done. Schema and seed data are in place.");
} catch (err) {
  console.error("Bootstrap failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
