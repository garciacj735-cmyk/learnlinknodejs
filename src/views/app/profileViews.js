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

function renderProfileEdit(context) {
  const user = findUserById(context.user.id);
  user.learnerProfile = getLearnerProfile(user.id);
  user.tutorProfile = getTutorProfile(user.id);
  return wrapPage(context, "Edit Profile", `
    <form class="panel form-panel" method="post" action="/profile/edit">
      ${csrfInput(context)}<input type="hidden" name="_method" value="PUT">
      <h1>Edit Profile</h1>
      <div class="page-tools"><a class="back-link" href="/profile/${user.id}"><span class="back-link-icon" aria-hidden="true"></span><span>Back</span></a></div>
      <div class="grid-2"><label>Name<input name="name" value="${escapeHtml(user.name)}" required></label><label>Gender<select name="gender">${option("boy", user.gender)}${option("girl", user.gender)}</select></label></div>
      <label>Bio<textarea name="bio">${escapeHtml(user.bio || "")}</textarea></label>
      <div class="grid-2">
        <label>Nationality<select name="nationality"><option value="">Select nationality</option>${COUNTRIES.map((item) => option(item, user.nationality)).join("")}</select></label>
        <label>City / Province<input name="location" value="${escapeHtml(user.location || "")}"></label>
        <label>Address<input name="address" value="${escapeHtml(user.address || "")}"></label>
        <label>Education<input name="education" value="${escapeHtml(user.education || "")}"></label>
        <label>Languages<input name="languages" value="${escapeHtml(user.languages || "")}"></label>
        <label>Phone<input name="phone" value="${escapeHtml(user.phone || "")}"></label>
        <label>Messenger<input name="messenger_link" value="${escapeHtml(user.messenger_link || "")}"></label>
        <label>Telegram<input name="telegram" value="${escapeHtml(user.telegram || "")}"></label>
        <label>Instagram<input name="instagram" value="${escapeHtml(user.instagram || "")}"></label>
        <label>Discord<input name="discord" value="${escapeHtml(user.discord || "")}"></label>
      </div>
      ${user.role === "learner"
        ? `<div class="grid-3"><label>Subjects Needed<input name="subjects_needed" value="${escapeHtml(user.learnerProfile?.subjects_needed || "")}"></label><label>Budget Min<input name="budget_min" type="number" value="${escapeHtml(user.learnerProfile?.budget_min ?? "")}"></label><label>Budget Max<input name="budget_max" type="number" value="${escapeHtml(user.learnerProfile?.budget_max ?? "")}"></label></div>`
        : `<div class="grid-3"><label>Subjects Offered<input name="subjects_offered" value="${escapeHtml(user.tutorProfile?.subjects_offered || "")}"></label><label>Hourly Rate<input name="hourly_rate" type="number" value="${escapeHtml(user.tutorProfile?.hourly_rate ?? "")}"></label><label>Availability<input name="availability" value="${escapeHtml(user.tutorProfile?.availability || "")}"></label></div>`}
      <h3>Change Password</h3>
      <div class="grid-2"><label>New password<input name="password" type="password"></label><label>Confirm password<input name="password_confirmation" type="password"></label></div>
      <button class="btn">Save Profile</button>
    </form>
  `);
}

function renderProfileBody(context, profile, posts, reviews) {
  const rating = averageRating(profile.id);
  const contactVisible = canSeeContact(context.user.id, profile.id, context.user.role);
  return `<div class="page-tools page-tools-inline"><a class="back-link" href="/posts"><span class="back-link-icon" aria-hidden="true"></span><span>Back</span></a></div><section class="profile-cover ${escapeHtml(profile.role)}"><img class="avatar huge ring" src="${escapeHtml(profile.avatar_url)}" alt=""><h1>${escapeHtml(profile.name)}</h1><div class="badge-row profile-badges"><span class="badge ${profile.role === "tutor" ? "purple" : "blue"}">${capitalize(profile.role)}</span>${profile.tutorProfile?.is_verified ? '<span class="badge mint shimmer">Verified</span>' : ""}</div>${profile.role === "tutor" ? `<p class="rating-line">${stars(rating)} <span class="soft">${rating || "No ratings yet"}</span></p>` : ""}<div class="profile-actions">${context.user.id === profile.id ? '<a class="btn" href="/profile/edit">Edit Profile</a>' : context.user.role !== "admin" ? `<button class="btn ghost" type="button" data-open-report-modal>Report User</button>` : ""}</div></section>${context.user.id !== profile.id && context.user.role !== "admin" ? `<section class="confirm-modal" id="reportModal" aria-hidden="true"><div class="confirm-modal-backdrop" data-close-report-modal></div><div class="confirm-modal-panel"><form class="report-modal-form" method="post" action="/report">${csrfInput(context)}<div class="confirm-modal-copy"><h2>Report Account</h2><p>Why are you reporting this account?</p><input type="hidden" name="reported_user_id" value="${profile.id}"><label>Reason<textarea id="reportReason" name="reason" maxlength="500" placeholder="Explain the reason for this report" required></textarea></label></div><div class="confirm-modal-actions"><button class="btn ghost sm" type="button" data-close-report-modal>Cancel</button><button class="btn danger sm" type="submit">Submit Report</button></div></form></div></section>` : ""}<section class="stats"><article><span>${posts.length}</span><p>Total Posts</p></article><article><span>${completedSessions(profile.id)}</span><p>Completed Sessions</p></article><article><span>${profile.role === "tutor" ? rating : new Date().getUTCFullYear() - new Date(profile.created_at || isoNow()).getUTCFullYear() + 1}</span><p>${profile.role === "tutor" ? "Average Rating" : "Days Active"}</p></article><article><span>${new Date(profile.created_at || isoNow()).getUTCFullYear()}</span><p>Member Since</p></article></section><section class="profile-grid"><article class="panel profile-panel"><h2>About</h2><p class="profile-bio">${escapeHtml(profile.bio || "No bio yet.")}</p><div class="profile-info-grid"><span>Nationality</span><b>${escapeHtml(profile.nationality || "Not provided")}</b><span>Address</span><b>${escapeHtml(profile.address || "Not provided")}</b><span>City / Province</span><b>${escapeHtml(profile.location || "Not provided")}</b><span>Education</span><b>${escapeHtml(profile.education || "Not provided")}</b><span>Languages</span><b>${escapeHtml(profile.languages || "Not provided")}</b>${context.user.id === profile.id ? `<span>Strike Count</span><b>${profile.strike_count || 0}</b>` : ""}</div></article><article class="panel profile-panel"><h2>Contact</h2>${contactVisible ? `<div class="profile-info-grid"><span>Email</span><b>${escapeHtml(profile.email)}</b>${["phone", "messenger_link", "telegram", "instagram", "discord"].map((field) => profile[field] ? `<span>${escapeHtml(field.replaceAll("_", " "))}</span><b>${escapeHtml(profile[field])}</b>` : "").join("")}</div>` : '<div class="profile-info-grid muted-contact"><span>Email</span><b>********@****.com</b><span>Phone</span><b>+63 **** *** ****</b></div>'}</article></section><section class="panel profile-panel"><h2>${profile.role === "tutor" ? "Subjects and Expertise" : "Learning Needs"}</h2><div class="profile-info-grid three-col">${profile.role === "tutor" ? `<span>Subjects</span><b>${escapeHtml(profile.tutorProfile?.subjects_offered || "No subjects listed.")}</b><span>Rate</span><b>&#8369;${formatMoney(profile.tutorProfile?.hourly_rate)}</b><span>Availability</span><b>${escapeHtml(profile.tutorProfile?.availability || "Not set")}</b>` : `<span>Subjects</span><b>${escapeHtml(profile.learnerProfile?.subjects_needed || "No subjects listed.")}</b><span>Budget</span><b>&#8369;${formatMoney(profile.learnerProfile?.budget_min)} - &#8369;${formatMoney(profile.learnerProfile?.budget_max)}</b><span>Status</span><b>${capitalize(profile.status)}</b>`}</div></section><section class="panel profile-panel"><h2>Achievements</h2><div class="achievement-grid">${["first_post", "verified_user", "top_rated", "active_member", "expert_tutor", "rising_star", "learnlink_pro", "team_player"].map((key) => {
    const earned = profile.achievements.find((entry) => entry.achievement_key === key);
    return `<div class="achievement ${earned ? "earned" : "locked"}"><b>${escapeHtml(key.replaceAll("_", " "))}</b><small>${earned ? formatDate(earned.earned_at) : "Locked"}</small></div>`;
  }).join("")}</div></section><section class="profile-section-head"><h2>Active Posts</h2></section><section class="post-grid">${posts.length ? posts.map((post) => renderPostCard(context, post)).join("") : emptyState("No active posts", "")}</section><section class="panel profile-panel"><h2>Reviews</h2>${reviews.length ? reviews.map((review) => `<article class="review-card"><div><b>${escapeHtml(review.reviewer.name)}</b><p>${stars(review.rating)}</p></div><p>${escapeHtml(review.comment || "No comment.")}</p></article>`).join("") : emptyState("No reviews yet", "")}</section>`;
}

export {
  renderProfileEdit,
  renderProfileBody
};
