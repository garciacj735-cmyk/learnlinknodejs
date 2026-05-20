import { db } from "../database/db.js";

export function listAdminIds() {
  return db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
}

export function updateUserProfile(userId, update) {
  db.prepare(`UPDATE users
    SET name = ?, gender = ?, bio = ?, nationality = ?, address = ?, location = ?, education = ?, languages = ?, phone = ?, messenger_link = ?, telegram = ?, instagram = ?, discord = ?, password = COALESCE(?, password), updated_at = ?
    WHERE id = ?`)
    .run(
      update.name,
      update.gender,
      update.bio,
      update.nationality,
      update.address,
      update.location,
      update.education,
      update.languages,
      update.phone,
      update.messenger_link,
      update.telegram,
      update.instagram,
      update.discord,
      update.password,
      update.updatedAt,
      userId
    );
}

export function upsertLearnerProfile(userId, values) {
  db.prepare("INSERT INTO learner (user_id, subjects_needed, budget_min, budget_max, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET subjects_needed = excluded.subjects_needed, budget_min = excluded.budget_min, budget_max = excluded.budget_max, updated_at = excluded.updated_at")
    .run(userId, values.subjects_needed, values.budget_min, values.budget_max, values.created_at, values.updated_at);
}

export function upsertTutorProfile(userId, values) {
  db.prepare("INSERT INTO tutors (user_id, subjects_offered, availability, hourly_rate, is_verified, created_at, updated_at) VALUES (?, ?, ?, ?, COALESCE((SELECT is_verified FROM tutors WHERE user_id = ?), 0), ?, ?) ON CONFLICT(user_id) DO UPDATE SET subjects_offered = excluded.subjects_offered, availability = excluded.availability, hourly_rate = excluded.hourly_rate, updated_at = excluded.updated_at")
    .run(userId, values.subjects_offered, values.availability, values.hourly_rate, userId, values.created_at, values.updated_at);
}

export function listAchievementsForUser(userId) {
  return db.prepare("SELECT * FROM user_achievements WHERE user_id = ?").all(userId);
}

export function listWarningsForUser(userId) {
  return db.prepare("SELECT * FROM warnings WHERE user_id = ? ORDER BY created_at DESC").all(userId);
}

export function listReviewsForUser(userId) {
  return db.prepare("SELECT * FROM reviews WHERE reviewee_id = ? ORDER BY created_at DESC").all(userId);
}
