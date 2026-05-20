import { db } from "../database/db.js";

export function getTransactionById(txId) {
  return db.prepare("SELECT * FROM transactions WHERE id = ?").get(txId);
}

export function createTransaction(values) {
  return db.prepare(`INSERT INTO transactions (post_id, learner_id, tutor_id, message, status, learner_completed, tutor_completed, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'Pending', 0, 0, ?, ?)`)
    .run(values.post_id, values.learner_id, values.tutor_id, values.message, values.created_at, values.updated_at);
}

export function findActiveViewerTransaction(postId, userId) {
  return db.prepare("SELECT * FROM transactions WHERE post_id = ? AND (learner_id = ? OR tutor_id = ?) AND status IN ('Pending', 'Ongoing') ORDER BY created_at DESC LIMIT 1").get(postId, userId, userId);
}

export function findLockedTransactionForPost(postId) {
  return db.prepare("SELECT * FROM transactions WHERE post_id = ? AND status IN ('Ongoing', 'Completed') ORDER BY completed_at DESC LIMIT 1").get(postId);
}

export function listOtherPendingTransactions(postId, txId) {
  return db.prepare("SELECT * FROM transactions WHERE post_id = ? AND id != ? AND status = 'Pending'").all(postId, txId);
}

export function listTransactionsByUser(userId) {
  return db.prepare("SELECT * FROM transactions WHERE learner_id = ? OR tutor_id = ? ORDER BY created_at DESC").all(userId, userId);
}

export function updateTransactionStatus(txId, status, updatedAt) {
  db.prepare("UPDATE transactions SET status = ?, updated_at = ? WHERE id = ?").run(status, updatedAt, txId);
}

export function cancelTransaction(txId, cancelledAt, cancelledBy, declineReason, updatedAt) {
  db.prepare("UPDATE transactions SET status = 'Cancelled', cancelled_at = ?, cancelled_by = ?, decline_reason = ?, updated_at = ? WHERE id = ?")
    .run(cancelledAt, cancelledBy, declineReason, updatedAt, txId);
}

export function markTransactionCompletion(txId, field, updatedAt) {
  db.prepare(`UPDATE transactions SET ${field} = 1, updated_at = ? WHERE id = ?`).run(updatedAt, txId);
}

export function completeTransaction(txId, completedAt, updatedAt) {
  db.prepare("UPDATE transactions SET status = 'Completed', completed_at = ?, updated_at = ? WHERE id = ?").run(completedAt, updatedAt, txId);
}

export function saveReview(values) {
  db.prepare(`INSERT INTO reviews (transaction_id, reviewer_id, reviewee_id, rating, comment, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(transaction_id, reviewer_id) DO UPDATE SET rating = excluded.rating, comment = excluded.comment, updated_at = excluded.updated_at`)
    .run(values.transaction_id, values.reviewer_id, values.reviewee_id, values.rating, values.comment, values.created_at, values.updated_at);
}
