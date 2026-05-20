import { findUserById, getLearnerProfile, getTutorProfile, hashPassword, isoNow, loadPost, maybe, notify, numberValue, pushFlash, redirect, sanitize, sendHtml, sendPage } from "../../core/services.js";
import { listAdminIds, listAchievementsForUser, listReviewsForUser, listWarningsForUser, updateUserProfile, upsertLearnerProfile, upsertTutorProfile } from "../../repositories/userRepository.js";
import { listPostsByUser } from "../../repositories/postRepository.js";
import { errorPage, renderProfileBody, wrapPage } from "../../views/renderers.js";
import { db } from "../../database/db.js";

export function handleUpdateProfile(context) {
  const { user, body, session, res } = context;
  const update = {
    name: sanitize(body.name),
    gender: body.gender === "girl" ? "girl" : "boy",
    bio: maybe(body.bio),
    nationality: maybe(body.nationality),
    address: maybe(body.address),
    location: maybe(body.location),
    education: maybe(body.education),
    languages: maybe(body.languages),
    phone: maybe(body.phone),
    messenger_link: maybe(body.messenger_link),
    telegram: maybe(body.telegram),
    instagram: maybe(body.instagram),
    discord: maybe(body.discord),
    password: body.password ? hashPassword(body.password) : null,
    updatedAt: isoNow()
  };
  updateUserProfile(user.id, update);
  if (user.role === "learner") {
    upsertLearnerProfile(user.id, {
      subjects_needed: maybe(body.subjects_needed),
      budget_min: numberValue(body.budget_min),
      budget_max: numberValue(body.budget_max),
      created_at: isoNow(),
      updated_at: isoNow()
    });
  } else if (user.role === "tutor") {
    upsertTutorProfile(user.id, {
      subjects_offered: maybe(body.subjects_offered),
      availability: maybe(body.availability),
      hourly_rate: numberValue(body.hourly_rate),
      created_at: isoNow(),
      updated_at: isoNow()
    });
  }
  pushFlash(session.id, "success", "Profile updated.");
  return redirect(res, session.id, `/profile/${user.id}`);
}

export function handleProfile(context, userId) {
  const profile = findUserById(userId);
  if (!profile) return sendHtml(context.res, 404, errorPage("404", "User not found."));
  profile.learnerProfile = getLearnerProfile(userId);
  profile.tutorProfile = getTutorProfile(userId);
  profile.achievements = listAchievementsForUser(userId);
  profile.warnings = listWarningsForUser(userId);
  const posts = listPostsByUser(userId)
    .filter((post) => post.approval_status === "approved" || context.user.id === userId)
    .map(loadPost);
  const reviews = listReviewsForUser(userId).map((review) => ({ ...review, reviewer: findUserById(review.reviewer_id) }));
  return sendPage(context.res, wrapPage(context, profile.name, renderProfileBody(context, profile, posts, reviews)));
}

export function handleReport(context) {
  const { body, session, res, user } = context;
  db.prepare("INSERT INTO reports (reporter_id, reported_user_id, reported_post_id, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', ?, ?)")
    .run(user.id, numberValue(body.reported_user_id), numberValue(body.reported_post_id), sanitize(body.reason), isoNow(), isoNow());
  for (const admin of listAdminIds()) {
    notify(admin.id, "New report submitted", `${user.name} submitted a report.`, "warning", "/admin/reports");
  }
  pushFlash(session.id, "success", "Report submitted.");
  return redirect(res, session.id, context.req.headers.referer || "/dashboard");
}
