import { db } from "../database/db.js";
import { isoNow } from "../utils/common.js";
import { randomToken } from "../utils/security.js";

export function parseCookies(header) {
  return Object.fromEntries(
    header.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
      const idx = part.indexOf("=");
      return [decodeURIComponent(part.slice(0, idx)), decodeURIComponent(part.slice(idx + 1))];
    })
  );
}

export async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  if ((req.headers["content-type"] || "").includes("application/json")) {
    return JSON.parse(raw);
  }
  const params = new URLSearchParams(raw);
  const body = {};
  for (const [key, value] of params.entries()) {
    if (key.endsWith("[]")) {
      const finalKey = key.slice(0, -2);
      body[finalKey] ||= [];
      body[finalKey].push(value);
    } else if (body[key] !== undefined) {
      body[key] = Array.isArray(body[key]) ? [...body[key], value] : [body[key], value];
    } else {
      body[key] = value;
    }
  }
  return body;
}

export function getSession(id) {
  if (!id) return createSession();
  const session = db.prepare("SELECT * FROM node_sessions WHERE id = ?").get(id);
  if (!session) return createSession();
  return session;
}

export function createSession(userId = null) {
  const id = randomToken(24);
  const csrf = randomToken(24);
  const now = isoNow();
  db.prepare("INSERT INTO node_sessions (id, user_id, csrf_token, flashes, created_at, updated_at) VALUES (?, ?, ?, '[]', ?, ?)").run(id, userId, csrf, now, now);
  return {
    id,
    user_id: userId,
    csrf_token: csrf,
    flashes: "[]",
    created_at: now,
    updated_at: now
  };
}

export function setSessionUser(sessionId, userId) {
  db.prepare("UPDATE node_sessions SET user_id = ?, updated_at = ? WHERE id = ?").run(userId, isoNow(), sessionId);
}

export function destroySession(sessionId) {
  db.prepare("DELETE FROM node_sessions WHERE id = ?").run(sessionId);
}

export function setFlashes(sessionId, flashes) {
  db.prepare("UPDATE node_sessions SET flashes = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(flashes), isoNow(), sessionId);
}

export function pushFlash(sessionId, type, message) {
  const session = db.prepare("SELECT * FROM node_sessions WHERE id = ?").get(sessionId);
  const flashes = session ? JSON.parse(session.flashes || "[]") : [];
  flashes.push({ type, message });
  setFlashes(sessionId, flashes);
}

export function consumeFlashes(sessionId) {
  if (!sessionId) return [];
  const session = db.prepare("SELECT * FROM node_sessions WHERE id = ?").get(sessionId);
  if (!session) return [];
  const flashes = JSON.parse(session.flashes || "[]");
  setFlashes(sessionId, []);
  return flashes;
}

export function verifyCsrf(context) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(context.req.method)) return true;
  const token = context.body._csrf || context.req.headers["x-csrf-token"];
  return Boolean(context.session && token && token === context.session.csrf_token);
}

export function sessionCookie(sessionId) {
  return `ll_session=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax`;
}
