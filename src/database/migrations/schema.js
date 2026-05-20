import { db } from "../db.js";

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
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
      deactivated_until TEXT NULL,
      deactivation_reason TEXT NULL,
      email_verification_token TEXT NULL,
      remember_token TEXT NULL,
      created_at TEXT NULL,
      updated_at TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      email TEXT PRIMARY KEY,
      token TEXT NOT NULL,
      created_at TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS learner (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      subjects_needed TEXT NULL,
      budget_min NUMERIC(10, 2) NULL,
      budget_max NUMERIC(10, 2) NULL,
      created_at TEXT NULL,
      updated_at TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS tutors (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      availability TEXT NULL,
      is_verified INTEGER NOT NULL DEFAULT 0,
      subjects_offered TEXT NULL,
      hourly_rate NUMERIC(10, 2) NULL,
      created_at TEXT NULL,
      updated_at TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_type TEXT NOT NULL,
      subject TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      hourly_rate NUMERIC(10, 2) NULL,
      duration_hours NUMERIC(10, 2) NULL,
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
      id BIGSERIAL PRIMARY KEY,
      post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      learner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tutor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      learner_completed INTEGER NOT NULL DEFAULT 0,
      tutor_completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT NULL,
      cancelled_at TEXT NULL,
      cancelled_by BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
      decline_reason TEXT NULL,
      created_at TEXT NULL,
      updated_at TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id BIGSERIAL PRIMARY KEY,
      transaction_id BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      reviewer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reviewee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL,
      comment TEXT NULL,
      created_at TEXT NULL,
      updated_at TEXT NULL,
      UNIQUE(transaction_id, reviewer_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      is_read INTEGER NOT NULL DEFAULT 0,
      link TEXT NULL,
      created_at TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id BIGSERIAL PRIMARY KEY,
      admin_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NULL,
      updated_at TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS warnings (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      admin_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      strike_number INTEGER NOT NULL,
      action_type TEXT NOT NULL DEFAULT 'warning',
      reactivation_days INTEGER NULL,
      reactivate_at TEXT NULL,
      created_at TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      admin_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      target_type TEXT NULL,
      target_id BIGINT NULL,
      description TEXT NULL,
      created_at TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id BIGSERIAL PRIMARY KEY,
      reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reported_user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
      reported_post_id BIGINT NULL REFERENCES posts(id) ON DELETE SET NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NULL,
      updated_at TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      achievement_key TEXT NOT NULL,
      earned_at TEXT NULL,
      UNIQUE(user_id, achievement_key)
    );

    CREATE TABLE IF NOT EXISTS node_sessions (
      id TEXT PRIMARY KEY,
      user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
      csrf_token TEXT NOT NULL,
      flashes TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  ensureColumn("users", "deactivated_until", "TEXT NULL");
  ensureColumn("users", "deactivation_reason", "TEXT NULL");
  ensureColumn("warnings", "action_type", "TEXT NOT NULL DEFAULT 'warning'");
  ensureColumn("warnings", "reactivation_days", "INTEGER NULL");
  ensureColumn("warnings", "reactivate_at", "TEXT NULL");
}

export function ensureColumn(table, column, definition) {
  db.exec(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`);
}
