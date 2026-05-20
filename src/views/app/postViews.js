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

function renderPosts(context) {
  let posts = queryPostsForList(context.user, context.query);
  if (context.user?.role === "learner") {
    posts = posts.filter((post) => post.user_id !== context.user.id && post.post_type === "TutorOffer");
  } else if (context.user?.role === "tutor") {
    posts = posts.filter((post) => post.user_id !== context.user.id && post.post_type === "LearnerRequest");
  }
  const page = paginate(posts, context.query.page || 1, 10);
  const customSubjects = db.prepare("SELECT DISTINCT subject FROM posts WHERE approval_status = 'approved' AND status = 'approved' ORDER BY subject").all().map((row) => row.subject).filter((subject) => !STANDARD_SUBJECTS.includes(subject));
  return wrapPage(context, "Posts", `
    <header class="page-head"><div><h1>${context.user ? (context.user.role === "learner" ? "Tutor Offers" : "Learner Requests") : "Approved Posts"}</h1></div>${context.user ? '<a class="btn" href="/posts/create">Create Post</a>' : ""}</header>
    <form class="filters" method="get">
      <input name="search" placeholder="Search subject" value="${escapeHtml(context.query.search || "")}">
      <select name="category" data-post-category-filter><option value="">All categories</option>${["Academic", "Language", "Arts", "Music", "Sports", "Other"].map((item) => option(item, context.query.category)).join("")}</select>
      <select name="custom_subject" data-custom-subject-filter class="${context.query.category === "Other" ? "" : "hidden"}"><option value="">Custom subject</option>${customSubjects.map((item) => option(item, context.query.custom_subject)).join("")}</select>
      <select name="nationality"><option value="">All countries</option>${COUNTRIES.map((item) => option(item, context.query.nationality)).join("")}</select>
      <input name="location" placeholder="City or address" value="${escapeHtml(context.query.location || "")}">
      <input name="min" type="number" step="0.01" placeholder="Min &#8369;" value="${escapeHtml(context.query.min || "")}">
      <input name="max" type="number" step="0.01" placeholder="Max &#8369;" value="${escapeHtml(context.query.max || "")}">
      <select name="sort"><option value="newest" ${(context.query.sort || "newest") === "newest" ? "selected" : ""}>Newest</option><option value="oldest" ${context.query.sort === "oldest" ? "selected" : ""}>Oldest</option></select>
      <button class="btn">Filter</button>
    </form>
    <section class="post-grid">${page.items.length ? page.items.map((post) => renderPostCard(context, post)).join("") : emptyState("No posts found yet", "")}</section>
    ${renderPager(context.url.pathname, context.query, page)}
  `);
}

function renderPostForm(context, post, mode) {
  const title = mode === "create" ? "Create Post" : "Edit Post";
  const subject = post?.subject || "";
  return wrapPage(context, title, `
    <form class="panel form-panel" method="post" action="${mode === "create" ? "/posts" : `/posts/${post.id}`}">
      ${csrfInput(context)}
      ${mode === "edit" ? '<input type="hidden" name="_method" value="PUT">' : ""}
      <h1>${title}</h1>
      <div class="page-tools"><a class="back-link" href="${mode === "edit" ? `/posts/${post.id}` : "/posts"}"><span class="back-link-icon" aria-hidden="true"></span><span>Back</span></a></div>
      <div class="grid-2">
        <label>Subject<select name="subject" data-subject-select>${[...STANDARD_SUBJECTS, "Other"].map((item) => option(item, STANDARD_SUBJECTS.includes(subject) ? subject : subject ? "Other" : subject)).join("")}</select></label>
        <label>Category<select name="category">${["Academic", "Language", "Arts", "Music", "Sports", "Other"].map((item) => option(item, post?.category)).join("")}</select></label>
      </div>
      <div class="subject-other-panel ${(subject && !STANDARD_SUBJECTS.includes(subject)) ? "" : "hidden"}" data-subject-other><label>Custom Subject<input name="custom_subject" value="${escapeHtml(subject && !STANDARD_SUBJECTS.includes(subject) ? subject : "")}"></label></div>
      <div class="grid-3">
        <label>Hourly rate (&#8369;)<input name="hourly_rate" type="number" step="0.01" value="${escapeHtml(post?.hourly_rate ?? "")}"></label>
        <label>Duration hours<input name="duration_hours" type="number" step="0.5" value="${escapeHtml(post?.duration_hours ?? "")}"></label>
        <label>Expiry days<input name="expiry_days" type="number" value="14"></label>
      </div>
      <label>Availability<input name="availability" required placeholder="MWF 2pm to 5pm" value="${escapeHtml(post?.availability || "")}"></label>
      <label>Description<textarea name="description" maxlength="500" required>${escapeHtml(post?.description || "")}</textarea><small><span data-count-text>0</span>/500</small></label>
      <label class="check"><input type="checkbox" name="is_urgent" value="1" ${post?.is_urgent ? "checked" : ""}> Mark as urgent</label>
      <button class="btn wide">${mode === "create" ? "Submit Post" : "Save Changes"}</button>
    </form>
  `);
}

function renderPostShowBody(context, post, related, viewerTransaction) {
  const fromAdminPosts = context.query?.from === "admin-posts";
  const backHref = fromAdminPosts ? "/admin/posts" : "/posts";
  const backLabel = fromAdminPosts ? "Back" : "Back to Posts";
  const profileHref = fromAdminPosts ? `/admin/users/${post.user_id}` : `/profile/${post.user_id}`;
  const profileLabel = fromAdminPosts ? "View User" : "View Profile";
  return `<div class="page-tools page-tools-inline"><a class="back-link" href="${backHref}"><span class="back-link-icon" aria-hidden="true"></span><span>${backLabel}</span></a></div><section class="detail-hero" style="background-image:url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800')"></section><section class="detail-layout"><main class="panel detail-card"><div class="post-owner-block"><img class="avatar big ring" src="${escapeHtml(post.user.avatar_url)}" alt=""><div class="owner-copy"><h1>${escapeHtml(post.subject)}</h1><div class="owner-line"><a class="owner-name" href="${profileHref}">${escapeHtml(post.user.name)}</a><span class="badge ${post.post_type === "TutorOffer" ? "purple" : "blue"}">${post.post_type === "TutorOffer" ? "Tutor" : "Learner"}</span>${post.user.tutorProfile?.is_verified ? '<span class="badge mint shimmer">Verified</span>' : ""}</div><a class="btn ghost sm profile-inline" href="${profileHref}">${profileLabel}</a></div></div><p class="soft">Posted ${escapeHtml(relativeTime(post.created_at))} | Updated ${escapeHtml(relativeTime(post.updated_at || post.created_at))} | ${post.view_count + 1} views</p><section class="post-detail-grid"><article><span>Rate</span><b>&#8369;${formatMoney(post.hourly_rate)}</b></article><article><span>Duration</span><b>${escapeHtml(post.duration_hours || "")} hours</b></article><article><span>Availability</span><b>${escapeHtml(post.availability || "")}</b></article><article><span>Status</span><b><span class="badge">${capitalize(post.approval_status)}</span></b></article></section><section class="description-box"><h2>Description</h2><p>${escapeHtml(post.description)}</p></section></main><aside class="action-panel"><h2>Actions</h2>${context.user ? (context.user.id !== post.user_id && context.user.role !== "admin" ? viewerTransaction?.status === "Pending" ? '<div class="message-box"><h2>Request Status</h2><p class="soft">You already requested this post.</p><span class="btn disabled-action wide">Pending</span></div>' : viewerTransaction?.status === "Ongoing" ? '<div class="message-box"><h2>Request Status</h2><p class="soft">This request is already active in your requests list.</p><span class="btn disabled-action wide">Ongoing</span></div>' : `<form id="request" method="post" action="/posts/${post.id}/request">${csrfInput(context)}<label>Short message<textarea name="message" required>Hi, I am interested in your post.</textarea></label><button class="btn wide">Send Request</button></form><form method="post" action="/report">${csrfInput(context)}<input type="hidden" name="reported_post_id" value="${post.id}"><label>Report reason<textarea name="reason" placeholder="Report reason" required></textarea></label><button class="btn danger wide">Report Post</button></form>` : "") : '<button class="btn wide" data-login>Login to Request</button>'}${context.user && context.user.id === post.user_id ? `<a class="btn ghost wide" href="/posts/${post.id}/edit">Edit</a><form method="post" action="/posts/${post.id}" data-confirm="This action cannot be undone.">${csrfInput(context)}<input type="hidden" name="_method" value="DELETE"><button class="btn danger wide">Delete</button></form>` : ""}</aside></section><h2>Related Posts</h2><section class="post-grid">${related.length ? related.map((item) => renderPostCard(context, item)).join("") : emptyState("No related posts yet", "")}</section>`;
}

function renderPostCard(context, post) {
  const viewerTransaction = context.user && context.user.role !== "admin" && context.user.id !== post.user_id
    ? db.prepare("SELECT * FROM transactions WHERE post_id = ? AND (learner_id = ? OR tutor_id = ?) AND status IN ('Pending', 'Ongoing') ORDER BY created_at DESC LIMIT 1").get(post.id, context.user.id, context.user.id)
    : null;
  return `<article class="post-card ${post.post_type === "TutorOffer" ? "tutor-border" : "learner-border"} ${post.is_urgent ? "urgent" : ""}"><img class="avatar" src="${escapeHtml(post.user.avatar_url)}" alt=""><a class="name" href="/profile/${post.user_id}">${escapeHtml(post.user.name)}</a><div class="badge-row"><span class="badge ${post.post_type === "TutorOffer" ? "purple" : "blue"}">${post.post_type === "TutorOffer" ? "Tutor" : "Learner"}</span>${post.user.tutorProfile?.is_verified ? '<span class="badge mint shimmer">Verified</span>' : ""}</div><h3>${escapeHtml(post.subject)}</h3><p class="post-desc">${escapeHtml(limit(post.description, 110))}</p>${post.user.nationality || post.user.location || post.user.address ? `<p class="soft availability">${escapeHtml(post.user.nationality || "Country not set")}${post.user.location ? ` &middot; ${escapeHtml(post.user.location)}` : ""}${post.user.address ? ` &middot; ${escapeHtml(limit(post.user.address, 42))}` : ""}</p>` : ""}<div class="meta"><span>&#8369;${formatMoney(post.hourly_rate)}</span><span>${escapeHtml(post.duration_hours || "")} hr</span><span>${post.view_count} views</span></div><p class="soft availability">${escapeHtml(post.availability || "")}</p><div class="badge-row status-row">${recent(post.created_at) ? '<span class="badge mint pulse">NEW</span>' : ""}${post.is_urgent ? '<span class="badge red pulse">URGENT</span>' : ""}<span class="badge">${capitalize(post.approval_status)}</span></div><div class="actions"><a class="btn ghost" href="/posts/${post.id}">View Details</a>${context.user ? context.user.id !== post.user_id && context.user.role !== "admin" ? viewerTransaction?.status === "Pending" ? '<span class="btn disabled-action">Pending</span>' : viewerTransaction?.status === "Ongoing" ? '<span class="btn disabled-action">Ongoing</span>' : `<a class="btn" href="/posts/${post.id}#request">Send Request</a>` : "" : '<button class="btn" data-login>Send Request</button>'}</div></article>`;
}

export {
  renderPosts,
  renderPostForm,
  renderPostShowBody,
  renderPostCard
};
