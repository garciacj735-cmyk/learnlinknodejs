export function isoNow() {
  return new Date().toISOString();
}

export function sanitize(text) {
  return String(text || "").replace(/<[^>]*>/g, "").trim();
}

export function maybe(text) {
  const value = sanitize(text);
  return value === "" ? null : value;
}

export function numberValue(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function boolValue(value) {
  return value === "1" || value === "true" || value === true || value === "on";
}

export function paginate(items, page = 1, perPage = 10) {
  const current = Math.max(1, Number(page || 1));
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const start = (current - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    page: current,
    pages,
    total
  };
}

export function csvEscape(value) {
  const string = String(value ?? "");
  return /[",\n]/.test(string) ? `"${string.replace(/"/g, '""')}"` : string;
}
