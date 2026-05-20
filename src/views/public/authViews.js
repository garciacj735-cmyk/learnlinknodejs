import { BOY_AVATAR, GIRL_AVATAR } from '../../config/constants.js';
import { wrapPage, escapeHtml, csrfInput, capitalize } from '../layout.js';

function renderAdminLogin(context) {
  return wrapPage(context, 'Admin Login', `<section class="auth-scene"><form class="auth-card" method="post" action="/admin/login">${csrfInput(context)}<h1>LearnLink Admin</h1><label>Email<input name="email" type="email" required></label><label>Password<input name="password" type="password" required></label><button class="btn wide">Admin Login</button></form></section>`);
}

function renderRegister(context) {
  const role = context.query.role === 'tutor' ? 'tutor' : 'learner';

  return wrapPage(context, 'Register', `<section class="auth-scene"><div class="orb one"></div><div class="orb two"></div>
    <form class="auth-card wide-card stagger" method="post" action="/register">${csrfInput(context)}
      <h1>Create ${capitalize(role)} Account</h1>
      <input type="hidden" name="role" value="${role}">
      <div class="grid-2"><label>Full name<input name="name" required></label><label>Email address<input name="email" type="email" required></label></div>
      <div class="grid-2"><label>Password<span class="password-wrap"><input name="password" type="password" required><button type="button" data-eye>Show</button></span></label><label>Confirm password<input name="password_confirmation" type="password" required></label></div>
      <p class="soft">Choose avatar</p><div class="gender-grid">
        <label><input type="radio" name="gender" value="boy" required><span class="avatar-choice"><img src="${BOY_AVATAR}"><b>Boy</b></span></label>
        <label><input type="radio" name="gender" value="girl" required><span class="avatar-choice"><img src="${GIRL_AVATAR}"><b>Girl</b></span></label>
      </div>
      <h3>Optional Contact Details</h3>
      <div class="grid-2"><label>Phone<input name="phone"></label><label>Messenger link<input name="messenger_link"></label><label>Telegram<input name="telegram"></label><label>Instagram<input name="instagram"></label><label>Discord<input name="discord"></label></div>
      <button class="btn wide">Create Account</button><p class="center soft">Already have an account? <a href="/">Login</a></p>
    </form>
  </section>`);
}

function renderPending(context) {
  return wrapPage(context, 'Tutor Pending', `<section class="auth-scene"><div class="auth-card pending"><h1>Clock</h1><h2>Your tutor account is pending review by our admin team</h2><p>You can stay logged in while waiting for admin approval.</p><a class="btn ghost" href="/dashboard">Go to Dashboard</a></div></section>`);
}

function renderForgot(context) {
  return wrapPage(context, 'Forgot Password', `<section class="auth-scene"><form class="auth-card" method="post" action="/forgot-password">${csrfInput(context)}<h1>Forgot Password</h1><label>Email<input name="email" type="email" required></label><button class="btn wide">Send Reset Link</button><a href="/">Back to login</a></form></section>`);
}

function renderReset(context, token) {
  return wrapPage(context, 'Reset Password', `<section class="auth-scene"><form class="auth-card" method="post" action="/reset-password/${escapeHtml(token)}">${csrfInput(context)}<h1>Reset Password</h1><label>Email<input name="email" type="email" required value="${escapeHtml(context.query.email || '')}"></label><label>New password<input name="password" type="password" required></label><label>Confirm password<input name="password_confirmation" type="password" required></label><button class="btn wide">Reset Password</button></form></section>`);
}

export {
  renderAdminLogin,
  renderRegister,
  renderPending,
  renderForgot,
  renderReset
};
