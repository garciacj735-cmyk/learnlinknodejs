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

function handleApproveTutor(context, userId) {
  const user = findUserById(userId);
  if (!user || user.role !== "tutor") return sendHtml(context.res, 403, errorPage("403", "Invalid tutor."));
  db.prepare("UPDATE users SET status = 'active', email_verified_at = COALESCE(email_verified_at, ?), updated_at = ? WHERE id = ?").run(isoNow(), isoNow(), userId);
  db.prepare("INSERT INTO tutors (user_id, is_verified, created_at, updated_at) VALUES (?, 1, ?, ?) ON CONFLICT(user_id) DO UPDATE SET is_verified = 1, updated_at = excluded.updated_at").run(userId, isoNow(), isoNow());
  award(userId, "verified_user");
  if (new Date(user.created_at || isoNow()) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) award(userId, "rising_star");
  notify(userId, "Tutor account approved", "You can now log in and create tutor offers.", "success", "/dashboard");
  audit(context.user.id, "Approved tutor", "User", userId, user.email);
  pushFlash(context.session.id, "success", "Tutor approved.");
  return redirect(context.res, context.session.id, "/admin/tutors");
}

function handleDeclineTutor(context, userId) {
  const reason = sanitize(context.body.reason);
  const user = findUserById(userId);
  notify(userId, "Tutor account declined", reason, "error", "/");
  audit(context.user.id, "Declined tutor", "User", userId, reason);
  db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  pushFlash(context.session.id, "success", "Tutor declined.");
  return redirect(context.res, context.session.id, "/admin/tutors");
}

export {
  handleApproveTutor,
  handleDeclineTutor
};
