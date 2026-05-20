import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..", "..");
const runnerPath = join(__dirname, "pgQueryRunner.js");

function execute(kind, sql, params = []) {
  const result = spawnSync(process.execPath, [runnerPath], {
    cwd: rootDir,
    input: JSON.stringify({ kind, sql, params }),
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    env: process.env
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || result.stdout || "Database bridge failed.").trim();
    throw new Error(stderr);
  }

  return JSON.parse(result.stdout || "null");
}

export const db = {
  prepare(sql) {
    return {
      get: (...params) => execute("get", sql, params),
      all: (...params) => execute("all", sql, params),
      run: (...params) => execute("run", sql, params)
    };
  },
  exec(sql) {
    return execute("exec", sql, []);
  }
};

export { rootDir };
