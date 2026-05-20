import {
  db,
  sendHtml,
  sendPage,
  redirect,
  hashPassword,
  randomPassword,
  isoNow,
  findUserById,
  findUserByEmail,
  sanitize,
  notify,
  audit,
  award,
  getTutorProfile,
  getLearnerProfile,
  loadTransaction,
  csvEscape,
  pushFlash,
  sessionCookie
} from '../../core/services.js';
import { wrapPage, errorPage, escapeHtml, csrfInput } from '../../views/renderers.js';

function handleApprovePost(context, postId) {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(postId);
  db.prepare("UPDATE posts SET status = 'approved', approval_status = 'approved', decline_reason = NULL, updated_at = ? WHERE id = ?").run(isoNow(), postId);
  notify(post.user_id, "Post approved", `Your ${post.subject} post is now visible.`, "success", `/posts/${postId}`);
  const approvedCount = db.prepare("SELECT COUNT(*) AS total FROM posts WHERE user_id = ? AND approval_status = 'approved'").get(post.user_id).total;
  if (approvedCount === 1) award(post.user_id, "first_post");
  audit(context.user.id, "Approved post", "Post", postId, post.subject);
  pushFlash(context.session.id, "success", "Post approved.");
  return redirect(context.res, context.session.id, "/admin/posts");
}

function handleDeclinePost(context, postId) {
  const reason = sanitize(context.body.reason);
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(postId);
  db.prepare("UPDATE posts SET status = 'declined', approval_status = 'declined', decline_reason = ?, updated_at = ? WHERE id = ?").run(reason, isoNow(), postId);
  notify(post.user_id, "Post declined", reason, "error", `/posts/${postId}`);
  audit(context.user.id, "Declined post", "Post", postId, reason);
  pushFlash(context.session.id, "success", "Post declined.");
  return redirect(context.res, context.session.id, "/admin/posts");
}

function handleAdminDeletePost(context, postId) {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(postId);
  audit(context.user.id, "Deleted post", "Post", postId, post?.subject || null);
  db.prepare("DELETE FROM posts WHERE id = ?").run(postId);
  pushFlash(context.session.id, "success", "Post deleted.");
  return redirect(context.res, context.session.id, "/admin/posts");
}

export {
  handleApprovePost,
  handleDeclinePost,
  handleAdminDeletePost
};
