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

function renderTransactions(context) {
  const page = paginate(getVisibleTransactions(context.user), context.query.page || 1, 10);
  return wrapPage(context, "Requests", `<header class="page-head"><h1>Requests</h1></header><section class="request-list">${page.items.length ? page.items.map((tx) => {
    const other = context.user.id === tx.learner_id ? tx.tutor : tx.learner;
    return `<article class="request-row"><div class="request-row-main"><span class="badge ${escapeHtml(tx.status.toLowerCase())}">${escapeHtml(tx.status)}</span><h3>${escapeHtml(tx.post.subject)}</h3><p>${escapeHtml(other.name)} &middot; ${escapeHtml(relativeTime(tx.created_at))}</p></div><div class="request-row-meta"><span>${escapeHtml(tx.post.post_type === "TutorOffer" ? "Tutor Offer" : "Learner Request")}</span><a class="btn ghost sm" href="/transactions/${tx.id}">Open Request</a></div></article>`;
  }).join("") : emptyState("No requests yet", "")}</section>${renderPager(context.url.pathname, context.query, page)}`);
}

function renderTransactionBody(context, tx) {
  const currentUserId = context.user.id;
  const other = currentUserId === tx.learner_id ? tx.tutor : tx.learner;
  const ownReview = tx.reviews.find((review) => review.reviewer_id === currentUserId);
  return `<div class="page-tools page-tools-inline"><a class="back-link" href="/transactions"><span class="back-link-icon" aria-hidden="true"></span><span>Back to Requests</span></a></div><section class="transaction-detail"><div class="panel transaction-main"><div class="transaction-head"><div><h1>${escapeHtml(tx.post.subject)}</h1></div><span class="badge ${escapeHtml(tx.status.toLowerCase())}">${escapeHtml(tx.status)}</span></div><div class="detail-grid"><article><span>Learner</span><a href="/profile/${tx.learner_id}">${escapeHtml(tx.learner.name)}</a></article><article><span>Tutor</span><a href="/profile/${tx.tutor_id}">${escapeHtml(tx.tutor.name)}</a></article><article><span>Post Type</span><b>${escapeHtml(tx.post.post_type)}</b></article><article><span>Created</span><b>${escapeHtml(formatDateTime(tx.created_at))}</b></article></div><div class="message-box"><h2>Requested Post</h2><div class="detail-grid"><article><span>Subject</span><b>${escapeHtml(tx.post.subject)}</b></article><article><span>Post Owner</span><a href="/profile/${tx.post.user_id}">${escapeHtml(tx.post.user.name)}</a></article><article><span>Rate</span><b>&#8369;${formatMoney(tx.post.hourly_rate)}</b></article><article><span>Duration</span><b>${escapeHtml(tx.post.duration_hours || "")} hours</b></article><article><span>Availability</span><b>${escapeHtml(tx.post.availability || "")}</b></article><article><span>Post Status</span><b>${capitalize(tx.post.approval_status)}</b></article></div><p class="soft">${escapeHtml(tx.post.description)}</p><a class="btn ghost sm" href="/posts/${tx.post_id}">Open Post</a></div><div class="message-box"><h2>Request Message</h2><p>${escapeHtml(tx.message || "No message provided.")}</p></div>${["Ongoing", "Completed"].includes(tx.status) ? `<div class="contact-box"><h2>Revealed Contact Details</h2><div class="detail-grid"><article><span>Learner Email</span><b>${escapeHtml(tx.learner.email)}</b></article><article><span>Learner Phone</span><b>${escapeHtml(tx.learner.phone || "Not provided")}</b></article><article><span>Tutor Email</span><b>${escapeHtml(tx.tutor.email)}</b></article><article><span>Tutor Phone</span><b>${escapeHtml(tx.tutor.phone || "Not provided")}</b></article></div></div>` : ""}${tx.status === "Ongoing" ? `<div class="completion-row"><span>Learner completed: <b>${tx.learner_completed ? "Yes" : "No"}</b></span><span>Tutor completed: <b>${tx.tutor_completed ? "Yes" : "No"}</b></span></div>` : ""}</div><aside class="panel transaction-actions"><h2>Actions</h2>${tx.status === "Pending" && tx.post.user_id === context.user.id ? `<form method="post" action="/transactions/${tx.id}/accept">${csrfInput(context)}<button class="btn wide">Accept Request</button></form><form method="post" action="/transactions/${tx.id}/decline" data-confirm="Decline this request?">${csrfInput(context)}<label>Decline reason<textarea name="reason" placeholder="Decline reason"></textarea></label><button class="btn danger wide">Decline</button></form>` : ""}${["Pending", "Ongoing"].includes(tx.status) ? `<form method="post" action="/transactions/${tx.id}/cancel" data-confirm="Cancel this request?">${csrfInput(context)}<button class="btn danger wide">Cancel</button></form>` : ""}${tx.status === "Ongoing" ? `<form method="post" action="/transactions/${tx.id}/complete">${csrfInput(context)}<button class="btn pulse wide">Mark as Completed</button></form>` : ""}${tx.status === "Completed" && [tx.learner_id, tx.tutor_id].includes(context.user.id) ? `<form class="review-form" method="post" action="/transactions/${tx.id}/review">${csrfInput(context)}<h3>Review ${escapeHtml(other.name)}</h3><label>Rating<select name="rating">${[5, 4, 3, 2, 1].map((value) => `<option value="${value}" ${Number(ownReview?.rating) === value ? "selected" : ""}>${value} stars</option>`).join("")}</select></label><label>Comment<textarea name="comment" placeholder="Write a comment">${escapeHtml(ownReview?.comment || "")}</textarea></label><button class="btn wide">Save Review</button></form>` : ""}${tx.reviews.length ? `<div class="review-list-mini"><h3>Saved Reviews</h3>${tx.reviews.map((review) => `<article><b>${escapeHtml(review.reviewer.name)}</b><span>${review.rating} / 5</span></article>`).join("")}</div>` : ""}</aside></section>`;
}

export {
  renderTransactions,
  renderTransactionBody
};
