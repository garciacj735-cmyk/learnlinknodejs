import {
  db,
  redirect,
  setSessionUser,
  destroySession,
  hashPassword,
  randomToken,
  verifyPassword,
  isoNow,
  findUserByEmail,
  sanitize,
  maybe,
  notify,
  pushFlash
} from '../core/services.js';
import { BOY_AVATAR, GIRL_AVATAR } from '../config/constants.js';

function validatePassword(sessionId, password, confirmation, failureRedirect, res) {
  if (!password || password.length < 8) {
    pushFlash(sessionId, 'error', 'Password must be at least 8 characters.');
    redirect(res, sessionId, failureRedirect);
    return false;
  }

  if (password !== confirmation) {
    pushFlash(sessionId, 'error', 'Password confirmation does not match.');
    redirect(res, sessionId, failureRedirect);
    return false;
  }

  return true;
}

function handleLogin(context) {
  const { body, session, res } = context;
  const user = findUserByEmail(body.email);

  if (!user || !verifyPassword(body.password || '', user.password)) {
    pushFlash(session.id, 'error', 'Invalid email or password.');
    return redirect(res, session.id, '/?login=1');
  }

  if (user.role === 'admin') {
    pushFlash(session.id, 'error', 'Admins must use the admin login page.');
    return redirect(res, session.id, '/');
  }

  if (user.status === 'deactivated') {
    pushFlash(session.id, 'error', 'Your account is deactivated. Please contact admin.');
    return redirect(res, session.id, '/');
  }

  if (user.role === 'tutor' && user.status === 'pending') {
    pushFlash(session.id, 'info', 'Your tutor account is pending admin review.');
    return redirect(res, session.id, '/tutor-pending');
  }

  setSessionUser(session.id, user.id);
  pushFlash(session.id, 'success', `Welcome back, ${user.name}!`);
  return redirect(res, session.id, '/dashboard');
}

function handleAdminLogin(context) {
  const { body, session, res } = context;
  const user = findUserByEmail(body.email);

  if (!user || !verifyPassword(body.password || '', user.password) || user.role !== 'admin') {
    pushFlash(session.id, 'error', 'Invalid admin credentials.');
    return redirect(res, session.id, '/admin/login');
  }

  setSessionUser(session.id, user.id);
  return redirect(res, session.id, '/admin/dashboard');
}

function handleRegister(context) {
  const { body, session, res } = context;
  const now = isoNow();
  const role = body.role === 'tutor' ? 'tutor' : 'learner';
  const email = sanitize(body.email).toLowerCase();
  const password = body.password || '';
  const confirmation = body.password_confirmation || '';
  const failureRedirect = `/register?role=${role}`;

  if (!sanitize(body.name) || !email) {
    pushFlash(session.id, 'error', 'Name and email are required.');
    return redirect(res, session.id, failureRedirect);
  }

  if (!validatePassword(session.id, password, confirmation, failureRedirect, res)) {
    return;
  }

  if (findUserByEmail(email)) {
    pushFlash(session.id, 'error', 'Email already exists.');
    return redirect(res, session.id, failureRedirect);
  }

  const userResult = db.prepare(`INSERT INTO users
    (name, email, email_verified_at, password, role, gender, avatar_url, phone, messenger_link, telegram, instagram, discord, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      sanitize(body.name),
      email,
      now,
      hashPassword(password),
      role,
      body.gender === 'girl' ? 'girl' : 'boy',
      body.gender === 'girl' ? GIRL_AVATAR : BOY_AVATAR,
      maybe(body.phone),
      maybe(body.messenger_link),
      maybe(body.telegram),
      maybe(body.instagram),
      maybe(body.discord),
      role === 'tutor' ? 'pending' : 'active',
      now,
      now
    );

  const userId = Number(userResult.lastInsertRowid);
  setSessionUser(session.id, userId);

  if (role === 'learner') {
    db.prepare('INSERT INTO learner (user_id, created_at, updated_at) VALUES (?, ?, ?)').run(userId, now, now);
    notify(userId, 'Welcome to LearnLink', 'Your learner account is ready to use.', 'success', '/dashboard');
    pushFlash(session.id, 'success', 'Account created. You are now logged in.');
    return redirect(res, session.id, '/dashboard');
  }

  db.prepare('INSERT INTO tutors (user_id, created_at, updated_at) VALUES (?, ?, ?)').run(userId, now, now);
  notify(userId, 'Tutor account created', 'Your tutor account is pending admin approval.', 'info', '/tutor-pending');
  for (const admin of db.prepare("SELECT id FROM users WHERE role = 'admin'").all()) {
    notify(admin.id, 'Tutor approval needed', `${sanitize(body.name)} is waiting for tutor approval.`, 'warning', '/admin/tutors');
  }
  pushFlash(session.id, 'info', 'Tutor account created. You are now logged in and waiting for admin approval.');
  return redirect(res, session.id, '/tutor-pending');
}

function handleVerify(context, token) {
  const { session, res } = context;
  pushFlash(session.id, 'info', 'Email verification is no longer required.');
  return redirect(res, session.id, '/');
}

function handleForgot(context) {
  const { body, session, res } = context;
  const email = sanitize(body.email).toLowerCase();
  const token = randomToken(32);
  const resetPath = `/reset-password/${token}?email=${encodeURIComponent(email)}`;
  const resetUrl = `http://127.0.0.1:${process.env.PORT || 3002}${resetPath}`;

  db.prepare('INSERT INTO password_reset_tokens (email, token, created_at) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET token = excluded.token, created_at = excluded.created_at')
    .run(email, hashPassword(token), isoNow());

  const user = findUserByEmail(email);
  if (user) {
    notify(user.id, 'Password reset requested', `Use this reset link: ${resetUrl}`, 'info', resetPath);
    pushFlash(session.id, 'success', `Reset link generated: ${resetUrl}`);
  } else {
    pushFlash(session.id, 'success', 'If the email exists, a reset link has been sent.');
  }

  return redirect(res, session.id, '/forgot-password');
}

function handleReset(context, token) {
  const { body, session, res } = context;
  const email = sanitize(body.email).toLowerCase();
  const password = body.password || '';
  const confirmation = body.password_confirmation || '';
  const failureRedirect = `/reset-password/${token}?email=${encodeURIComponent(email)}`;

  const row = db.prepare('SELECT * FROM password_reset_tokens WHERE email = ?').get(email);
  if (!row || !verifyPassword(token, row.token)) {
    pushFlash(session.id, 'error', 'Reset link is invalid or expired.');
    return redirect(res, session.id, failureRedirect);
  }

  if (!validatePassword(session.id, password, confirmation, failureRedirect, res)) {
    return;
  }

  db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE lower(email) = lower(?)').run(hashPassword(password), isoNow(), email);
  db.prepare('DELETE FROM password_reset_tokens WHERE email = ?').run(email);
  pushFlash(session.id, 'success', 'Password reset. You may now log in.');
  return redirect(res, session.id, '/');
}

function handleLogout(context) {
  destroySession(context.session.id);
  return redirect(context.res, null, '/');
}

export {
  handleLogin,
  handleAdminLogin,
  handleRegister,
  handleVerify,
  handleForgot,
  handleReset,
  handleLogout
};
