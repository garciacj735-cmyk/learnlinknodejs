import { db, findUserById, getTutorProfile, averageRating, paginate, loadPost, loadTransaction, decorateUser } from '../../core/services.js';
import { wrapPage, renderPager, csrfInput, option, emptyState, stars, formatMoney, formatDate, formatDateTime, relativeTime, limit, capitalize, escapeHtml } from '../layout.js';

function renderAdminTransactions(context) {
  let transactions = db.prepare("SELECT * FROM transactions ORDER BY created_at DESC").all().map(loadTransaction);
  if (context.query.status) transactions = transactions.filter((tx) => tx.status === context.query.status);
  const page = paginate(transactions, context.query.page || 1, 15);
  return wrapPage(context, "Transactions", `<header class="page-head"><div><h1>Transactions</h1></div></header><form class="filters admin-filters"><select name="status"><option value="">All</option>${["Pending", "Ongoing", "Completed", "Cancelled"].map((item) => option(item, context.query.status)).join("")}</select><button class="btn">Filter</button></form><table class="admin-table"><tr><th>Post</th><th>Learner</th><th>Tutor</th><th>Status</th><th>Actions</th></tr>${page.items.length ? page.items.map((tx) => `<tr><td><b>${escapeHtml(tx.post.subject)}</b><br><small class="soft">${escapeHtml(limit(tx.message || "", 70))}</small></td><td>${escapeHtml(tx.learner.name)}</td><td>${escapeHtml(tx.tutor.name)}</td><td><span class="badge ${escapeHtml(tx.status.toLowerCase())}">${escapeHtml(tx.status)}</span></td><td><div class="table-actions"><a class="btn ghost sm" href="/transactions/${tx.id}">View</a></div></td></tr>`).join("") : `<tr><td colspan="5">${emptyState("No records found", "")}</td></tr>`}</table>${renderPager(context.url.pathname, context.query, page)}`);
}

export {
  renderAdminTransactions
};
