import { db, findUserById, averageRating, paginate, decorateUser } from '../../core/services.js';
import { wrapPage, renderPager, emptyState, formatDateTime, relativeTime, escapeHtml } from '../layout.js';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function weekdayIndex(dateValue) {
  const day = new Date(dateValue).getDay();
  return (day + 6) % 7;
}

function buildWeeklySeries(rows, selector = () => 1) {
  const values = Array(7).fill(0);
  rows.forEach((row) => {
    values[weekdayIndex(row.created_at)] += Number(selector(row) || 0);
  });
  return values;
}

function renderStatCards(cards) {
  return cards.map((card) => `<article class="dashboard-stat-card tone-${card.tone}"><span class="dashboard-stat-label">${escapeHtml(card.label)}</span><strong>${escapeHtml(String(card.value))}</strong></article>`).join('');
}

function renderAdminDashboard(context) {
  const stats = {
    users: db.prepare("SELECT COUNT(*) AS total FROM users").get().total,
    active_posts: db.prepare("SELECT COUNT(*) AS total FROM posts WHERE approval_status = 'approved'").get().total,
    pending_posts: db.prepare("SELECT COUNT(*) AS total FROM posts WHERE approval_status = 'pending'").get().total,
    pending_tutors: db.prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'tutor' AND status = 'pending'").get().total,
    active_transactions: db.prepare("SELECT COUNT(*) AS total FROM transactions WHERE status = 'Ongoing'").get().total,
    reports: db.prepare("SELECT COUNT(*) AS total FROM reports WHERE status = 'pending'").get().total,
    completed: db.prepare("SELECT COUNT(*) AS total FROM transactions WHERE status = 'Completed'").get().total
  };

  const posts = db.prepare("SELECT created_at FROM posts").all();
  const transactions = db.prepare("SELECT created_at, status FROM transactions").all();
  const users = db.prepare("SELECT role FROM users").all();
  const logs = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 6").all().map((log) => ({
    ...log,
    admin: findUserById(log.admin_id)
  }));

  const chartPayload = {
    overview: {
      labels: WEEKDAY_LABELS,
      posts: buildWeeklySeries(posts),
      transactions: buildWeeklySeries(transactions),
      approvals: buildWeeklySeries(db.prepare("SELECT created_at FROM posts WHERE approval_status = 'approved'").all()),
      roles: [
        users.filter((user) => user.role === 'learner').length,
        users.filter((user) => user.role === 'tutor').length
      ]
    }
  };

  const cards = [
    { label: 'Total Users', value: stats.users, note: `${stats.pending_tutors} tutor approvals waiting`, tone: 'blue' },
    { label: 'Active Posts', value: stats.active_posts, note: `${stats.pending_posts} pending review`, tone: 'violet' },
    { label: 'Open Reports', value: stats.reports, note: `${stats.active_transactions} ongoing transactions`, tone: 'green' },
    { label: 'Completed Sessions', value: stats.completed, note: 'Latest completed tutoring sessions', tone: 'slate' }
  ];

  return wrapPage(context, "Admin Overview", `<header class="page-head dashboard-page-head"><div><h1>Overview</h1></div></header><section class="dashboard-shell"><section class="dashboard-stat-grid">${renderStatCards(cards)}</section><section class="dashboard-main-grid"><article class="panel dashboard-chart-panel dashboard-chart-wide"><div class="dashboard-card-head"><div><h2>Platform Activity</h2></div><span class="badge blue">7 days</span></div><div class="dashboard-chart-wrap"><canvas id="activityChart"></canvas></div></article><article class="panel dashboard-chart-panel dashboard-chart-side"><div class="dashboard-card-head"><div><h2>User Roles</h2></div></div><div class="dashboard-chart-wrap dashboard-chart-wrap-donut"><canvas id="roleChart"></canvas></div></article></section><section class="dashboard-lower-grid"><article class="panel dashboard-chart-panel"><div class="dashboard-card-head"><div><h2>Weekly Approvals</h2></div></div><div class="dashboard-chart-wrap dashboard-chart-wrap-short"><canvas id="approvalChart"></canvas></div></article><article class="panel dashboard-feed-panel"><div class="dashboard-card-head"><div><h2>Recent Activity</h2></div><a class="btn ghost sm" href="/admin/audit-logs">Audit Logs</a></div><div class="dashboard-feed-list">${logs.length ? logs.map((log) => `<article class="dashboard-feed-item"><div><strong>${escapeHtml(log.action)}</strong><p>${escapeHtml(log.admin?.name || 'Admin')}${log.description ? ` | ${escapeHtml(log.description)}` : ''}</p></div><span>${escapeHtml(relativeTime(log.created_at))}</span></article>`).join('') : emptyState("No recent activity", "")}</div></article></section></section><script>window.CHART_DATA=${JSON.stringify(chartPayload)};</script>`);
}

function renderAdminAnalytics(context) {
  const subjects = db.prepare("SELECT subject, COUNT(*) AS total FROM posts GROUP BY subject ORDER BY total DESC LIMIT 10").all();
  const tutors = db.prepare("SELECT * FROM users WHERE role = 'tutor'").all().map(decorateUser).sort((a, b) => averageRating(b.id) - averageRating(a.id)).slice(0, 5);
  const ratio = {
    learners: db.prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'learner'").get().total,
    tutors: db.prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'tutor'").get().total
  };
  const totalUsers = ratio.learners + ratio.tutors;
  const topSubject = subjects[0];
  const topTutor = tutors[0];
  const transactions = db.prepare("SELECT created_at, status FROM transactions").all();

  const cards = [
    { label: 'Top Subject', value: topSubject?.subject || 'No data', note: topSubject ? `${topSubject.total} related posts` : 'No tracked demand yet', tone: 'blue' },
    { label: 'Top Tutor', value: topTutor?.name || 'No data', note: topTutor ? `${averageRating(topTutor.id).toFixed(2)} average rating` : 'No tutor reviews yet', tone: 'violet' },
    { label: 'Learner Accounts', value: ratio.learners, note: `${totalUsers ? ((ratio.learners / totalUsers) * 100).toFixed(1) : 0}% of total users`, tone: 'green' },
    { label: 'Tutor Accounts', value: ratio.tutors, note: `${totalUsers ? ((ratio.tutors / totalUsers) * 100).toFixed(1) : 0}% of total users`, tone: 'slate' }
  ];

  const chartPayload = {
    analytics: {
      subjectLabels: subjects.map((row) => row.subject),
      subjectData: subjects.map((row) => row.total),
      ratioLabels: ['Learners', 'Tutors'],
      ratioData: [ratio.learners, ratio.tutors],
      weeklyLabels: WEEKDAY_LABELS,
      completionData: buildWeeklySeries(transactions.filter((transaction) => transaction.status === 'Completed'))
    }
  };

  return wrapPage(context, "Analytics", `<header class="page-head dashboard-page-head"><div><h1>Analytics</h1></div></header><section class="dashboard-shell"><section class="dashboard-stat-grid">${renderStatCards(cards)}</section><section class="dashboard-main-grid"><article class="panel dashboard-chart-panel dashboard-chart-wide"><div class="dashboard-card-head"><div><h2>Subject Demand</h2></div><span class="badge blue">${subjects.length} tracked</span></div><div class="dashboard-chart-wrap"><canvas id="subjectsChart"></canvas></div></article><article class="panel dashboard-chart-panel dashboard-chart-side"><div class="dashboard-card-head"><div><h2>User Distribution</h2></div></div><div class="dashboard-chart-wrap dashboard-chart-wrap-donut"><canvas id="ratioChart"></canvas></div></article></section><section class="dashboard-lower-grid"><article class="panel dashboard-chart-panel"><div class="dashboard-card-head"><div><h2>Weekly Completions</h2></div></div><div class="dashboard-chart-wrap dashboard-chart-wrap-short"><canvas id="completionChart"></canvas></div></article><article class="panel dashboard-feed-panel"><div class="dashboard-card-head"><div><h2>Top Tutors</h2></div></div><div class="analytics-rank-list">${tutors.length ? tutors.map((user, index) => `<article class="analytics-rank-item"><span class="analytics-rank-badge">#${index + 1}</span><div class="analytics-rank-copy"><strong>${escapeHtml(user.name)}</strong><small class="soft">${averageRating(user.id).toFixed(2)} rating</small></div></article>`).join("") : emptyState("No rankings yet", "")}</div></article></section><article class="panel analytics-export-card dashboard-export-panel"><div class="dashboard-card-head"><div><h2>Exports</h2></div></div><div class="analytics-export-grid"><a class="analytics-export-link" href="/admin/export/users"><strong>Users</strong><span>CSV export</span></a><a class="analytics-export-link" href="/admin/export/posts"><strong>Posts</strong><span>CSV export</span></a><a class="analytics-export-link" href="/admin/export/transactions"><strong>Transactions</strong><span>CSV export</span></a><a class="analytics-export-link" href="/admin/export/reviews"><strong>Reviews</strong><span>CSV export</span></a></div></article></section><script>window.CHART_DATA=${JSON.stringify(chartPayload)};</script>`);
}

function renderAdminAudit(context) {
  const page = paginate(db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC").all().map((log) => ({ ...log, admin: findUserById(log.admin_id) })), context.query.page || 1, 10);
  return wrapPage(context, "Audit Log", `<header class="page-head"><div><h1>Audit Log</h1></div></header><table><tr><th>Admin</th><th>Action</th><th>Target</th><th>Description</th><th>Date</th></tr>${page.items.length ? page.items.map((log) => `<tr><td>${escapeHtml(log.admin?.name || "")}</td><td>${escapeHtml(log.action)}</td><td>${escapeHtml(log.target_type || "")} #${escapeHtml(log.target_id ?? "")}</td><td>${escapeHtml(log.description || "")}</td><td>${escapeHtml(formatDateTime(log.created_at))}</td></tr>`).join("") : '<tr><td colspan="5">No audit entries available.</td></tr>'}</table><div class="page-tools audit-log-actions"><a class="btn ghost" href="/admin/audit-logs/history">View Full Audit History</a></div>`);
}

function renderAdminAuditHistory(context) {
  const page = paginate(db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC").all().map((log) => ({ ...log, admin: findUserById(log.admin_id) })), context.query.page || 1, 25);
  return wrapPage(context, "Full Audit History", `<header class="page-head"><div><h1>Full Audit History</h1></div></header><div class="page-tools page-tools-inline"><a class="btn ghost" href="/admin/audit-logs">Back</a></div><table><tr><th>Admin</th><th>Action</th><th>Target</th><th>Description</th><th>Date</th></tr>${page.items.length ? page.items.map((log) => `<tr><td>${escapeHtml(log.admin?.name || "")}</td><td>${escapeHtml(log.action)}</td><td>${escapeHtml(log.target_type || "")} #${escapeHtml(log.target_id ?? "")}</td><td>${escapeHtml(log.description || "")}</td><td>${escapeHtml(formatDateTime(log.created_at))}</td></tr>`).join("") : '<tr><td colspan="5">No audit entries available.</td></tr>'}</table>${renderPager(context.url.pathname, context.query, page)}`);
}

export {
  renderAdminDashboard,
  renderAdminAnalytics,
  renderAdminAudit,
  renderAdminAuditHistory
};
