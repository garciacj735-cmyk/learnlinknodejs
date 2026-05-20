import {
  db,
  sendHtml,
  sendPage,
  redirect,
  hashPassword,
  randomPassword,
  isoNow,
  findUserById,
  findUserByEmail,
  sanitize,
  notify,
  audit,
  sendMail,
  isMailConfigured,
  getTutorProfile,
  getLearnerProfile,
  loadTransaction,
  pushFlash
} from '../../core/services.js';
import { wrapPage, errorPage, escapeHtml, csrfInput, formatDateTime } from '../../views/renderers.js';

function handleStoreAdmin(context) {
  const { body, session, res, user } = context;
  const name = sanitize(body.name);
  const email = sanitize(body.email).toLowerCase();
  const password = body.password || '';
  const confirmation = body.password_confirmation || '';

  if (!name || !email || !password) {
    pushFlash(session.id, 'error', 'Name, email, and password are required.');
    return redirect(res, session.id, '/admin/users/create');
  }

  if (password.length < 8) {
    pushFlash(session.id, 'error', 'Password must be at least 8 characters.');
    return redirect(res, session.id, '/admin/users/create');
  }

  if (password !== confirmation) {
    pushFlash(session.id, 'error', 'Password confirmation does not match.');
    return redirect(res, session.id, '/admin/users/create');
  }

  if (findUserByEmail(email)) {
    pushFlash(session.id, 'error', 'That email is already in use.');
    return redirect(res, session.id, '/admin/users/create');
  }

  const now = isoNow();
  db.prepare(
    'INSERT INTO users (name, email, email_verified_at, password, role, gender, avatar_url, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    name,
    email,
    now,
    hashPassword(password),
    'admin',
    'boy',
    `https://ui-avatars.com/api/?background=111126&color=ffffff&name=${encodeURIComponent(name)}`,
    'active',
    now,
    now
  );

  const created = findUserByEmail(email);
  audit(user.id, 'Created admin account', 'User', created?.id || null, email);
  pushFlash(session.id, 'success', 'Admin account created.');
  return redirect(res, session.id, '/admin/users/create');
}

function handleDeactivateUser(context, userId) {
  if (userId === context.user.id) {
    return sendHtml(context.res, 403, errorPage('403', 'You cannot deactivate your own account.'));
  }

  db.prepare("UPDATE users SET status = 'deactivated', updated_at = ? WHERE id = ?").run(isoNow(), userId);
  notify(userId, 'Account deactivated', 'Please contact admin for assistance.', 'error', '/');
  audit(context.user.id, 'Deactivated user', 'User', userId, findUserById(userId)?.email || null);
  pushFlash(context.session.id, 'success', 'User deactivated.');
  return redirect(context.res, context.session.id, context.req.headers.referer || '/admin/users');
}

function handleReactivateUser(context, userId) {
  db.prepare("UPDATE users SET status = 'active', updated_at = ? WHERE id = ?").run(isoNow(), userId);
  notify(userId, 'Account reactivated', 'Welcome back to LearnLink.', 'success', '/dashboard');
  audit(context.user.id, 'Reactivated user', 'User', userId, findUserById(userId)?.email || null);
  pushFlash(context.session.id, 'success', 'User reactivated.');
  return redirect(context.res, context.session.id, context.req.headers.referer || '/admin/users');
}

async function handleAdminResetPassword(context, userId) {
  const tempPassword = randomPassword(12);
  db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run(hashPassword(tempPassword), isoNow(), userId);
  const targetUser = findUserById(userId);
  notify(
    userId,
    'Password reset',
    `Your LearnLink password has been reset by an administrator. Temporary password: ${tempPassword}. Please log in and change it from Edit Profile as soon as possible.`,
    'info',
    '/profile/edit'
  );
  let mailSent = false;
  let mailError = null;
  if (targetUser?.email && isMailConfigured()) {
    try {
      mailSent = await sendMail({
        to: String(targetUser.email).trim().toLowerCase(),
        subject: 'LearnLink password reset',
        text: `Your LearnLink password has been reset by an administrator.\n\nTemporary password: ${tempPassword}\n\nPlease log in and change it from Edit Profile as soon as possible.`,
        html: `<p>Your LearnLink password has been reset by an administrator.</p><p><strong>Temporary password:</strong> ${tempPassword}</p><p>Please log in and change it from Edit Profile as soon as possible.</p>`
      });
    } catch (error) {
      mailSent = false;
      mailError = error?.code || error?.message || 'Unknown mail error';
    }
  }
  const auditNote = mailSent
    ? `Temporary password sent to in-app notification and email (${String(targetUser?.email || '').trim().toLowerCase()}).`
    : mailError
      ? `Temporary password sent to in-app notification. Email failed for ${String(targetUser?.email || '').trim().toLowerCase()}: ${mailError}`
      : `Temporary password sent to in-app notification. Email not attempted for ${String(targetUser?.email || '').trim().toLowerCase()}.`;
  audit(context.user.id, 'Reset password', 'User', userId, auditNote);
  if (mailSent) {
    pushFlash(context.session.id, 'success', 'Password reset completed. The temporary password was sent to the user notification and email.');
  } else if (mailError) {
    pushFlash(context.session.id, 'error', `Password reset completed, but email failed: ${mailError}`);
  } else {
    pushFlash(context.session.id, 'success', 'Password reset completed. The temporary password was sent to the user notification.');
  }
  return redirect(context.res, context.session.id, context.req.headers.referer || '/admin/users');
}

function handleDeleteUser(context, userId) {
  if (userId === context.user.id) {
    return sendHtml(context.res, 403, errorPage('403', 'You cannot delete your own account.'));
  }

  audit(context.user.id, 'Deleted user', 'User', userId, findUserById(userId)?.email || null);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  pushFlash(context.session.id, 'success', 'User deleted.');
  return redirect(context.res, context.session.id, '/admin/users');
}

function handleAdminUser(context, userId) {
  const profile = findUserById(userId);
  if (!profile) {
    return sendHtml(context.res, 404, errorPage('404', 'User not found.'));
  }

  profile.learnerProfile = getLearnerProfile(userId);
  profile.tutorProfile = getTutorProfile(userId);
  profile.warnings = db.prepare('SELECT * FROM warnings WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  const posts = db.prepare('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  const transactions = db
    .prepare('SELECT * FROM transactions WHERE learner_id = ? OR tutor_id = ? ORDER BY created_at DESC')
    .all(userId, userId)
    .map(loadTransaction);

  return sendPage(
    context.res,
    wrapPage(
      context,
      'User Detail',
      `<div class="page-tools page-tools-inline"><a class="back-link" href="/admin/users"><span class="back-link-icon" aria-hidden="true"></span><span>Back</span></a></div><section class="profile-cover ${escapeHtml(profile.role)}"><img class="avatar huge ring" src="${escapeHtml(profile.avatar_url)}" alt=""><h1>${escapeHtml(profile.name)}</h1><div class="badge-row profile-badges"><span class="badge ${profile.role === "tutor" ? "purple" : "blue"}">${escapeHtml(profile.role)}</span><span class="badge">${escapeHtml(profile.status)}</span>${profile.tutorProfile?.is_verified ? '<span class="badge mint shimmer">Verified</span>' : ""}</div><div class="profile-actions"><form method="get" action="/admin/warnings"><input type="hidden" name="user_id" value="${profile.id}"><button class="btn danger">Issue Warning</button></form></div></section><section class="stats"><article><span>${posts.length}</span><p>Total Posts</p></article><article><span>${transactions.length}</span><p>Transactions</p></article><article><span>${profile.warnings.length}</span><p>Warnings</p></article><article><span>${profile.strike_count || 0}</span><p>Overall Strikes</p></article></section><section class="profile-grid"><article class="panel profile-panel"><h2>Account Details</h2><div class="profile-info-grid"><span>Email</span><b>${escapeHtml(profile.email)}</b><span>Role</span><b>${escapeHtml(profile.role)}</b><span>Status</span><b>${escapeHtml(profile.status)}</b><span>Nationality</span><b>${escapeHtml(profile.nationality || "Not provided")}</b><span>Address</span><b>${escapeHtml(profile.address || "Not provided")}</b><span>Location</span><b>${escapeHtml(profile.location || "Not provided")}</b><span>Education</span><b>${escapeHtml(profile.education || "Not provided")}</b><span>Languages</span><b>${escapeHtml(profile.languages || "Not provided")}</b></div></article><article class="panel profile-panel"><h2>${profile.role === 'tutor' ? 'Tutor Details' : 'Learner Details'}</h2><div class="profile-info-grid">${profile.role === 'tutor' ? `<span>Subjects</span><b>${escapeHtml(profile.tutorProfile?.subjects_offered || "No subjects listed.")}</b><span>Rate</span><b>${escapeHtml(String(profile.tutorProfile?.hourly_rate || "Not set"))}</b><span>Availability</span><b>${escapeHtml(profile.tutorProfile?.availability || "Not set")}</b>` : `<span>Subjects</span><b>${escapeHtml(profile.learnerProfile?.subjects_needed || "No subjects listed.")}</b><span>Budget Min</span><b>${escapeHtml(String(profile.learnerProfile?.budget_min || "Not set"))}</b><span>Budget Max</span><b>${escapeHtml(String(profile.learnerProfile?.budget_max || "Not set"))}</b>`}</div></article></section><section class="panel profile-panel"><h2>Posts</h2>${posts.length ? posts.map((post) => `<div class="transaction-summary-card transaction-summary-compact"><div><strong>${escapeHtml(post.subject)}</strong><p class="transaction-summary-meta">${escapeHtml(post.approval_status)} | ${escapeHtml(post.post_type)}</p></div><div class="table-actions"><a class="btn ghost sm" href="/posts/${post.id}?from=admin-posts">View</a></div></div>`).join('') : '<p>No posts.</p>'}</section><section class="panel profile-panel"><h2>Transactions</h2>${transactions.length ? transactions.map((tx) => `<div class="transaction-summary-card transaction-summary-compact"><div><strong>${escapeHtml(tx.post.subject)}</strong><p class="transaction-summary-meta">${escapeHtml(tx.status)} | ${escapeHtml(formatDateTime(tx.created_at))}</p></div><div class="table-actions"><a class="btn ghost sm" href="/transactions/${tx.id}">View</a></div></div>`).join('') : '<p>No transactions.</p>'}</section><section class="panel profile-panel"><h2>Warnings</h2>${profile.warnings.length ? profile.warnings.map((warning) => `<div class="transaction-summary-card"><div class="transaction-summary-top"><div><h3>${warning.action_type === 'deactivated' ? 'Deactivated' : `Strike ${warning.strike_number}`}</h3><p class="transaction-summary-meta">${escapeHtml(formatDateTime(warning.created_at))}</p></div></div><div class="transaction-summary-grid"><article><span>Reason</span><b>${escapeHtml(warning.reason)}</b></article><article><span>Action</span><b>${escapeHtml(warning.action_type)}</b></article></div></div>`).join('') : '<p>No warnings.</p>'}</section>`
    )
  );
}

export {
  handleStoreAdmin,
  handleDeactivateUser,
  handleReactivateUser,
  handleAdminResetPassword,
  handleDeleteUser,
  handleAdminUser
};
