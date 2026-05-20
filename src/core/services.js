import { STANDARD_SUBJECTS } from "../config/constants.js";
import { db } from "../database/db.js";
import { initDb, ensureColumn } from "../database/migrations/schema.js";
import { ensureBootstrapAdmin } from "../database/seeders/bootstrapAdmin.js";

initDb();
ensureBootstrapAdmin();

export { db };
export { initDb, ensureColumn } from "../database/migrations/schema.js";
export { ensureBootstrapAdmin } from "../database/seeders/bootstrapAdmin.js";
export { parseCookies, parseBody, getSession, createSession, setSessionUser, destroySession, setFlashes, pushFlash, consumeFlashes, verifyCsrf, sessionCookie } from "../services/sessionService.js";
export { serveStatic, sendHtml, sendJson, sendPage, redirect, match } from "../services/httpService.js";
export { sendMail, isMailConfigured } from "../services/mailService.js";
export { findUserById, findUserByEmail, decorateUser, touchUser } from "../services/userService.js";
export { notify, audit, award, averageRating, completedSessions, canSeeContact, expireStalePendingTransactions, reactivateExpiredUsers, checkAchievements } from "../services/platformService.js";
export { validatePostInput, queryPostsForList, loadPost, getTutorProfile, getLearnerProfile, getTransactionsForPost, getVisibleTransactions, loadTransaction } from "../services/postService.js";
export { hashPassword, verifyPassword, randomToken, randomPassword } from "../utils/security.js";
export { isoNow, sanitize, maybe, numberValue, boolValue, paginate, csvEscape } from "../utils/common.js";
export { STANDARD_SUBJECTS };
