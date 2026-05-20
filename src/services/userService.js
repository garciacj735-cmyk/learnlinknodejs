import { ADMIN_AVATAR, BOY_AVATAR, GIRL_AVATAR } from "../config/constants.js";
import { db } from "../database/db.js";
import { isoNow } from "../utils/common.js";

export function decorateUser(user) {
  user.avatar_url = user.avatar_url || (user.role === "admin" ? ADMIN_AVATAR : user.gender === "girl" ? GIRL_AVATAR : BOY_AVATAR);
  return user;
}

export function findUserById(id) {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  return user ? decorateUser(user) : null;
}

export function findUserByEmail(email) {
  const user = db.prepare("SELECT * FROM users WHERE lower(email) = lower(?)").get(email);
  return user ? decorateUser(user) : null;
}

export function touchUser(userId) {
  db.prepare("UPDATE users SET last_seen_at = ?, updated_at = COALESCE(updated_at, ?) WHERE id = ?").run(isoNow(), isoNow(), userId);
}
