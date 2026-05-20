import { db } from "../database/db.js";

export function createPost(values) {
  return db.prepare(`INSERT INTO posts
    (user_id, post_type, subject, category, description, hourly_rate, duration_hours, availability, status, approval_status, decline_reason, is_urgent, view_count, request_count, expires_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', NULL, ?, 0, 0, ?, ?, ?)`)
    .run(values.user_id, values.post_type, values.subject, values.category, values.description, values.hourly_rate, values.duration_hours, values.availability, values.is_urgent, values.expires_at, values.created_at, values.updated_at);
}

export function getPostById(postId) {
  return db.prepare("SELECT * FROM posts WHERE id = ?").get(postId);
}

export function updatePost(postId, values) {
  db.prepare(`UPDATE posts
    SET subject = ?, category = ?, description = ?, hourly_rate = ?, duration_hours = ?, availability = ?, status = 'pending', approval_status = 'pending', decline_reason = NULL, is_urgent = ?, updated_at = ?
    WHERE id = ?`)
    .run(values.subject, values.category, values.description, values.hourly_rate, values.duration_hours, values.availability, values.is_urgent, values.updated_at, postId);
}

export function deletePostById(postId) {
  db.prepare("DELETE FROM posts WHERE id = ?").run(postId);
}

export function incrementPostViewCount(postId) {
  db.prepare("UPDATE posts SET view_count = view_count + 1 WHERE id = ?").run(postId);
}

export function incrementPostRequestCount(postId) {
  db.prepare("UPDATE posts SET request_count = request_count + 1 WHERE id = ?").run(postId);
}

export function listPostsByUser(userId) {
  return db.prepare("SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC").all(userId);
}

export function listRecentPostsByUser(userId, limit = 3) {
  return db.prepare("SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT ?").all(userId, limit);
}

export function listRelatedApprovedPosts(postId, subject, limit = 3) {
  return db.prepare("SELECT * FROM posts WHERE id != ? AND subject = ? AND approval_status = 'approved' AND status = 'approved' LIMIT ?").all(postId, subject, limit);
}

export function listApprovedDistinctSubjects() {
  return db.prepare("SELECT DISTINCT subject FROM posts WHERE approval_status = 'approved' AND status = 'approved' ORDER BY subject").all();
}
