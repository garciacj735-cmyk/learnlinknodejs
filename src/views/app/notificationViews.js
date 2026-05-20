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

function renderNotifications(context) {
  const notes = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC").all(context.user.id);
  const page = paginate(notes, context.query.page || 1, 20);
  return wrapPage(context, "Notifications", `
    <div class="page-tools page-tools-inline"><a class="back-link" href="${context.user.role === "admin" ? "/admin/dashboard" : "/dashboard"}"><span class="back-link-icon" aria-hidden="true"></span><span>Back</span></a></div>
    <header class="page-head notification-head"><div><h1>Notifications</h1></div><div class="notification-tools"><form method="post" action="/notifications/read">${csrfInput(context)}<button class="btn ghost">Mark all as read</button></form><button class="btn danger trash-toggle" type="button" data-trash-mode>Trash</button></div></header>
    <form method="post" action="/notifications" id="bulkDeleteForm" data-confirm="Delete selected notifications? This cannot be undone.">${csrfInput(context)}<input type="hidden" name="_method" value="DELETE">
      <div class="bulk-delete-bar" id="bulkDeleteBar"><label class="check"><input type="checkbox" data-select-all> Select all</label><button class="btn danger" type="submit">Delete Selected</button></div>
      <section class="notification-list">${page.items.length ? page.items.map((note) => `<article class="notification-card ${note.is_read ? "" : "unread"}" data-notification-open data-notification-id="${note.id}" tabindex="0"><label class="notification-select"><input type="checkbox" name="notifications[]" value="${note.id}"></label><div class="notification-body"><div class="notification-title-row"><h2>${escapeHtml(note.title)}</h2><span class="badge">${escapeHtml(context.user.role === "admin" && note.type === "warning" ? "Needs Review" : capitalize(note.type))}</span></div><p>${nl2br(escapeHtml(note.message))}</p><small class="soft">${escapeHtml(relativeTime(note.created_at))}</small>${note.link && note.link !== "/admin/dashboard" ? `<p><a class="btn ghost sm" href="${escapeHtml(note.link)}">Open Related Page</a></p>` : ""}</div><button class="btn danger sm notification-delete" type="submit" form="delete-note-${note.id}">Delete</button><div class="notification-modal-source hidden" data-notification-source><div class="notification-modal-header-row"><div><h2>${escapeHtml(note.title)}</h2><small class="soft">${escapeHtml(relativeTime(note.created_at))}</small></div><span class="badge">${escapeHtml(context.user.role === "admin" && note.type === "warning" ? "Needs Review" : capitalize(note.type))}</span></div><div class="notification-modal-copy">${nl2br(escapeHtml(note.message))}</div>${note.link && note.link !== "/admin/dashboard" ? `<div class="notification-modal-footer"><a class="btn ghost sm" href="${escapeHtml(note.link)}">Open Related Page</a></div>` : ""}</div></article>`).join("") : emptyState("No notifications yet", "Your system alerts will appear here.")}</section>
    </form>
    <section class="notification-modal" id="notificationModal" aria-hidden="true"><div class="notification-modal-backdrop" data-close-notification-modal></div><div class="notification-modal-panel"><div class="notification-modal-toolbar"><button class="btn ghost sm" type="button" data-close-notification-modal>Close</button></div><div id="notificationModalContent"></div></div></section>
    ${page.items.map((note) => `<form id="delete-note-${note.id}" method="post" action="/notifications/${note.id}" data-confirm="Delete this notification?">${csrfInput(context)}<input type="hidden" name="_method" value="DELETE"></form>`).join("")}
    ${renderPager(context.url.pathname, context.query, page)}
  `);
}

export {
  renderNotifications
};
