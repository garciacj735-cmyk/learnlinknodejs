import {
  parseCookies,
  parseBody,
  getSession,
  consumeFlashes,
  verifyCsrf,
  serveStatic,
  sendHtml,
  findUserById,
  touchUser,
  expireStalePendingTransactions,
  reactivateExpiredUsers
} from "./core/services.js";
import { errorPage } from "./views/renderers.js";
import { dispatchRequest } from "./routes/dispatch.js";

let lastPendingExpirySweepAt = 0;
const PENDING_EXPIRY_SWEEP_INTERVAL_MS = 5 * 60 * 1000;

export function createApp() {
  return async function app(req, res) {
    const url = new URL(req.url, "http://127.0.0.1");
    if (serveStatic(url.pathname, res)) return;

    const cookies = parseCookies(req.headers.cookie || "");
    const session = getSession(cookies.ll_session);
    const requestUser = session?.user_id ? findUserById(session.user_id) : null;
    if (requestUser) touchUser(requestUser.id);

    const context = {
      req,
      res,
      url,
      query: Object.fromEntries(url.searchParams.entries()),
      cookies,
      session,
      user: requestUser,
      flashes: session ? consumeFlashes(session.id) : [],
      csrfToken: session?.csrf_token || null,
      body: {}
    };

    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      context.body = await parseBody(req);
      if (req.method === "POST" && context.body._method) {
        req.method = String(context.body._method).toUpperCase();
      }
      if (!verifyCsrf(context)) {
        return sendHtml(res, 419, errorPage("Page Expired", "CSRF token mismatch."));
      }
    }

    const now = Date.now();
    if (now - lastPendingExpirySweepAt >= PENDING_EXPIRY_SWEEP_INTERVAL_MS) {
      lastPendingExpirySweepAt = now;
      expireStalePendingTransactions();
      reactivateExpiredUsers();
    }
    return dispatchRequest(context);
  };
}
