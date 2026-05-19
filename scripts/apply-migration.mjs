#!/usr/bin/env node
/**
 * Apply a single SQL file under supabase/migrations/ to remote Postgres.
 * Usage: node scripts/apply-migration.mjs 20260519180000_curriculum_three_way_scoring.sql
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

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-migration.mjs <migration-filename.sql>");
  process.exit(1);
}

const ref = process.env.VITE_SUPABASE_PROJECT_ID || "mcmlcfrincqzziubekfy";
const password = process.env.SUPABASE_DB_PASSWORD;
if (!password && !process.env.SUPABASE_DB_URL) {
  console.error("Missing SUPABASE_DB_PASSWORD or SUPABASE_DB_URL in .env");
  process.exit(1);
}

const sql = readFileSync(join(root, "supabase/migrations", file), "utf8");

function pgConfig() {
  if (process.env.SUPABASE_DB_URL) {
    return {
      connectionString: process.env.SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false },
    };
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
  console.log(`Applying ${file} …`);
  await client.query(sql);
  console.log("Done.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
