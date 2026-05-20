import { COUNTRIES, STANDARD_SUBJECTS } from '../../config/constants.js';
import {
  db,
  findUserById,
  getTutorProfile,
  getLearnerProfile,
  averageRating,
  completedSessions,
  canSeeContact,
  paginate,
  loadPost,
  loadTransaction,
  decorateUser,
  getVisibleTransactions,
  queryPostsForList,
  isoNow
} from '../../core/services.js';
import {
  wrapPage,
  renderPager,
  csrfInput,
  option,
  emptyState,
  stars,
  formatMoney,
  formatDate,
  formatDateTime,
  relativeTime,
  limit,
  recent,
  nl2br,
  hasFlash,
  capitalize,
  escapeHtml
} from '../layout.js';
import { renderPostCard } from './postViews.js';

function renderDashboard(context) {
  const transactions = getVisibleTransactions(context.user).slice(0, 3);
  const stats = {
    posts: db.prepare("SELECT COUNT(*) AS total FROM posts WHERE user_id = ?").get(context.user.id).total,
    requests: transactions.filter((tx) => tx.status === "Pending").length,
    completed: transactions.filter((tx) => tx.status === "Completed").length,
    ongoing: transactions.filter((tx) => tx.status === "Ongoing").length
  };
  if (context.user.role === "tutor") stats.rating = averageRating(context.user.id);
  const posts = db.prepare("SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT 3").all(context.user.id).map(loadPost);
  return wrapPage(context, "Dashboard", `
    <header class="page-head"><div><h1>Welcome back, ${escapeHtml(context.user.name)}</h1><p><span class="badge blue">${capitalize(context.user.role)}</span></p></div><a class="btn" href="/posts/create">Create Post</a></header>
    <section class="stats">${Object.entries(stats).map(([label, value]) => `<article><span>${escapeHtml(value)}</span><p>${escapeHtml(label.replaceAll("_", " "))}</p></article>`).join("")}</section>
    <section class="split">
      <div><div class="section-heading"><div><h2>Recent Posts</h2></div></div>${posts.length ? posts.map((post) => renderPostCard(context, post)).join("") : emptyState("No posts yet", "")}</div>
      <div><div class="section-heading"><div><h2>Recent Requests</h2></div><a class="btn ghost sm" href="/transactions">View All</a></div>${transactions.length ? transactions.map((tx) => {
        const other = context.user.id === tx.learner_id ? tx.tutor : tx.learner;
        return `<article class="transaction-summary-card"><div class="transaction-summary-compact"><div><p class="transaction-summary-eyebrow">${escapeHtml(tx.status)}</p><h3>${escapeHtml(limit(tx.post.subject, 18))}</h3><p class="transaction-summary-meta">${escapeHtml(other.name)} &middot; ${escapeHtml(relativeTime(tx.created_at))}</p></div><div class="transaction-summary-side"><span class="badge ${escapeHtml(tx.status.toLowerCase())}">${escapeHtml(tx.status)}</span><a class="btn ghost sm" href="/transactions/${tx.id}">Open Request</a></div></div></article>`;
      }).join("") : emptyState("No requests yet", "")}</div>
    </section>
  `);
}

export {
  renderDashboard
};
