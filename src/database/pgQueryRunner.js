import fs from "node:fs";
import path from "node:path";
import { stdin, stdout, stderr, exit, cwd } from "node:process";
import pg from "pg";

const { Pool, types } = pg;

types.setTypeParser(20, (value) => Number(value));
types.setTypeParser(21, (value) => Number(value));
types.setTypeParser(23, (value) => Number(value));
types.setTypeParser(700, (value) => Number(value));
types.setTypeParser(701, (value) => Number(value));
types.setTypeParser(1700, (value) => Number(value));

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    stdin.setEncoding("utf8");
    stdin.on("data", (chunk) => { data += chunk; });
    stdin.on("end", () => resolve(data));
    stdin.on("error", reject);
  });
}

function normalizeSql(sql) {
  let text = sql.trim();
  if (/^insert\s+or\s+ignore\b/i.test(text)) {
    text = text.replace(/^insert\s+or\s+ignore\b/i, "INSERT");
    if (!/\bon\s+conflict\b/i.test(text)) {
      text += " ON CONFLICT DO NOTHING";
    }
  }
  return text;
}

function translatePlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function splitStatements(sql) {
  return sql.split(";").map((statement) => statement.trim()).filter(Boolean);
}

function resolveSslConfig() {
  if (process.env.PGSSLMODE !== "require") {
    return false;
  }

  if (process.env.PGSSL_CA) {
    return {
      rejectUnauthorized: true,
      ca: process.env.PGSSL_CA
    };
  }

  return {
    rejectUnauthorized: true,
    ca: fs.readFileSync(path.resolve(cwd(), process.env.PGSSLROOTCERT || "./src/config/aiven-ca.pem"), "utf8")
  };
}

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: resolveSslConfig()
});

async function execute(kind, sql, params) {
  const normalized = normalizeSql(sql);

  if (kind === "exec") {
    for (const statement of splitStatements(normalized)) {
      await pool.query(statement);
    }
    return { changes: 0, lastInsertRowid: null };
  }

  let text = translatePlaceholders(normalized);
  if (kind === "run" && /^insert\b/i.test(text) && !/\breturning\b/i.test(text)) {
    text += " RETURNING id";
  }

  const result = await pool.query(text, params);
  if (kind === "get") return result.rows[0] ?? undefined;
  if (kind === "all") return result.rows;
  return {
    changes: result.rowCount ?? 0,
    lastInsertRowid: result.rows[0]?.id ?? null
  };
}

try {
  const payload = JSON.parse(await readStdin() || "{}");
  const result = await execute(payload.kind, payload.sql, payload.params || []);
  stdout.write(JSON.stringify(result ?? null));
  await pool.end();
  exit(0);
} catch (error) {
  stderr.write(error?.stack || error?.message || String(error));
  try { await pool.end(); } catch {}
  exit(1);
}

