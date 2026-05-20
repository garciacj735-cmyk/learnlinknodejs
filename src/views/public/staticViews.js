import { wrapPage, escapeHtml, csrfInput } from '../layout.js';

function renderStaticPage(context, title, body) {
  return wrapPage(context, title, body);
}

function renderAbout(context) {
  return wrapPage(
    context,
    "About",
    `<section class="public-page-shell public-about-shell">
      <header class="public-page-hero public-about-hero">
        <p class="eyebrow">About LearnLink</p>
        <h1>Built for clearer tutoring connections</h1>
        <p>LearnLink connects learners and tutors through moderated posts, structured requests, protected contact details, and trackable transactions that stay organized from first inquiry to final review.</p>
      </header>
      <section class="public-info-grid public-about-grid">
        <article class="public-info-card">
          <p class="eyebrow">What the Platform Does</p>
          <h2>Safer matching with visible expectations</h2>
          <div class="public-bullet-grid">
            <article><strong>Role-based posting</strong><p>Learners and tutors create posts with the details needed for better matching and approval review.</p></article>
            <article><strong>Protected contact flow</strong><p>Contact information stays hidden until a request is accepted, so early conversations remain inside the platform.</p></article>
            <article><strong>Managed transactions</strong><p>Requests, statuses, completion flow, and reviews keep each tutoring arrangement easy to track.</p></article>
            <article><strong>Moderation support</strong><p>Reports, warnings, announcements, and audit logs help admins keep the system reliable.</p></article>
          </div>
        </article>
        <article class="public-info-card">
          <p class="eyebrow">Core Journey</p>
          <h2>How sessions move inside LearnLink</h2>
          <div class="public-step-list">
            <article><b>1. Join with a role</b><p>Users register as learners or tutors and complete the profile details that help others understand them.</p></article>
            <article><b>2. Browse the right feed</b><p>Learners view tutor posts, while tutors view learner posts, keeping the feed focused and relevant.</p></article>
            <article><b>3. Start with a request</b><p>A structured request begins the transaction before contact details are revealed.</p></article>
            <article><b>4. Build trust over time</b><p>Completed sessions, reviews, ratings, and moderation history support better decision-making later on.</p></article>
          </div>
        </article>
      </section>
      <section class="public-showcase-section public-about-showcase">
        <div class="public-showcase-grid">
          <article class="public-showcase-card">
            <p class="eyebrow">Learners</p>
            <h3>Search with clearer context</h3>
            <p>See subjects, rates, schedules, and tutor details before sending a request.</p>
          </article>
          <article class="public-showcase-card">
            <p class="eyebrow">Tutors</p>
            <h3>Respond to real learning needs</h3>
            <p>Find learner posts, manage requests, and grow your profile through reviews.</p>
          </article>
          <article class="public-showcase-card">
            <p class="eyebrow">Administration</p>
            <h3>Keep the system organized</h3>
            <p>Review posts, handle reports, issue warnings, and monitor activity with stronger visibility.</p>
          </article>
        </div>
      </section>
    </section>`
  );
}

function renderFaq(context) {
  const items = [
    ["What is LearnLink?", "A role-based tutoring platform for learners and tutors."],
    ["How do I register as a Learner or Tutor?", "Choose your role from the landing page and complete registration."],
    ["How does the request system work?", "Send a request from an approved post and wait for the owner to accept or decline."],
    ["When can I see contact details?", "Only after a request is accepted and transaction is ongoing."],
    ["How do reviews work?", "Both parties can review after both mark the transaction completed."],
    ["What happens if I get a warning?", "Three strikes deactivate the account."]
  ];

  return wrapPage(
    context,
    "FAQ",
    `<section class="public-page-shell">
      <header class="public-page-hero">
        <p class="eyebrow">Common Questions</p>
        <h1>FAQ</h1>
      </header>
      <section class="public-faq-grid">
        ${items.map(([question, answer]) => `<details class="public-faq-item"><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join("")}
      </section>
    </section>`
  );
}

function renderContact(context) {
  return wrapPage(
    context,
    "Contact",
    `<section class="public-page-shell public-contact-shell">
      <article class="public-contact-copy">
        <p class="eyebrow">Support</p>
        <h1>Contact</h1>
        <p class="public-contact-lead">Reach the LearnLink team for account questions, moderation concerns, or general platform help.</p>
        <div class="public-bullet-grid">
          <article><strong>Platform Questions</strong><p>Ask about registrations, requests, reviews, or account visibility.</p></article>
          <article><strong>Reports and Concerns</strong><p>Contact the admin team if you need help with moderation-related issues.</p></article>
          <article><strong>General Assistance</strong><p>Send a direct message and the admin will receive it in the system.</p></article>
        </div>
      </article>
      <form class="panel form-panel public-contact-form" method="post" action="/contact">
        ${csrfInput(context)}
        <h2>Send Message</h2>
        <label>Name<input name="name" required></label>
        <label>Email<input name="email" type="email" required></label>
        <label>Subject<input name="subject" required></label>
        <label>Message<textarea name="message" required></textarea></label>
        <button class="btn">Send Message</button>
      </form>
    </section>`
  );
}

export {
  renderStaticPage,
  renderAbout,
  renderFaq,
  renderContact
};
