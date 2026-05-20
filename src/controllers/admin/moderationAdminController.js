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
  getTutorProfile,
  getLearnerProfile,
  loadTransaction,
  csvEscape,
  pushFlash,
  sessionCookie
} from '../../core/services.js';
import { wrapPage, errorPage, escapeHtml, csrfInput } from '../../views/renderers.js';

function handleIssueWarning(context) {
  const targetUser = findUserById(Number(context.body.user_id));
  if (!targetUser) {
    pushFlash(context.session.id, "error", "User not found.");
    return redirect(context.res, context.session.id, context.req.headers.referer || "/admin/warnings");
  }
  if (targetUser.status === "deactivated") {
    pushFlash(context.session.id, "error", "This account is already deactivated.");
    return redirect(context.res, context.session.id, context.req.headers.referer || "/admin/warnings");
  }
  const strike = Number(targetUser.strike_count || 0) + 1;
  const reason = sanitize(context.body.reason);
  const now = isoNow();
  let title = strike === 2 ? "Final warning issued" : "Warning issued";
  let successMessage = "Warning issued.";

  if (strike >= 3) {
    const reactivationDays = Number(context.body.reactivation_days || 0);
    if (!reactivationDays || reactivationDays < 1) {
      pushFlash(context.session.id, "error", "Reactivation days are required after the third strike.");
      return redirect(context.res, context.session.id, context.req.headers.referer || "/admin/warnings");
    }
    const reactivateAt = new Date(Date.now() + reactivationDays * 86400000).toISOString();
    db.prepare("INSERT INTO warnings (user_id, admin_id, reason, strike_number, action_type, reactivation_days, reactivate_at, created_at) VALUES (?, ?, ?, ?, 'deactivated', ?, ?, ?)").run(targetUser.id, context.user.id, reason, strike, reactivationDays, reactivateAt, now);
    db.prepare("UPDATE users SET strike_count = ?, status = 'deactivated', deactivated_until = ?, deactivation_reason = ?, updated_at = ? WHERE id = ?").run(strike, reactivateAt, reason, now, targetUser.id);
    title = "Account deactivated";
    successMessage = "Account deactivated with timed reactivation.";
    notify(targetUser.id, title, `${reason}\n\nYour account will be reactivated automatically after ${reactivateAt}.`, "warning", `/profile/${targetUser.id}`);
  } else {
    db.prepare("INSERT INTO warnings (user_id, admin_id, reason, strike_number, action_type, created_at) VALUES (?, ?, ?, ?, 'warning', ?)").run(targetUser.id, context.user.id, reason, strike, now);
    db.prepare("UPDATE users SET strike_count = ?, status = ?, updated_at = ? WHERE id = ?").run(strike, targetUser.status, now, targetUser.id);
    notify(targetUser.id, title, reason, "warning", `/profile/${targetUser.id}`);
  }
  if (Number(context.body.report_id)) {
    db.prepare("UPDATE reports SET status = 'resolved', updated_at = ? WHERE id = ?").run(isoNow(), Number(context.body.report_id));
  }
  audit(context.user.id, strike >= 3 ? "Deactivated user after warnings" : "Issued warning", "User", targetUser.id, `Strike ${strike}`);
  pushFlash(context.session.id, "success", successMessage);
  return redirect(context.res, context.session.id, context.req.headers.referer || "/admin/warnings");
}

function handleSendAnnouncement(context) {
  const result = db.prepare("INSERT INTO announcements (admin_id, title, message, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(context.user.id, sanitize(context.body.title), sanitize(context.body.message), isoNow(), isoNow());
  for (const user of db.prepare("SELECT id FROM users WHERE status = 'active' AND role != 'admin'").all()) {
    notify(user.id, sanitize(context.body.title), sanitize(context.body.message), "info", "/dashboard");
  }
  audit(context.user.id, "Sent announcement", "Announcement", Number(result.lastInsertRowid), sanitize(context.body.title));
  pushFlash(context.session.id, "success", "Announcement sent.");
  return redirect(context.res, context.session.id, "/admin/announcements");
}

function handleDeleteAnnouncement(context, id) {
  const announcement = db.prepare("SELECT * FROM announcements WHERE id = ?").get(id);
  audit(context.user.id, "Deleted announcement", "Announcement", id, announcement?.title || null);
  if (announcement) {
    db.prepare("DELETE FROM notifications WHERE type = 'info' AND title = ? AND message = ? AND link = '/dashboard'").run(announcement.title, announcement.message);
  }
  db.prepare("DELETE FROM announcements WHERE id = ?").run(id);
  pushFlash(context.session.id, "success", "Announcement deleted.");
  return redirect(context.res, context.session.id, "/admin/announcements");
}

function handleReportStatus(context, reportId, status) {
  if (!["resolved", "dismissed"].includes(status)) return sendHtml(context.res, 403, errorPage("403", "Invalid report status."));
  db.prepare("UPDATE reports SET status = ?, updated_at = ? WHERE id = ?").run(status, isoNow(), reportId);
  audit(context.user.id, `${status[0].toUpperCase()}${status.slice(1)} report`, "Report", reportId, db.prepare("SELECT reason FROM reports WHERE id = ?").get(reportId)?.reason || null);
  pushFlash(context.session.id, "success", `Report ${status} and removed from the pending queue.`);
  return redirect(context.res, context.session.id, "/admin/reports");
}

export {
  handleIssueWarning,
  handleSendAnnouncement,
  handleDeleteAnnouncement,
  handleReportStatus
};
