export function renderPager(pathname, query, page) {
  if (page.pages <= 1) return "";
  const prev = page.page > 1 ? pagerLink(pathname, query, page.page - 1, "Previous") : "";
  const next = page.page < page.pages ? pagerLink(pathname, query, page.page + 1, "Next") : "";
  return `<div class="row pager-row">${prev}<span class="soft">Page ${page.page} of ${page.pages}</span>${next}</div>`;
}

function pagerLink(pathname, query, page, label) {
  const params = new URLSearchParams(query);
  params.set("page", String(page));
  return `<a class="btn ghost sm" href="${pathname}?${params.toString()}">${label}</a>`;
}

export function csrfInput(context) {
  return `<input type="hidden" name="_csrf" value="${escapeHtml(context.csrfToken || context?.csrfToken || "")}">`;
}

export function option(value, selected) {
  return `<option value="${escapeHtml(value)}" ${String(selected || "") === String(value) ? "selected" : ""}>${escapeHtml(value)}</option>`;
}

export function emptyState(title, message) {
  return `<section class="empty-state"><h2>${escapeHtml(title)}</h2>${message ? `<p>${escapeHtml(message)}</p>` : ""}</section>`;
}

export function stars(value) {
  const rounded = Math.round(Number(value || 0));
  return Array.from({ length: 5 }, (_, index) => `<span class="${index + 1 <= rounded ? "star-on" : "star-off"}">&#9733;</span>`).join("");
}

export function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

export function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function relativeTime(value) {
  if (!value) return "just now";
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(value);
}

export function limit(text, max) {
  const string = String(text || "");
  return string.length > max ? `${string.slice(0, max - 1)}...` : string;
}

export function recent(value) {
  return value && new Date(value).getTime() > Date.now() - 86400000;
}

export function nl2br(text) {
  return String(text).replace(/\n/g, "<br>");
}

export function hasFlash(context, type) {
  return (context.flashes || []).some((flash) => flash.type === type);
}

export function capitalize(text) {
  return String(text || "").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function errorPage(title, message) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><link rel="stylesheet" href="/css/learnlink.css"></head><body><main class="page"><section class="panel"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><a class="btn ghost" href="/">Back to LearnLink</a></section></main></body></html>`;
}
