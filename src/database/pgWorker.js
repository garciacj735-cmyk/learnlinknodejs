import fs from "node:fs";
import path from "node:path";
import { parentPort, workerData } from "node:worker_threads";
import pg from "pg";

const { Pool, types } = pg;

types.setTypeParser(20, (value) => Number(value));
types.setTypeParser(21, (value) => Number(value));
types.setTypeParser(23, (value) => Number(value));
types.setTypeParser(700, (value) => Number(value));
types.setTypeParser(701, (value) => Number(value));
types.setTypeParser(1700, (value) => Number(value));

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
    ca: fs.readFileSync(path.resolve(workerData.rootDir, process.env.PGSSLROOTCERT || "./src/config/aiven-ca.pem"), "utf8")
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

parentPort.on("message", async ({ id, kind, sql, params, resultPath, signal }) => {
  try {
    const result = await execute(kind, sql, params);
    fs.writeFileSync(resultPath, JSON.stringify({ id, result }));
  } catch (error) {
    fs.writeFileSync(resultPath, JSON.stringify({
      id,
      error: {
        name: error.name,
        message: error.message,
        code: error.code || null,
        detail: error.detail || null
      }
    }));
  } finally {
    Atomics.store(signal, 0, 1);
    Atomics.notify(signal, 0, 1);
  }
});
