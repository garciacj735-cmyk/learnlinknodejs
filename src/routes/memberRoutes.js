import { sendPage, match } from '../core/services.js';
import { withAuth } from '../middleware/auth.js';
import { renderDashboard, renderProfileEdit, renderTransactions, renderNotifications } from '../views/renderers.js';
import {
  handleLogout,
  handleUpdateProfile,
  handleProfile,
  handleReport,
  handleShowTransaction,
  handleAcceptTransaction,
  handleDeclineTransaction,
  handleCancelTransaction,
  handleCompleteTransaction,
  handleReview,
  handleReadNotifications,
  handleReadNotification,
  handleDeleteNotifications,
  handleDeleteNotification,
  handleAiChat
} from '../controllers/handlers.js';

const memberRoles = ['learner', 'tutor', 'admin'];

export function handleMemberRoutes(context) {
  const { req, res, url } = context;

  if (req.method === 'POST' && url.pathname === '/logout') return withAuth(context, memberRoles, () => handleLogout(context));
  if (req.method === 'GET' && url.pathname === '/dashboard') return withAuth(context, memberRoles, () => sendPage(res, renderDashboard(context)));
  if (req.method === 'GET' && url.pathname === '/profile/edit') return withAuth(context, memberRoles, () => sendPage(res, renderProfileEdit(context)));
  if (req.method === 'PUT' && url.pathname === '/profile/edit') return withAuth(context, memberRoles, () => handleUpdateProfile(context));

  const profileMatch = match(url.pathname, /^\/profile\/(\d+)$/);
  if (req.method === 'GET' && profileMatch) return withAuth(context, memberRoles, () => handleProfile(context, Number(profileMatch[1])));
  if (req.method === 'POST' && url.pathname === '/report') return withAuth(context, memberRoles, () => handleReport(context));

  if (req.method === 'GET' && url.pathname === '/transactions') return withAuth(context, memberRoles, () => sendPage(res, renderTransactions(context)));
  const transactionMatch = match(url.pathname, /^\/transactions\/(\d+)$/);
  if (req.method === 'GET' && transactionMatch) return withAuth(context, memberRoles, () => handleShowTransaction(context, Number(transactionMatch[1])));

  const acceptMatch = match(url.pathname, /^\/transactions\/(\d+)\/accept$/);
  if (req.method === 'POST' && acceptMatch) return withAuth(context, memberRoles, () => handleAcceptTransaction(context, Number(acceptMatch[1])));
  const declineMatch = match(url.pathname, /^\/transactions\/(\d+)\/decline$/);
  if (req.method === 'POST' && declineMatch) return withAuth(context, memberRoles, () => handleDeclineTransaction(context, Number(declineMatch[1])));
  const cancelMatch = match(url.pathname, /^\/transactions\/(\d+)\/cancel$/);
  if (req.method === 'POST' && cancelMatch) return withAuth(context, memberRoles, () => handleCancelTransaction(context, Number(cancelMatch[1])));
  const completeMatch = match(url.pathname, /^\/transactions\/(\d+)\/complete$/);
  if (req.method === 'POST' && completeMatch) return withAuth(context, memberRoles, () => handleCompleteTransaction(context, Number(completeMatch[1])));
  const reviewMatch = match(url.pathname, /^\/transactions\/(\d+)\/review$/);
  if (req.method === 'POST' && reviewMatch) return withAuth(context, memberRoles, () => handleReview(context, Number(reviewMatch[1])));

  if (req.method === 'GET' && (url.pathname === '/notifications' || url.pathname === '/admin/notifications')) return withAuth(context, memberRoles, () => sendPage(res, renderNotifications(context)));
  if (req.method === 'POST' && url.pathname === '/notifications/read') return withAuth(context, memberRoles, () => handleReadNotifications(context));
  const noteReadMatch = match(url.pathname, /^\/notifications\/(\d+)\/read$/);
  if (req.method === 'POST' && noteReadMatch) return withAuth(context, memberRoles, () => handleReadNotification(context, Number(noteReadMatch[1])));
  if (req.method === 'DELETE' && url.pathname === '/notifications') return withAuth(context, memberRoles, () => handleDeleteNotifications(context));
  const noteMatch = match(url.pathname, /^\/notifications\/(\d+)$/);
  if (req.method === 'DELETE' && noteMatch) return withAuth(context, memberRoles, () => handleDeleteNotification(context, Number(noteMatch[1])));

  if (req.method === 'POST' && url.pathname === '/ai/chat') return withAuth(context, memberRoles, () => handleAiChat(context));

  return null;
}
