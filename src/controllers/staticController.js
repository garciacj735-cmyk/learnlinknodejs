import { db, notify, pushFlash, redirect, sanitize } from '../core/services.js';

function handleContact(context) {
  const { body, session, res } = context;
  const sender = `From: ${sanitize(body.name)} <${sanitize(body.email)}>\n\n${sanitize(body.message)}`;

  for (const admin of db.prepare("SELECT id FROM users WHERE role = 'admin'").all()) {
    notify(admin.id, `Contact message: ${sanitize(body.subject)}`, sender, 'info', '/admin/notifications');
  }

  pushFlash(session.id, 'success', 'Message sent to admin.');
  return redirect(res, session.id, '/contact');
}

export { handleContact };
