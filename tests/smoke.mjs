import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { DatabaseSync } from 'node:sqlite';

const PORT = Number(process.env.SMOKE_PORT || 3010);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DB_PATH = new URL('../data/learnlink.sqlite', import.meta.url);
const db = new DatabaseSync(DB_PATH);

function assert(condition, message, details = null) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

function createJar() {
  let cookie = '';
  return {
    get cookie() {
      return cookie;
    },
    update(response) {
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0];
    }
  };
}

function csrfFrom(html) {
  const match = html.match(/name=["']_csrf["'] value=["']([^"']+)["']/);
  assert(match, 'CSRF token not found in page HTML.');
  return match[1];
}

async function fetchPage(url, jar, options = {}) {
  const response = await fetch(url, {
    redirect: 'manual',
    headers: {
      ...(jar.cookie ? { cookie: jar.cookie } : {}),
      ...(options.headers || {})
    },
    ...options
  });
  jar.update(response);
  const text = await response.text();
  return { response, text };
}

async function postForm(url, jar, form) {
  return fetchPage(url, jar, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      ...(jar.cookie ? { cookie: jar.cookie } : {})
    },
    body: new URLSearchParams(form).toString()
  });
}

async function waitForServer() {
  for (let index = 0; index < 30; index += 1) {
    try {
      const response = await fetch(`${BASE_URL}/`, { redirect: 'manual' });
      if (response.status < 500) return;
    } catch {
      // wait and retry
    }
    await delay(250);
  }
  throw new Error(`Server did not become ready on ${BASE_URL}`);
}

function uniqueEmail(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function registerUser({ role, name, gender = 'boy' }) {
  const jar = createJar();
  const email = uniqueEmail(role);
  const registerPage = await fetchPage(`${BASE_URL}/register${role === 'tutor' ? '?role=tutor' : ''}`, jar);
  assert(registerPage.response.status === 200, `${role} register page did not load.`, registerPage.response.status);

  const registerResult = await postForm(`${BASE_URL}/register`, jar, {
    _csrf: csrfFrom(registerPage.text),
    role,
    name,
    email,
    password: 'Password123',
    password_confirmation: 'Password123',
    gender
  });

  assert(registerResult.response.status === 302, `${role} registration did not redirect.`, registerResult.response.status);

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  assert(user, `${role} user row was not created.`);
  return { jar, email, userId: user.id };
}

async function login(email, jar, path = '/') {
  const homePage = await fetchPage(`${BASE_URL}${path}`, jar);
  assert(homePage.response.status === 200, `Login page ${path} did not load.`, homePage.response.status);
  const loginResponse = await postForm(`${BASE_URL}${path === '/admin/login' ? '/admin/login' : '/login'}`, jar, {
    _csrf: csrfFrom(homePage.text),
    email,
    password: 'Admin12345!'
  });
  return loginResponse;
}

async function run() {
  const useExternalServer = process.env.SMOKE_EXTERNAL === '1';
  let server = null;
  let output = '';

  if (!useExternalServer) {
    server = spawn('node', ['server.js'], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    server.stdout.on('data', (chunk) => { output += chunk.toString(); });
    server.stderr.on('data', (chunk) => { output += chunk.toString(); });
  }

  try {
    await waitForServer();

    const adminJar = createJar();
    const adminLoginPage = await fetchPage(`${BASE_URL}/admin/login`, adminJar);
    const adminLogin = await postForm(`${BASE_URL}/admin/login`, adminJar, {
      _csrf: csrfFrom(adminLoginPage.text),
      email: 'admin@learnlink.local',
      password: 'Admin12345!'
    });
    assert(adminLogin.response.status === 302, 'Admin login failed.', adminLogin.response.status);

    const learner = await registerUser({ role: 'learner', name: 'Smoke Learner', gender: 'boy' });
    const learnerDashboard = await fetchPage(`${BASE_URL}/dashboard`, learner.jar);
    assert(learnerDashboard.response.status === 200, 'Learner was not automatically logged in after registration.', learnerDashboard.response.status);

    const createPage = await fetchPage(`${BASE_URL}/posts/create`, learner.jar);
    const subject = `Smoke Subject ${Date.now()}`;
    const createPost = await postForm(`${BASE_URL}/posts`, learner.jar, {
      _csrf: csrfFrom(createPage.text),
      subject: 'Other',
      custom_subject: subject,
      category: 'Other',
      hourly_rate: '400',
      duration_hours: '1.5',
      expiry_days: '14',
      availability: 'Weeknights',
      description: 'Smoke post description',
      is_urgent: '1'
    });
    assert(createPost.response.status === 302, 'Learner post creation failed.', createPost.response.status);

    const post = db.prepare('SELECT * FROM posts WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(learner.userId);
    assert(post, 'Learner post was not stored.');

    const adminPostsPage = await fetchPage(`${BASE_URL}/admin/posts`, adminJar);
    const approvePost = await postForm(`${BASE_URL}/admin/posts/${post.id}/approve`, adminJar, {
      _csrf: csrfFrom(adminPostsPage.text)
    });
    assert(approvePost.response.status === 302, 'Admin post approval failed.', approvePost.response.status);
    const approvedPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(post.id);
    assert(approvedPost.approval_status === 'approved', 'Post did not become approved.', approvedPost.approval_status);

    const tutor = await registerUser({ role: 'tutor', name: 'Smoke Tutor', gender: 'girl' });
    const adminTutorsPage = await fetchPage(`${BASE_URL}/admin/tutors`, adminJar);
    const approveTutor = await postForm(`${BASE_URL}/admin/tutors/${tutor.userId}/approve`, adminJar, {
      _csrf: csrfFrom(adminTutorsPage.text)
    });
    assert(approveTutor.response.status === 302, 'Admin tutor approval failed.', approveTutor.response.status);
    const tutorDashboard = await fetchPage(`${BASE_URL}/dashboard`, tutor.jar);
    assert(tutorDashboard.response.status === 200, 'Tutor session was not active after approval.', tutorDashboard.response.status);

    const showPost = await fetchPage(`${BASE_URL}/posts/${post.id}`, tutor.jar);
    const requestResult = await postForm(`${BASE_URL}/posts/${post.id}/request`, tutor.jar, {
      _csrf: csrfFrom(showPost.text),
      message: 'Smoke tutor request'
    });
    assert(requestResult.response.status === 302, 'Tutor request failed.', requestResult.response.status);

    const transaction = db.prepare('SELECT * FROM transactions WHERE post_id = ? ORDER BY id DESC LIMIT 1').get(post.id);
    assert(transaction, 'Transaction row was not created.');

    const learnerTxPage = await fetchPage(`${BASE_URL}/transactions/${transaction.id}`, learner.jar);
    const acceptResult = await postForm(`${BASE_URL}/transactions/${transaction.id}/accept`, learner.jar, {
      _csrf: csrfFrom(learnerTxPage.text)
    });
    assert(acceptResult.response.status === 302, 'Learner accept failed.', acceptResult.response.status);
    const ongoingTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(transaction.id);
    assert(ongoingTx.status === 'Ongoing', 'Transaction did not become ongoing.', ongoingTx.status);

    const tutorTxPage = await fetchPage(`${BASE_URL}/transactions/${transaction.id}`, tutor.jar);
    const tutorComplete = await postForm(`${BASE_URL}/transactions/${transaction.id}/complete`, tutor.jar, {
      _csrf: csrfFrom(tutorTxPage.text)
    });
    assert(tutorComplete.response.status === 302, 'Tutor complete failed.', tutorComplete.response.status);

    const learnerTxPage2 = await fetchPage(`${BASE_URL}/transactions/${transaction.id}`, learner.jar);
    const learnerComplete = await postForm(`${BASE_URL}/transactions/${transaction.id}/complete`, learner.jar, {
      _csrf: csrfFrom(learnerTxPage2.text)
    });
    assert(learnerComplete.response.status === 302, 'Learner complete failed.', learnerComplete.response.status);

    const completedTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(transaction.id);
    assert(completedTx.status === 'Completed', 'Transaction did not become completed.', completedTx.status);

    const tutorReviewPage = await fetchPage(`${BASE_URL}/transactions/${transaction.id}`, tutor.jar);
    const reviewResult = await postForm(`${BASE_URL}/transactions/${transaction.id}/review`, tutor.jar, {
      _csrf: csrfFrom(tutorReviewPage.text),
      rating: '5',
      comment: 'Great learner'
    });
    assert(reviewResult.response.status === 302, 'Tutor review failed.', reviewResult.response.status);

    const forgotJar = createJar();
    const forgotPage = await fetchPage(`${BASE_URL}/forgot-password`, forgotJar);
    const forgotResult = await postForm(`${BASE_URL}/forgot-password`, forgotJar, {
      _csrf: csrfFrom(forgotPage.text),
      email: learner.email
    });
    assert(forgotResult.response.status === 302, 'Forgot password failed.', forgotResult.response.status);

    const resetRow = db.prepare('SELECT * FROM password_reset_tokens WHERE email = ?').get(learner.email);
    assert(resetRow, 'Password reset token row was not created.');

    const reportsPage = await fetchPage(`${BASE_URL}/admin/reports`, adminJar);
    assert(reportsPage.response.status === 200, 'Admin reports page failed.', reportsPage.response.status);
    const warningsPage = await fetchPage(`${BASE_URL}/admin/warnings`, adminJar);
    assert(warningsPage.response.status === 200, 'Admin warnings page failed.', warningsPage.response.status);
    const announcementsPage = await fetchPage(`${BASE_URL}/admin/announcements`, adminJar);
    assert(announcementsPage.response.status === 200, 'Admin announcements page failed.', announcementsPage.response.status);
    const analyticsPage = await fetchPage(`${BASE_URL}/admin/analytics`, adminJar);
    assert(analyticsPage.response.status === 200, 'Admin analytics page failed.', analyticsPage.response.status);
    const auditPage = await fetchPage(`${BASE_URL}/admin/audit-logs`, adminJar);
    assert(auditPage.response.status === 200, 'Admin audit page failed.', auditPage.response.status);
    const exportUsers = await fetchPage(`${BASE_URL}/admin/export/users`, adminJar);
    assert(exportUsers.response.status === 200, 'Admin export users failed.', exportUsers.response.status);
    assert(exportUsers.response.headers.get('content-type')?.includes('text/csv'), 'Admin export users did not return CSV.');

    console.log('Smoke suite passed.');
  } catch (error) {
    console.error('Smoke suite failed.');
    console.error(error.message);
    if (error.details) console.error(error.details);
    if (output) console.error(output);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.kill('SIGTERM');
      await delay(500);
    }
  }
}

await run();
