import { db } from "../database/db.js";

export function countUnreadNotifications(userId) {
  return db.prepare("SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0").get(userId).total;
}

export function listNotificationsByUser(userId) {
  return db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC").all(userId);
}

export function markNotificationsRead(userId) {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").run(userId);
}

export function markNotificationRead(userId, id) {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id = ?").run(userId, id);
}

export function deleteNotificationsByIds(userId, ids) {
  if (!ids.length) return;
  const placeholders = ids.map(() => "?").join(",");
  db.prepare(`DELETE FROM notifications WHERE user_id = ? AND id IN (${placeholders})`).run(userId, ...ids);
}

export function deleteNotificationById(userId, id) {
  db.prepare("DELETE FROM notifications WHERE user_id = ? AND id = ?").run(userId, id);
}
