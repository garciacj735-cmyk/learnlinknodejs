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

function handleExport(context, type) {
  const allowed = {
    users: { sql: "SELECT id, name, email, role, status, strike_count, created_at FROM users ORDER BY id", file: "users" },
    posts: { sql: "SELECT id, user_id, post_type, subject, category, approval_status, created_at FROM posts ORDER BY id", file: "posts" },
    transactions: { sql: "SELECT id, post_id, learner_id, tutor_id, status, created_at FROM transactions ORDER BY id", file: "transactions" },
    reviews: { sql: "SELECT id, transaction_id, reviewer_id, reviewee_id, rating, created_at FROM reviews ORDER BY id", file: "reviews" },
    reports: { sql: "SELECT id, reporter_id, reported_user_id, reported_post_id, reason, status, created_at FROM reports ORDER BY id", file: "reports" }
  }[type];
  if (!allowed) return sendHtml(context.res, 404, errorPage("404", "Export type not found."));
  const rows = db.prepare(allowed.sql).all();
  audit(context.user.id, "Exported CSV", type, null, `Exported ${type}`);
  const csv = rows.length ? [Object.keys(rows[0]).join(","), ...rows.map((row) => Object.values(row).map(csvEscape).join(","))].join("\n") : "";
  context.res.statusCode = 200;
  context.res.setHeader("Content-Type", "text/csv; charset=utf-8");
  context.res.setHeader("Content-Disposition", `attachment; filename="learnlink-${allowed.file}.csv"`);
  context.res.setHeader("Set-Cookie", sessionCookie(context.session.id));
  context.res.end(csv);
}

export {
  handleExport
};
