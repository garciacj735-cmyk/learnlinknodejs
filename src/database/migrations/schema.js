import { db } from "../db.js";

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified_at TEXT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'learner',
      gender TEXT NULL,
      avatar_url TEXT NULL,
      bio TEXT NULL,
      nationality TEXT NULL,
      address TEXT NULL,
      location TEXT NULL,
      education TEXT NULL,
      languages TEXT NULL,
      phone TEXT NULL,
      messenger_link TEXT NULL,
      telegram TEXT NULL,
      instagram TEXT NULL,
      discord TEXT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      strike_count INTEGER NOT NULL DEFAULT 0,
      last_seen_at TEXT NULL,
      email_verification_token TEXT NULL,
      remember_token TEXT NULL,
      created_at TEXT NULL,
      updated_at TEXT NULL
    );
    CREATE TABLE IF NOT EXISTS password_reset_tokens (email TEXT PRIMARY KEY, token TEXT NOT NULL, created_at TEXT NULL);
    CREATE TABLE IF NOT EXISTS learner (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL UNIQUE, subjects_needed TEXT NULL, budget_min REAL NULL, budget_max REAL NULL, created_at TEXT NULL, updated_at TEXT NULL);
    CREATE TABLE IF NOT EXISTS tutors (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL UNIQUE, availability TEXT NULL, is_verified INTEGER NOT NULL DEFAULT 0, subjects_offered TEXT NULL, hourly_rate REAL NULL, created_at TEXT NULL, updated_at TEXT NULL);
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_type TEXT NOT NULL,
      subject TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      hourly_rate REAL NULL,
      duration_hours REAL NULL,
      availability TEXT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      approval_status TEXT NOT NULL DEFAULT 'pending',
      decline_reason TEXT NULL,
      is_urgent INTEGER NOT NULL DEFAULT 0,
      view_count INTEGER NOT NULL DEFAULT 0,
      request_count INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NULL,
      created_at TEXT NULL,
      updated_at TEXT NULL
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      learner_id INTEGER NOT NULL,
      tutor_id INTEGER NOT NULL,
      message TEXT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      learner_completed INTEGER NOT NULL DEFAULT 0,
      tutor_completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT NULL,
      cancelled_at TEXT NULL,
      cancelled_by INTEGER NULL,
      decline_reason TEXT NULL,
      created_at TEXT NULL,
      updated_at TEXT NULL
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      reviewee_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NULL,
      created_at TEXT NULL,
      updated_at TEXT NULL,
      UNIQUE(transaction_id, reviewer_id)
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      is_read INTEGER NOT NULL DEFAULT 0,
      link TEXT NULL,
      created_at TEXT NULL
    );
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NULL,
      updated_at TEXT NULL
    );
    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      admin_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      strike_number INTEGER NOT NULL,
      action_type TEXT NOT NULL DEFAULT 'warning',
      reactivation_days INTEGER NULL,
      reactivate_at TEXT NULL,
      created_at TEXT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NULL,
      target_id INTEGER NULL,
      description TEXT NULL,
      created_at TEXT NULL
    );
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      reported_user_id INTEGER NULL,
      reported_post_id INTEGER NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NULL,
      updated_at TEXT NULL
    );
    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      achievement_key TEXT NOT NULL,
      earned_at TEXT NULL,
      UNIQUE(user_id, achievement_key)
    );
    CREATE TABLE IF NOT EXISTS node_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NULL,
      csrf_token TEXT NOT NULL,
      flashes TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  ensureColumn("users", "role", "TEXT NOT NULL DEFAULT 'learner'");
  ensureColumn("users", "gender", "TEXT NULL");
  ensureColumn("users", "avatar_url", "TEXT NULL");
  ensureColumn("users", "bio", "TEXT NULL");
  ensureColumn("users", "nationality", "TEXT NULL");
  ensureColumn("users", "address", "TEXT NULL");
  ensureColumn("users", "location", "TEXT NULL");
  ensureColumn("users", "education", "TEXT NULL");
  ensureColumn("users", "languages", "TEXT NULL");
  ensureColumn("users", "phone", "TEXT NULL");
  ensureColumn("users", "messenger_link", "TEXT NULL");
  ensureColumn("users", "telegram", "TEXT NULL");
  ensureColumn("users", "instagram", "TEXT NULL");
  ensureColumn("users", "discord", "TEXT NULL");
  ensureColumn("users", "status", "TEXT NOT NULL DEFAULT 'active'");
  ensureColumn("users", "strike_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn("users", "last_seen_at", "TEXT NULL");
  ensureColumn("users", "deactivated_until", "TEXT NULL");
  ensureColumn("users", "deactivation_reason", "TEXT NULL");
  ensureColumn("users", "email_verification_token", "TEXT NULL");
  ensureColumn("users", "remember_token", "TEXT NULL");
  ensureColumn("users", "created_at", "TEXT NULL");
  ensureColumn("users", "updated_at", "TEXT NULL");
  ensureColumn("warnings", "action_type", "TEXT NOT NULL DEFAULT 'warning'");
  ensureColumn("warnings", "reactivation_days", "INTEGER NULL");
  ensureColumn("warnings", "reactivate_at", "TEXT NULL");
}

export function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((entry) => entry.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
