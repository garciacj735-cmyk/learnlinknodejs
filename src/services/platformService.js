import { db } from "../database/db.js";
import { isoNow } from "../utils/common.js";
import { findUserById } from "./userService.js";

export function notify(userId, title, message, type = "info", link = null) {
  db.prepare("INSERT INTO notifications (user_id, title, message, type, is_read, link, created_at) VALUES (?, ?, ?, ?, 0, ?, ?)").run(userId, title, message, type, link, isoNow());
}

export function audit(adminId, action, targetType = null, targetId = null, description = null) {
  db.prepare("INSERT INTO audit_logs (admin_id, action, target_type, target_id, description, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(adminId, action, targetType, targetId, description, isoNow());
}

export function award(userId, key) {
  db.prepare("INSERT OR IGNORE INTO user_achievements (user_id, achievement_key, earned_at) VALUES (?, ?, ?)").run(userId, key, isoNow());
}

export function averageRating(userId) {
  const row = db.prepare("SELECT AVG(rating) AS rating FROM reviews WHERE reviewee_id = ?").get(userId);
  return row?.rating ? Math.round(row.rating * 10) / 10 : 0;
}

export function completedSessions(userId) {
  return db.prepare("SELECT COUNT(*) AS total FROM transactions WHERE status = 'Completed' AND (learner_id = ? OR tutor_id = ?)").get(userId, userId).total;
}

export function canSeeContact(viewerId, otherId, viewerRole) {
  if (viewerId === otherId || viewerRole === "admin") return true;
  const row = db.prepare(`SELECT id FROM transactions WHERE status IN ('Ongoing', 'Completed')
    AND ((learner_id = ? AND tutor_id = ?) OR (learner_id = ? AND tutor_id = ?)) LIMIT 1`).get(viewerId, otherId, otherId, viewerId);
  return Boolean(row);
}

export function expireStalePendingTransactions() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const stale = db.prepare("SELECT * FROM transactions WHERE status = 'Pending' AND created_at <= ?").all(cutoff);
  for (const tx of stale) {
    db.prepare("UPDATE transactions SET status = 'Cancelled', cancelled_at = ?, decline_reason = ?, updated_at = ? WHERE id = ?")
      .run(isoNow(), "Request timed out after 7 days without a response.", isoNow(), tx.id);
    notify(tx.learner_id, "Request timed out", "Your pending request expired after 7 days with no response.", "warning", `/transactions/${tx.id}`);
    if (tx.tutor_id !== tx.learner_id) notify(tx.tutor_id, "Request timed out", "A pending request expired after 7 days with no response.", "warning", `/transactions/${tx.id}`);
  }
}

export function reactivateExpiredUsers() {
  const now = isoNow();
  const users = db.prepare("SELECT * FROM users WHERE status = 'deactivated' AND deactivated_until IS NOT NULL AND deactivated_until <= ?").all(now);
  for (const user of users) {
    db.prepare("UPDATE users SET status = 'active', strike_count = 0, deactivated_until = NULL, deactivation_reason = NULL, updated_at = ? WHERE id = ?").run(now, user.id);
    notify(user.id, "Account reactivated", "Your LearnLink account has been reactivated automatically. Your strike count has been cleared.", "success", "/dashboard");
  }
}

export function checkAchievements(userId) {
  const user = findUserById(userId);
  if (!user) return;
  const completed = completedSessions(userId);
  const ongoingOrCompleted = db.prepare("SELECT COUNT(*) AS total FROM transactions WHERE status IN ('Ongoing', 'Completed') AND (learner_id = ? OR tutor_id = ?)").get(userId, userId).total;
  const rating = averageRating(userId);
  const reviewCount = db.prepare("SELECT COUNT(*) AS total FROM reviews WHERE reviewee_id = ?").get(userId).total;
  if (completed >= 10) award(userId, "active_member");
  if (user.role === "tutor" && db.prepare("SELECT COUNT(*) AS total FROM transactions WHERE status = 'Completed' AND tutor_id = ?").get(userId).total >= 5) award(userId, "expert_tutor");
  if (completed >= 20) award(userId, "learnlink_pro");
  if (ongoingOrCompleted >= 10) award(userId, "team_player");
  if (user.role === "tutor" && rating >= 4.5 && reviewCount > 0) award(userId, "top_rated");
  if (new Date(user.created_at || isoNow()) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) award(userId, "rising_star");
}
