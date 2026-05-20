import { sendHtml, sendPage, redirect, isoNow, sanitize, validatePostInput, loadPost, notify, pushFlash } from "../../core/services.js";
import { listAdminIds } from "../../repositories/userRepository.js";
import { createPost, deletePostById, getPostById, incrementPostRequestCount, incrementPostViewCount, listRelatedApprovedPosts, updatePost } from "../../repositories/postRepository.js";
import { createTransaction, findActiveViewerTransaction, findLockedTransactionForPost } from "../../repositories/transactionRepository.js";
import { errorPage, renderPostForm, renderPostShowBody, wrapPage } from "../../views/renderers.js";

export function handleStorePost(context) {
  const { user, body, session, res } = context;
  const data = validatePostInput(body);
  const now = isoNow();
  const result = createPost({
    user_id: user.id,
    post_type: user.role === "learner" ? "LearnerRequest" : "TutorOffer",
    subject: data.subject,
    category: data.category,
    description: data.description,
    hourly_rate: data.hourly_rate,
    duration_hours: data.duration_hours,
    availability: data.availability,
    is_urgent: data.is_urgent,
    expires_at: new Date(Date.now() + data.expiry_days * 86400000).toISOString(),
    created_at: now,
    updated_at: now
  });
  const postId = Number(result.lastInsertRowid);
  notify(user.id, "Post submitted for approval", "Your post is waiting for admin review.", "info", `/posts/${postId}`);
  for (const admin of listAdminIds()) {
    notify(admin.id, "Post approval needed", `${user.name} submitted a post.`, "warning", "/admin/posts");
  }
  pushFlash(session.id, "success", "Post submitted for approval.");
  return redirect(res, session.id, `/posts/${postId}`);
}

export function handleShowPost(context, postId) {
  const postRow = getPostById(postId);
  if (!postRow) return sendHtml(context.res, 404, errorPage("404", "Post not found."));
  const post = loadPost(postRow);
  const viewer = context.user;
  const lockTx = findLockedTransactionForPost(postId);
  if (post.approval_status !== "approved" && (!viewer || (viewer.id !== post.user_id && viewer.role !== "admin"))) {
    return sendHtml(context.res, 404, errorPage("404", "Post not found."));
  }
  if (lockTx) {
    const allowed = viewer && (viewer.role === "admin" || viewer.id === post.user_id || [lockTx.learner_id, lockTx.tutor_id].includes(viewer.id));
    if (!allowed) return sendHtml(context.res, 404, errorPage("404", "Post not found."));
  }
  if (viewer && viewer.role !== "admin" && viewer.id !== post.user_id) {
    if (viewer.role === "learner" && post.post_type !== "TutorOffer") {
      return sendHtml(context.res, 404, errorPage("404", "Post not found."));
    }
    if (viewer.role === "tutor" && post.post_type !== "LearnerRequest") {
      return sendHtml(context.res, 404, errorPage("404", "Post not found."));
    }
  }
  let viewerTransaction = null;
  if (viewer && viewer.role !== "admin" && viewer.id !== post.user_id) {
    viewerTransaction = findActiveViewerTransaction(postId, viewer.id);
  }
  incrementPostViewCount(postId);
  let related = listRelatedApprovedPosts(postId, post.subject).map(loadPost);
  if (viewer && viewer.role === "learner") {
    related = related.filter((item) => item.user_id === viewer.id || item.post_type === "TutorOffer");
  }
  if (viewer && viewer.role === "tutor") {
    related = related.filter((item) => item.user_id === viewer.id || item.post_type === "LearnerRequest");
  }
  return sendPage(context.res, wrapPage(context, post.subject, renderPostShowBody(context, loadPost(getPostById(postId)), related, viewerTransaction)));
}

export function handleEditPost(context, postId) {
  const post = getPostById(postId);
  if (!post || post.user_id !== context.user.id) return sendHtml(context.res, 403, errorPage("403", "You cannot edit this post."));
  return sendPage(context.res, renderPostForm(context, post, "edit"));
}

export function handleUpdatePost(context, postId) {
  const post = getPostById(postId);
  if (!post || post.user_id !== context.user.id) return sendHtml(context.res, 403, errorPage("403", "You cannot update this post."));
  const data = validatePostInput(context.body);
  updatePost(postId, { ...data, updated_at: isoNow() });
  pushFlash(context.session.id, "success", "Post updated and resubmitted for approval.");
  return redirect(context.res, context.session.id, `/posts/${postId}`);
}

export function handleDeletePost(context, postId) {
  const post = getPostById(postId);
  if (!post || post.user_id !== context.user.id) return sendHtml(context.res, 403, errorPage("403", "You cannot delete this post."));
  deletePostById(postId);
  pushFlash(context.session.id, "success", "Post deleted permanently.");
  return redirect(context.res, context.session.id, "/posts");
}

export function handleSendRequest(context, postId) {
  const { user, body, session, res } = context;
  const post = getPostById(postId);
  if (!post) return sendHtml(res, 404, errorPage("404", "Post not found."));
  if (post.user_id === user.id || post.approval_status !== "approved") return sendHtml(res, 403, errorPage("403", "You cannot request this post."));
  if (user.role === "learner" && post.post_type !== "TutorOffer") return sendHtml(res, 403, errorPage("403", "Learners can only request tutor posts."));
  if (user.role === "tutor" && post.post_type !== "LearnerRequest") return sendHtml(res, 403, errorPage("403", "Tutors can only request learner posts."));
  const locked = findLockedTransactionForPost(postId);
  if (locked) return sendHtml(res, 403, errorPage("403", "This post is already locked."));
  const existing = findActiveViewerTransaction(postId, user.id);
  if (existing) return redirect(res, session.id, `/transactions/${existing.id}`);
  const learnerId = user.role === "learner" ? user.id : post.user_id;
  const tutorId = user.role === "tutor" ? user.id : post.user_id;
  const result = createTransaction({
    post_id: postId,
    learner_id: learnerId,
    tutor_id: tutorId,
    message: sanitize(body.message),
    created_at: isoNow(),
    updated_at: isoNow()
  });
  incrementPostRequestCount(postId);
  notify(post.user_id, "Someone sent you a request", `${user.name} is interested in your post.`, "info", `/transactions/${Number(result.lastInsertRowid)}`);
  pushFlash(session.id, "success", "Request sent.");
  return redirect(res, session.id, `/transactions/${Number(result.lastInsertRowid)}`);
}
