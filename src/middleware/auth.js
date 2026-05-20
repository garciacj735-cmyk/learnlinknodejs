import { pushFlash, destroySession, sendHtml, redirect } from '../core/services.js';
import { errorPage } from '../views/renderers.js';

function withAuth(context, roles, action) {
  const { user, res, session } = context;
  if (!user) {
    pushFlash(session.id, "error", "Please log in first.");
    return redirect(res, session.id, "/?login=1");
  }
  if (!roles.includes(user.role)) {
    return sendHtml(res, 403, errorPage("403", "You do not have access to this page."));
  }
  if (user.status === "deactivated") {
    const untilText = user.deactivated_until ? ` Your account will be reactivated after ${user.deactivated_until}.` : "";
    pushFlash(session.id, "error", `Your account has been deactivated.${untilText}`);
    destroySession(session.id);
    return redirect(res, null, "/");
  }
  if (user.role === "tutor" && user.status === "pending" && roles.includes("tutor")) {
    pushFlash(session.id, "info", "Your tutor account is pending admin review.");
    destroySession(session.id);
    return redirect(res, null, "/tutor-pending");
  }
  return action();
}

export { withAuth };
