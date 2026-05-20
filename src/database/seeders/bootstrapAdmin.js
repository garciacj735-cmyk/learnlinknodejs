import { ADMIN_AVATAR } from "../../config/constants.js";
import { db } from "../db.js";
import { hashPassword } from "../../utils/security.js";
import { isoNow } from "../../utils/common.js";

export function ensureBootstrapAdmin() {
  const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (admin) return;
  const now = isoNow();
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@learnlink.local";
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || "Admin12345!";
  db.prepare(`INSERT INTO users (name, email, email_verified_at, password, role, gender, avatar_url, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'admin', 'boy', ?, 'active', ?, ?)`)
    .run("LearnLink Admin", email, now, hashPassword(password), ADMIN_AVATAR, now, now);
}
