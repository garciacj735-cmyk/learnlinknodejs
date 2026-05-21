import { db, createSession } from "../../core/services.js";
import { countUnreadNotifications } from "../../repositories/notificationRepository.js";
import { capitalize, csrfInput, escapeHtml } from "./helpers.js";

function renderAdminNav(context, user, unread, session) {
  const items = [
    ["/admin/dashboard", "Overview"],
    ["/admin/notifications", "Notifications"],
    ["/admin/users", "Users"],
    ["/admin/posts", "Posts"],
    ["/admin/tutors", "Tutor Approvals"],
    ["/admin/transactions", "Transactions"],
    ["/admin/reports", "Reports"],
    ["/admin/warnings", "Warnings"],
    ["/admin/announcements", "Announcements"],
    ["/admin/analytics", "Analytics"],
    ["/admin/audit-logs", "Audit Logs"],
    ["/admin/users/create", "Admin Accounts"]
  ];
  return `<aside class="admin-sidebar"><div class="admin-brand-block"><div class="brand glow admin-brand-title">LearnLink Admin</div></div><div class="admin-profile-chip"><img src="${escapeHtml(user.avatar_url)}" alt="Admin avatar"><div><strong>${escapeHtml(user.name)}</strong><small>Administrator</small></div></div>${items.map(([href, label]) => `<a href="${href}" class="${context.url.pathname === href ? "active" : ""}">${label}${href === "/admin/notifications" && unread > 0 ? ` <span class="side-count">${unread}</span>` : ""}</a>`).join("")}<form class="admin-logout-form" method="post" action="/logout" data-confirm="Are you sure you want to log out?">${csrfInput({ csrfToken: session.csrf_token })}<button class="link-button">Logout</button></form></aside>`;
}

function renderMemberNav(user, unread, session) {
  return `<nav class="navbar"><a class="brand glow" href="/dashboard">LearnLink</a><div class="nav-links"><a href="/dashboard">Home</a><a href="/posts">Posts</a></div><div class="nav-user"><a class="bell" href="/notifications" title="Notifications" aria-label="Notifications"><span class="bell-icon">Bell</span>${unread > 0 ? `<span class="bell-count">${unread}</span>` : ""}</a><a class="avatar-mini" href="/profile/${user.id}"><img src="${escapeHtml(user.avatar_url)}"><b>${escapeHtml(user.name)}</b><small>${capitalize(user.role)}</small></a><form method="post" action="/logout" data-confirm="Are you sure you want to log out?">${csrfInput({ csrfToken: session.csrf_token })}<button class="icon-btn">Logout</button></form></div></nav>`;
}

function renderGuestNav(context) {
  return `<nav class="navbar public"><a class="brand glow" href="/">LearnLink</a><div class="nav-links public-center"><a href="/">Home</a><a href="/about">About</a><a href="/faq">FAQ</a><a href="/contact">Contact</a></div>${context.url.pathname === "/" ? '<button class="btn nav-login" data-open-login>Log In</button>' : '<a class="btn nav-login" href="/?login=1">Log In</a>'}</nav>`;
}

export function wrapPage(context, title, body) {
  const session = context.session || createSession();
  const sessionId = session.id;
  const user = context.user;
  const flashes = context.flashes || [];
  const unread = user ? countUnreadNotifications(user.id) : 0;
  const mainClass = user ? (user.role === "admin" ? "admin-main" : "page") : "page";
  const bodyClass = user ? (user.role === "admin" ? "admin-body" : "member-body") : "";
  const nav = user ? (user.role === "admin" ? renderAdminNav(context, user, unread, session) : renderMemberNav(user, unread, session)) : renderGuestNav(context);
  const flashesHtml = flashes.map((flash) => `<div class="toast ${escapeHtml(flash.type)}">${escapeHtml(flash.message)}</div>`).join("");
  const chat = user && user.role !== "admin" ? `<button class="chat-button" id="chatOpen">AI</button><section class="chat-window" id="chatWindow"><header><b>LearnLink Assistant</b><span>Online</span><button id="chatClose">x</button></header><div class="chat-messages" id="chatMessages"><p class="bot">Hi ${escapeHtml(user.name)}. How can I help your ${escapeHtml(user.role)} account today?</p></div><div class="quick-chat"><button>How do I send a request?</button><button>When can I see contact details?</button><button>How do reviews work?</button></div><form id="chatForm"><input id="chatInput" placeholder="Ask LearnLink Assistant..."><button>Send</button></form></section>` : "";
  return {
    sessionId,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="csrf-token" content="${escapeHtml(session.csrf_token)}"><title>${escapeHtml(title)}</title><link rel="stylesheet" href="/css/learnlink.css"><script src="https://cdn.jsdelivr.net/npm/chart.js"></script><script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script></head><body class="${bodyClass}"><div class="cursor-glow"></div><div class="progress-bar"></div>${nav}<main class="${mainClass}">${flashesHtml}${body}</main><section class="confirm-modal" id="confirmModal" aria-hidden="true"><div class="confirm-modal-backdrop" data-close-confirm-modal></div><div class="confirm-modal-panel"><div class="confirm-modal-copy"><h2>Confirm Action</h2><p id="confirmModalMessage">Are you sure?</p></div><div class="confirm-modal-actions"><button class="btn ghost sm" type="button" data-close-confirm-modal>Cancel</button><button class="btn danger sm" type="button" id="confirmModalApprove">Confirm</button></div></div></section>${chat}<button class="scroll-top" id="scrollTop">&#8593;</button><script type="module" src="/js/app.js"></script></body></html>`
  };
}
