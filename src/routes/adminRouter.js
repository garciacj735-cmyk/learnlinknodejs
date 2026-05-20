import { sendHtml } from '../core/services.js';
import { errorPage } from '../views/renderers.js';
import {
  handleStoreAdmin,
  handleDeactivateUser,
  handleReactivateUser,
  handleAdminResetPassword,
  handleDeleteUser,
  handleApprovePost,
  handleDeclinePost,
  handleAdminDeletePost,
  handleApproveTutor,
  handleDeclineTutor,
  handleIssueWarning,
  handleSendAnnouncement,
  handleDeleteAnnouncement,
  handleReportStatus,
  handleExport,
  handleAdminUser
} from '../controllers/handlers.js';
import {
  renderAdminDashboard,
  renderAdminUsers,
  renderAdminAccounts,
  renderAdminPosts,
  renderAdminTutors,
  renderAdminTransactions,
  renderAdminWarnings,
  renderAdminAnnouncements,
  renderAdminAnalytics,
  renderAdminReports,
  renderAdminAudit,
  renderAdminAuditHistory
} from '../views/renderers.js';
import { sendPage, match } from '../core/services.js';

function routeAdmin(context) {
  const { req, res, url } = context;
  if (req.method === "GET" && url.pathname === "/admin/dashboard") return sendPage(res, renderAdminDashboard(context));
  if (req.method === "GET" && url.pathname === "/admin/users") return sendPage(res, renderAdminUsers(context));
  if (req.method === "GET" && url.pathname === "/admin/users/create") return sendPage(res, renderAdminAccounts(context));
  if (req.method === "POST" && url.pathname === "/admin/users/create") return handleStoreAdmin(context);
  if (req.method === "GET" && match(url.pathname, /^\/admin\/users\/(\d+)$/)) return handleAdminUser(context, Number(match(url.pathname, /^\/admin\/users\/(\d+)$/)[1]));
  if (req.method === "POST" && match(url.pathname, /^\/admin\/users\/(\d+)\/deactivate$/)) return handleDeactivateUser(context, Number(match(url.pathname, /^\/admin\/users\/(\d+)\/deactivate$/)[1]));
  if (req.method === "POST" && match(url.pathname, /^\/admin\/users\/(\d+)\/reactivate$/)) return handleReactivateUser(context, Number(match(url.pathname, /^\/admin\/users\/(\d+)\/reactivate$/)[1]));
  if (req.method === "POST" && match(url.pathname, /^\/admin\/users\/(\d+)\/reset-password$/)) return handleAdminResetPassword(context, Number(match(url.pathname, /^\/admin\/users\/(\d+)\/reset-password$/)[1]));
  if (req.method === "DELETE" && match(url.pathname, /^\/admin\/users\/(\d+)$/)) return handleDeleteUser(context, Number(match(url.pathname, /^\/admin\/users\/(\d+)$/)[1]));

  if (req.method === "GET" && url.pathname === "/admin/posts") return sendPage(res, renderAdminPosts(context));
  if (req.method === "POST" && match(url.pathname, /^\/admin\/posts\/(\d+)\/approve$/)) return handleApprovePost(context, Number(match(url.pathname, /^\/admin\/posts\/(\d+)\/approve$/)[1]));
  if (req.method === "POST" && match(url.pathname, /^\/admin\/posts\/(\d+)\/decline$/)) return handleDeclinePost(context, Number(match(url.pathname, /^\/admin\/posts\/(\d+)\/decline$/)[1]));
  if (req.method === "DELETE" && match(url.pathname, /^\/admin\/posts\/(\d+)$/)) return handleAdminDeletePost(context, Number(match(url.pathname, /^\/admin\/posts\/(\d+)$/)[1]));

  if (req.method === "GET" && url.pathname === "/admin/tutors") return sendPage(res, renderAdminTutors(context));
  if (req.method === "POST" && match(url.pathname, /^\/admin\/tutors\/(\d+)\/approve$/)) return handleApproveTutor(context, Number(match(url.pathname, /^\/admin\/tutors\/(\d+)\/approve$/)[1]));
  if (req.method === "POST" && match(url.pathname, /^\/admin\/tutors\/(\d+)\/decline$/)) return handleDeclineTutor(context, Number(match(url.pathname, /^\/admin\/tutors\/(\d+)\/decline$/)[1]));

  if (req.method === "GET" && url.pathname === "/admin/transactions") return sendPage(res, renderAdminTransactions(context));
  if (req.method === "GET" && url.pathname === "/admin/warnings") return sendPage(res, renderAdminWarnings(context));
  if (req.method === "POST" && url.pathname === "/admin/warnings") return handleIssueWarning(context);
  if (req.method === "GET" && url.pathname === "/admin/announcements") return sendPage(res, renderAdminAnnouncements(context));
  if (req.method === "POST" && url.pathname === "/admin/announcements") return handleSendAnnouncement(context);
  if (req.method === "DELETE" && match(url.pathname, /^\/admin\/announcements\/(\d+)$/)) return handleDeleteAnnouncement(context, Number(match(url.pathname, /^\/admin\/announcements\/(\d+)$/)[1]));
  if (req.method === "GET" && url.pathname === "/admin/analytics") return sendPage(res, renderAdminAnalytics(context));
  if (req.method === "GET" && url.pathname === "/admin/reports") return sendPage(res, renderAdminReports(context));
  if (req.method === "POST" && match(url.pathname, /^\/admin\/reports\/(\d+)\/([^/]+)$/)) return handleReportStatus(context, Number(match(url.pathname, /^\/admin\/reports\/(\d+)\/([^/]+)$/)[1]), match(url.pathname, /^\/admin\/reports\/(\d+)\/([^/]+)$/)[2]);
  if (req.method === "GET" && url.pathname === "/admin/audit-logs") return sendPage(res, renderAdminAudit(context));
  if (req.method === "GET" && url.pathname === "/admin/audit-logs/history") return sendPage(res, renderAdminAuditHistory(context));
  if (req.method === "GET" && match(url.pathname, /^\/admin\/export\/([^/]+)$/)) return handleExport(context, match(url.pathname, /^\/admin\/export\/([^/]+)$/)[1]);
  return sendHtml(context.res, 404, errorPage("404", "Admin page not found."));
}

export { routeAdmin };
