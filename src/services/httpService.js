import { createReadStream, existsSync } from "node:fs";
import { extname, join } from "node:path";
import { MIME_TYPES } from "../config/constants.js";
import { rootDir } from "../database/db.js";
import { sessionCookie } from "./sessionService.js";

const publicDir = join(rootDir, "public");

export function serveStatic(pathname, res) {
  if (!pathname.startsWith("/css/") && !pathname.startsWith("/js/") && pathname !== "/favicon.ico" && pathname !== "/robots.txt") return false;
  const filePath = join(publicDir, pathname.replace(/^\/+/, ""));
  if (!existsSync(filePath)) {
    res.statusCode = 404;
    res.end("Not found");
    return true;
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", MIME_TYPES[extname(filePath)] || "application/octet-stream");
  createReadStream(filePath).pipe(res);
  return true;
}

export function sendHtml(res, status, html, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  res.end(html);
}

export function sendJson(res, status, data, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(data));
}

export function sendPage(res, page, extraHeaders = {}) {
  return sendHtml(res, 200, page.html, { "Set-Cookie": sessionCookie(page.sessionId), ...extraHeaders });
}

export function redirect(res, sessionId, location) {
  res.statusCode = 302;
  res.setHeader("Location", location);
  if (sessionId) {
    res.setHeader("Set-Cookie", sessionCookie(sessionId));
  } else {
    res.setHeader("Set-Cookie", "ll_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax");
  }
  res.end();
}

export function match(pathname, regex) {
  return pathname.match(regex);
}
