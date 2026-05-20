import { BOY_AVATAR, GIRL_AVATAR } from '../../config/constants.js';
import { wrapPage, hasFlash, escapeHtml, csrfInput } from '../layout.js';

function renderLanding(context) {
  return wrapPage(context, "LearnLink", `
    <section class="welcome-scene">
      <div class="orb one"></div><div class="orb two"></div>
      <div class="floating-words"><span>Mathematics</span><span>Science</span><span>English</span><span>Programming</span><span>Physics</span><span>Biology</span></div>
      <div class="welcome-hero">
        <p class="eyebrow">Role-based tutoring platform</p>
        <h1 class="logo-hero glow">LearnLink</h1>
        <p class="tagline">Connect. Learn. Grow.</p>
        <p class="welcome-copy">Find the right academic support with approved posts, visible schedules, clear rates, protected contact details, and a request system built to keep every connection organized.</p>
        <div class="welcome-actions"><a class="btn ghost" href="/posts">Continue as Guest</a></div>
      </div>
    </section>
    <section class="welcome-section">
      <div class="welcome-flow">
        <article><span>&#10003;</span><h3>Safer Connections</h3><p>Contact details stay hidden until a request is accepted, helping learners and tutors connect through the platform first.</p></article>
        <article><span>&#8369;</span><h3>Clear Expectations</h3><p>Rates, budgets, duration, subjects, and availability are shown before sending a request, so users can decide with confidence.</p></article>
        <article><span>&#9733;</span><h3>Trusted Profiles</h3><p>Reviews, completed sessions, achievements, and verified tutor badges help users understand who they are working with.</p></article>
      </div>
    </section>
    <section class="welcome-section public-info-grid">
      <article class="public-info-card">
        <p class="eyebrow">How It Works</p>
        <h2>One flow for learners and tutors</h2>
        <div class="public-step-list">
          <article><b>1. Create a profile</b><p>Choose learner or tutor, complete your profile, and set the details that matter for matching.</p></article>
          <article><b>2. Review approved posts</b><p>Browse visible posts with subjects, availability, pricing, and role-based context already in place.</p></article>
          <article><b>3. Send a request</b><p>Start with an in-platform request first so the session begins in a controlled and trackable way.</p></article>
          <article><b>4. Unlock contact details</b><p>Once the request is accepted, both sides can continue with the revealed contact information.</p></article>
        </div>
      </article>
      <article class="public-info-card">
        <p class="eyebrow">Why LearnLink</p>
        <h2>Built for organized tutoring transactions</h2>
        <div class="public-bullet-grid">
          <article><strong>Approval-based posting</strong><p>Posts go through admin review before being shown publicly in the feed.</p></article>
          <article><strong>Protected user details</strong><p>Email and phone stay hidden until there is a confirmed request flow.</p></article>
          <article><strong>Warnings and moderation</strong><p>Reports, warnings, deactivation rules, and audit tracking support platform safety.</p></article>
          <article><strong>Post-transaction reviews</strong><p>Ratings open after completion so tutors and learners can build trust over time.</p></article>
        </div>
      </article>
    </section>
    <section class="welcome-section public-showcase-section">
      <div class="public-showcase-grid">
        <article class="public-showcase-card">
          <p class="eyebrow">For Learners</p>
          <h3>Find tutors with clearer context</h3>
          <p>Compare tutor offers by subject, rate, session duration, and availability before sending a request.</p>
        </article>
        <article class="public-showcase-card">
          <p class="eyebrow">For Tutors</p>
          <h3>Offer your expertise with structure</h3>
          <p>Publish tutoring offers, receive organized requests, and build a stronger profile through reviews.</p>
        </article>
        <article class="public-showcase-card">
          <p class="eyebrow">For Admins</p>
          <h3>Moderate with visibility</h3>
          <p>Review posts, handle reports, issue warnings, and monitor the platform through analytics and audit logs.</p>
        </article>
      </div>
    </section>
    <div class="login-modal ${(context.query.login === "1" || hasFlash(context, "error")) ? "open" : ""}" id="loginModal">
      <div class="modal-backdrop" data-close-login></div>
      <div class="auth-card modal-card">
        <button class="modal-close" data-close-login type="button">x</button>
        <h1 class="logo-hero glow">LearnLink</h1><p class="tagline">Connect. Learn. Grow.</p>
        <form method="post" action="/login" class="stagger">${csrfInput(context)}
          <label>Email<input name="email" type="email" required></label>
          <label>Password<span class="password-wrap"><input name="password" type="password" required><button type="button" data-eye>Show</button></span></label>
          <div class="row"><label class="check"><input type="checkbox" name="remember"> Remember me</label><a href="/forgot-password">Forgot password?</a></div>
          <button class="btn wide">Log In</button>
        </form>
        <div class="divider"><span>or continue as</span></div>
        <div class="role-grid">
          <a class="role-card guest" href="/posts"><b>Guest</b><span>Browse freely</span></a>
          <a class="role-card learner" href="/register?role=learner"><b>Learner</b><span>Find a tutor</span></a>
          <a class="role-card tutor" href="/register?role=tutor"><b>Tutor</b><span>Offer your expertise</span></a>
        </div>
        <p class="center soft">New here? <a href="/register">Create an account</a></p>
      </div>
    </div>
  `);
}

export {
  renderLanding
};
