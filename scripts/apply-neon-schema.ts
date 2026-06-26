import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve } from "path";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const sql = neon(url);
  const schemaPath = resolve(process.cwd(), "scripts/neon-schema-rest.sql");
  const script = readFileSync(schemaPath, "utf8");
  const statements = script
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const statement of statements) {
    await sql.query(statement);
    console.log("OK:", statement.split("\n")[0].slice(0, 60));
  }

  const tables = await sql`
    select tablename from pg_tables where schemaname = 'public' order by tablename
  `;
  console.log("Tables:", tables.map((t) => t.tablename).join(", "));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
