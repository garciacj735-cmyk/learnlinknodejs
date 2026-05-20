import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..", "..");
const dbPath = join(rootDir, "data", "learnlink.sqlite");

export const db = new DatabaseSync(dbPath);
export { rootDir };
