import { pushFlash, redirect } from "../../core/services.js";
import { deleteNotificationById, deleteNotificationsByIds, markNotificationRead, markNotificationsRead } from "../../repositories/notificationRepository.js";

export function handleReadNotifications(context) {
  markNotificationsRead(context.user.id);
  pushFlash(context.session.id, "success", "Notifications marked as read.");
  return redirect(context.res, context.session.id, context.req.headers.referer || "/notifications");
}

export function handleReadNotification(context, id) {
  markNotificationRead(context.user.id, id);
  if (context.req.headers["x-requested-with"] === "XMLHttpRequest") {
    context.res.statusCode = 204;
    context.res.end();
    return;
  }
  return redirect(context.res, context.session.id, context.req.headers.referer || "/notifications");
}

export function handleDeleteNotifications(context) {
  const ids = Array.isArray(context.body.notifications) ? context.body.notifications.map(Number) : [Number(context.body.notifications)].filter(Boolean);
  deleteNotificationsByIds(context.user.id, ids);
  pushFlash(context.session.id, "success", "Selected notifications deleted.");
  return redirect(context.res, context.session.id, "/notifications");
}

export function handleDeleteNotification(context, id) {
  deleteNotificationById(context.user.id, id);
  pushFlash(context.session.id, "success", "Notification deleted.");
  return redirect(context.res, context.session.id, "/notifications");
}
