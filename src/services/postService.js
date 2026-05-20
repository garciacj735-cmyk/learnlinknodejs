import { db } from "../database/db.js";
import { boolValue, numberValue, sanitize } from "../utils/common.js";
import { findUserById } from "./userService.js";

export function validatePostInput(body) {
  let subject = sanitize(body.subject);
  const customSubject = sanitize(body.custom_subject);
  if (subject === "Other") subject = customSubject;
  return {
    subject,
    category: sanitize(body.category),
    description: sanitize(body.description),
    hourly_rate: numberValue(body.hourly_rate),
    duration_hours: numberValue(body.duration_hours),
    availability: sanitize(body.availability),
    is_urgent: boolValue(body.is_urgent) ? 1 : 0,
    expiry_days: Number(body.expiry_days || 14)
  };
}

export function getTutorProfile(userId) {
  return db.prepare("SELECT * FROM tutors WHERE user_id = ?").get(userId) || null;
}

export function getLearnerProfile(userId) {
  return db.prepare("SELECT * FROM learner WHERE user_id = ?").get(userId) || null;
}

export function getTransactionsForPost(postId) {
  return db.prepare("SELECT * FROM transactions WHERE post_id = ? ORDER BY created_at DESC").all(postId);
}

export function loadPost(postRow) {
  const post = { ...postRow };
  post.user = findUserById(post.user_id);
  post.user.tutorProfile = getTutorProfile(post.user_id);
  return post;
}

export function queryPostsForList(user, query) {
  let sql = "SELECT * FROM posts WHERE approval_status = 'approved' AND status = 'approved'";
  const params = [];

  if (user?.role === "learner") {
    sql += " AND post_type = 'TutorOffer' AND user_id != ?";
    params.push(user.id);
  } else if (user?.role === "tutor") {
    sql += " AND post_type = 'LearnerRequest' AND user_id != ?";
    params.push(user.id);
  }

  sql += " ORDER BY created_at DESC";

  let posts = db.prepare(sql).all(...params).map(loadPost);
  posts = posts.filter((post) => {
    const txs = getTransactionsForPost(post.id);
    const locked = txs.some((tx) => ["Ongoing", "Completed"].includes(tx.status));
    if (!user && locked) return false;
    if (user) {
      post.viewerTransaction = txs.find((tx) => [tx.learner_id, tx.tutor_id].includes(user.id) && ["Pending", "Ongoing"].includes(tx.status)) || null;
      if (locked && !post.viewerTransaction) return false;
    }
    return true;
  });
  if (query.search) posts = posts.filter((post) => `${post.subject} ${post.description}`.toLowerCase().includes(query.search.toLowerCase()));
  if (query.category) posts = posts.filter((post) => post.category === query.category);
  if (query.custom_subject) posts = posts.filter((post) => post.subject === query.custom_subject);
  if (query.nationality) posts = posts.filter((post) => post.user.nationality === query.nationality);
  if (query.location) posts = posts.filter((post) => `${post.user.location || ""} ${post.user.address || ""}`.toLowerCase().includes(query.location.toLowerCase()));
  if (query.min) posts = posts.filter((post) => Number(post.hourly_rate || 0) >= Number(query.min));
  if (query.max) posts = posts.filter((post) => Number(post.hourly_rate || 0) <= Number(query.max));
  if (query.sort === "oldest") posts.reverse();
  return posts;
}

export function loadTransaction(row) {
  const tx = { ...row };
  tx.post = loadPost(db.prepare("SELECT * FROM posts WHERE id = ?").get(row.post_id));
  tx.learner = findUserById(row.learner_id);
  tx.tutor = findUserById(row.tutor_id);
  tx.reviews = db.prepare("SELECT * FROM reviews WHERE transaction_id = ? ORDER BY created_at DESC").all(tx.id).map((review) => ({
    ...review,
    reviewer: findUserById(review.reviewer_id),
    reviewee: findUserById(review.reviewee_id)
  }));
  return tx;
}

export function getVisibleTransactions(user) {
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  return db.prepare(`SELECT * FROM transactions
    WHERE (learner_id = ? OR tutor_id = ?)
    AND (status != 'Completed' OR completed_at >= ?)
    ORDER BY created_at DESC`).all(user.id, user.id, cutoff).map(loadTransaction);
}
