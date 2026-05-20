import fs from "node:fs";
import os from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..", "..");
const tempDir = join(os.tmpdir(), "learnlinknodejs-db");
fs.mkdirSync(tempDir, { recursive: true });

const worker = new Worker(new URL("./pgWorker.js", import.meta.url), {
  workerData: { rootDir }
});

let nextId = 1;
let workerFailure = null;

worker.on("error", (error) => {
  workerFailure = error;
});

worker.on("exit", (code) => {
  if (code !== 0 && !workerFailure) {
    workerFailure = new Error(`PostgreSQL worker exited with code ${code}`);
  }
});

function readResult(resultPath) {
  const payload = JSON.parse(fs.readFileSync(resultPath, "utf8"));
  fs.rmSync(resultPath, { force: true });
  if (payload.error) {
    const error = new Error(payload.error.message);
    error.name = payload.error.name || "DatabaseError";
    error.code = payload.error.code;
    error.detail = payload.error.detail;
    throw error;
  }
  return payload.result;
}

function execute(kind, sql, params = []) {
  if (workerFailure) {
    throw workerFailure;
  }

  const id = nextId++;
  const signal = new Int32Array(new SharedArrayBuffer(4));
  const resultPath = join(tempDir, `${process.pid}-${id}.json`);

  worker.postMessage({ id, kind, sql, params, resultPath, signal });
  const timeoutMs = kind === "exec" ? 120000 : 30000;
  const waitStatus = Atomics.wait(signal, 0, 0, timeoutMs);
  if (waitStatus === "timed-out") {
    throw new Error(`Database request timed out for query: ${sql}`);
  }

  if (!fs.existsSync(resultPath)) {
    throw new Error("Database worker completed without writing a result file.");
  }

  return readResult(resultPath);
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
