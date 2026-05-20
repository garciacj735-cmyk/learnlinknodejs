import { checkAchievements, isoNow, notify, pushFlash, redirect, sanitize, sendHtml, sendPage } from "../../core/services.js";
import { errorPage, renderTransactionBody, wrapPage } from "../../views/renderers.js";
import { getPostById } from "../../repositories/postRepository.js";
import { cancelTransaction, completeTransaction, getTransactionById, listOtherPendingTransactions, markTransactionCompletion, saveReview, updateTransactionStatus } from "../../repositories/transactionRepository.js";
import { loadTransaction } from "../../services/postService.js";

export function handleShowTransaction(context, txId) {
  const txRow = getTransactionById(txId);
  if (!txRow) return sendHtml(context.res, 404, errorPage("404", "Transaction not found."));
  const tx = loadTransaction(txRow);
  const user = context.user;
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  if (![tx.learner_id, tx.tutor_id].includes(user.id) && user.role !== "admin") return sendHtml(context.res, 403, errorPage("403", "You cannot access this request."));
  if (user.role !== "admin" && tx.status === "Completed" && tx.completed_at && new Date(tx.completed_at) < cutoff) return sendHtml(context.res, 404, errorPage("404", "Transaction not found."));
  return sendPage(context.res, wrapPage(context, "Transaction", renderTransactionBody(context, tx)));
}

export function handleAcceptTransaction(context, txId) {
  const tx = getTransactionById(txId);
  if (!tx) return sendHtml(context.res, 404, errorPage("404", "Transaction not found."));
  const post = getPostById(tx.post_id);
  if (post.user_id !== context.user.id || tx.status !== "Pending") return sendHtml(context.res, 403, errorPage("403", "You cannot accept this request."));
  updateTransactionStatus(txId, "Ongoing", isoNow());
  for (const pending of listOtherPendingTransactions(post.id, txId)) {
    cancelTransaction(pending.id, isoNow(), context.user.id, "This post has already been matched with another request.", isoNow());
    const otherUserId = pending.learner_id === context.user.id ? pending.tutor_id : pending.learner_id;
    notify(otherUserId, "Request closed", "This post is no longer available because another request was accepted.", "info", `/transactions/${pending.id}`);
  }
  notify(tx.learner_id, "Your request was accepted", "Contact details are now available.", "success", `/transactions/${txId}`);
  notify(tx.tutor_id, "Request accepted", "Contact details are now available.", "success", `/transactions/${txId}`);
  pushFlash(context.session.id, "success", "Request accepted. Contact details are now visible.");
  return redirect(context.res, context.session.id, `/transactions/${txId}`);
}

export function handleDeclineTransaction(context, txId) {
  const reason = sanitize(context.body.reason || "Declined by post owner.");
  const tx = getTransactionById(txId);
  if (!tx) return sendHtml(context.res, 404, errorPage("404", "Transaction not found."));
  const post = getPostById(tx.post_id);
  if (post.user_id !== context.user.id) return sendHtml(context.res, 403, errorPage("403", "You cannot decline this request."));
  cancelTransaction(txId, isoNow(), context.user.id, reason, isoNow());
  const otherId = tx.learner_id === context.user.id ? tx.tutor_id : tx.learner_id;
  notify(otherId, "Your request was declined", reason, "error", `/transactions/${txId}`);
  pushFlash(context.session.id, "success", "Request declined.");
  return redirect(context.res, context.session.id, `/transactions/${txId}`);
}

export function handleCancelTransaction(context, txId) {
  const tx = getTransactionById(txId);
  if (!tx) return sendHtml(context.res, 404, errorPage("404", "Transaction not found."));
  if (![tx.learner_id, tx.tutor_id].includes(context.user.id) || tx.status === "Completed") return sendHtml(context.res, 403, errorPage("403", "You cannot cancel this request."));
  cancelTransaction(txId, isoNow(), context.user.id, null, isoNow());
  pushFlash(context.session.id, "success", "Request cancelled.");
  return redirect(context.res, context.session.id, `/transactions/${txId}`);
}

export function handleCompleteTransaction(context, txId) {
  const tx = getTransactionById(txId);
  if (!tx) return sendHtml(context.res, 404, errorPage("404", "Transaction not found."));
  if (![tx.learner_id, tx.tutor_id].includes(context.user.id)) return sendHtml(context.res, 403, errorPage("403", "You cannot complete this request."));
  const field = context.user.role === "learner" ? "learner_completed" : "tutor_completed";
  markTransactionCompletion(txId, field, isoNow());
  const refreshed = getTransactionById(txId);
  if (refreshed.learner_completed && refreshed.tutor_completed) {
    completeTransaction(txId, isoNow(), isoNow());
    checkAchievements(refreshed.learner_id);
    checkAchievements(refreshed.tutor_id);
    pushFlash(context.session.id, "success", "Transaction completed. Reviews are now unlocked.");
  } else {
    pushFlash(context.session.id, "success", "Completion marked. Waiting for the other party.");
  }
  return redirect(context.res, context.session.id, `/transactions/${txId}`);
}

export function handleReview(context, txId) {
  const tx = getTransactionById(txId);
  if (!tx || tx.status !== "Completed" || ![tx.learner_id, tx.tutor_id].includes(context.user.id)) {
    return sendHtml(context.res, 403, errorPage("403", "You cannot review this transaction."));
  }
  const revieweeId = context.user.id === tx.learner_id ? tx.tutor_id : tx.learner_id;
  saveReview({
    transaction_id: txId,
    reviewer_id: context.user.id,
    reviewee_id: revieweeId,
    rating: Number(context.body.rating || 5),
    comment: sanitize(context.body.comment),
    created_at: isoNow(),
    updated_at: isoNow()
  });
  notify(revieweeId, "Review received", `${context.user.name} left you a review.`, "success", `/profile/${revieweeId}`);
  checkAchievements(context.user.id);
  checkAchievements(revieweeId);
  pushFlash(context.session.id, "success", "Review saved.");
  return redirect(context.res, context.session.id, `/transactions/${txId}`);
}
