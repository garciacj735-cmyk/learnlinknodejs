import { $ } from './dom.js';
import { initNotifications } from './notifications.js';
import { initWarningModal } from './warnings.js';

const ADMIN_SCROLL_KEY = 'learnlink.admin.scrollTop';
const ADMIN_SIDEBAR_SCROLL_KEY = 'learnlink.admin.sidebarScrollTop';
let adminNavBound = false;

function initNotificationsAfterSwap() {
  initNotifications();
}

export function initAnnouncementHistory() {
  const overlay = $('#announcementHistoryOverlay');
  const openButton = $('[data-open-announcement-history]');
  const closeButton = $('[data-close-announcement-history]');
  const modal = $('#announcementModal');
  const modalContent = $('#announcementModalContent');

  const closeAnnouncementModal = () => {
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
    if (modalContent) modalContent.innerHTML = '';
  };

  if (openButton && openButton.dataset.bound !== '1') {
    openButton.dataset.bound = '1';
    openButton.addEventListener('click', () => {
      overlay?.classList.add('open');
      overlay?.setAttribute('aria-hidden', 'false');
    });
  }

  if (closeButton && closeButton.dataset.bound !== '1') {
    closeButton.dataset.bound = '1';
    closeButton.addEventListener('click', () => {
      overlay?.classList.remove('open');
      overlay?.setAttribute('aria-hidden', 'true');
    });
  }

  document.querySelectorAll('[data-open-announcement-card]').forEach((card) => {
    if (card.dataset.bound === '1') return;
    card.dataset.bound = '1';
    const open = (event) => {
      if (event.target.closest('button, form, a')) return;
      const source = card.querySelector('[data-announcement-source]');
      if (!modal || !modalContent || !source) return;
      modalContent.innerHTML = source.innerHTML;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(event);
      }
    });
  });

  document.querySelectorAll('[data-close-announcement-modal]').forEach((button) => {
    if (button.dataset.bound === '1') return;
    button.dataset.bound = '1';
    button.addEventListener('click', closeAnnouncementModal);
  });

  modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeAnnouncementModal();
  });
}

export function initScrollTop() {
  const topButton = $('#scrollTop');
  addEventListener('scroll', () => {
    if (!topButton) return;
    topButton.style.display = scrollY > 300 ? 'block' : 'none';
  });
  topButton?.addEventListener('click', () => {
    scrollTo({ top: 0, behavior: 'smooth' });
  });
}

export function initCelebration() {
  if (!window.LEARNLINK_CONFETTI || !window.confetti) return;
  const end = Date.now() + 3000;
  const colors = ['#4F8EF7', '#7C3AED', '#00D4AA'];
  const frame = () => {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

export function initAdminScrollPersistence() {
  if (!location.pathname.startsWith('/admin')) return;

  const sidebar = $('.admin-sidebar');
  const storedPageScroll = Number(sessionStorage.getItem(ADMIN_SCROLL_KEY) || 0);
  const storedSidebarScroll = Number(sessionStorage.getItem(ADMIN_SIDEBAR_SCROLL_KEY) || 0);

  if (storedPageScroll > 0) {
    requestAnimationFrame(() => {
      scrollTo(0, storedPageScroll);
    });
  }

  if (sidebar && storedSidebarScroll > 0) {
    requestAnimationFrame(() => {
      sidebar.scrollTop = storedSidebarScroll;
    });
  }

  const saveScrollState = () => {
    sessionStorage.setItem(ADMIN_SCROLL_KEY, String(window.scrollY));
    if (sidebar) {
      sessionStorage.setItem(ADMIN_SIDEBAR_SCROLL_KEY, String(sidebar.scrollTop));
    }
  };

  window.addEventListener('beforeunload', saveScrollState);
  window.addEventListener('pagehide', saveScrollState);
  sidebar?.addEventListener('scroll', saveScrollState, { passive: true });
  window.addEventListener('scroll', saveScrollState, { passive: true });
}

function runInlineScripts(container) {
  container.querySelectorAll('script').forEach((script) => {
    if (script.src) return;
    window.eval(script.textContent);
    script.remove();
  });
}

function renderAnalyticsCharts() {
  if (!window.Chart || !window.CHART_DATA) return;

  const activityCanvas = document.getElementById('activityChart');
  const roleCanvas = document.getElementById('roleChart');
  const approvalCanvas = document.getElementById('approvalChart');
  const subjectsCanvas = document.getElementById('subjectsChart');
  const ratioCanvas = document.getElementById('ratioChart');
  const completionCanvas = document.getElementById('completionChart');

  const baseScales = {
    x: { grid: { color: 'rgba(96,114,150,.12)' }, ticks: { color: '#9fb0cc' } },
    y: { grid: { color: 'rgba(96,114,150,.12)' }, ticks: { color: '#9fb0cc' }, beginAtZero: true }
  };

  if (activityCanvas && window.CHART_DATA.overview) {
    window.learnLinkActivityChart?.destroy?.();
    window.learnLinkActivityChart = new window.Chart(activityCanvas, {
      type: 'line',
      data: {
        labels: window.CHART_DATA.overview.labels,
        datasets: [
          {
            label: 'Posts',
            data: window.CHART_DATA.overview.posts,
            borderColor: '#47c8ff',
            backgroundColor: 'rgba(71,200,255,.18)',
            tension: 0.42,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: '#47c8ff'
          },
          {
            label: 'Transactions',
            data: window.CHART_DATA.overview.transactions,
            borderColor: '#c76dff',
            backgroundColor: 'rgba(199,109,255,.12)',
            tension: 0.42,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: '#c76dff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#d7e1f3' } } },
        scales: baseScales
      }
    });
  }

  if (roleCanvas && window.CHART_DATA.overview) {
    window.learnLinkRoleChart?.destroy?.();
    window.learnLinkRoleChart = new window.Chart(roleCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Learners', 'Tutors'],
        datasets: [{
          data: window.CHART_DATA.overview.roles,
          backgroundColor: ['#47c8ff', '#885dff'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: { legend: { position: 'bottom', labels: { color: '#d7e1f3' } } }
      }
    });
  }

  if (approvalCanvas && window.CHART_DATA.overview) {
    window.learnLinkApprovalChart?.destroy?.();
    window.learnLinkApprovalChart = new window.Chart(approvalCanvas, {
      type: 'bar',
      data: {
        labels: window.CHART_DATA.overview.labels,
        datasets: [{
          label: 'Approvals',
          data: window.CHART_DATA.overview.approvals,
          backgroundColor: 'rgba(111,136,255,.85)',
          borderRadius: 10,
          maxBarThickness: 26
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: baseScales
      }
    });
  }

  if (subjectsCanvas && window.CHART_DATA.analytics) {
    window.learnLinkSubjectsChart?.destroy?.();
    window.learnLinkSubjectsChart = new window.Chart(subjectsCanvas, {
      type: 'line',
      data: {
        labels: window.CHART_DATA.analytics.subjectLabels,
        datasets: [{
          label: 'Requests',
          data: window.CHART_DATA.analytics.subjectData,
          borderColor: '#56b9ff',
          backgroundColor: 'rgba(86,185,255,.14)',
          pointBackgroundColor: '#56b9ff',
          pointRadius: 3,
          tension: 0.35,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: baseScales
      }
    });
  }

  if (ratioCanvas && window.CHART_DATA.analytics) {
    window.learnLinkRatioChart?.destroy?.();
    window.learnLinkRatioChart = new window.Chart(ratioCanvas, {
      type: 'doughnut',
      data: {
        labels: window.CHART_DATA.analytics.ratioLabels,
        datasets: [{ data: window.CHART_DATA.analytics.ratioData, backgroundColor: ['#47c8ff', '#885dff'], borderWidth: 0 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: { legend: { position: 'bottom', labels: { color: '#d7e1f3' } } }
      }
    });
  }

  if (completionCanvas && window.CHART_DATA.analytics) {
    window.learnLinkCompletionChart?.destroy?.();
    window.learnLinkCompletionChart = new window.Chart(completionCanvas, {
      type: 'bar',
      data: {
        labels: window.CHART_DATA.analytics.weeklyLabels,
        datasets: [{
          label: 'Completed',
          data: window.CHART_DATA.analytics.completionData,
          backgroundColor: ['#536dff', '#5d79ff', '#6983ff', '#7c91ff', '#8d9eff', '#7382ff', '#5e6fff'],
          borderRadius: 10,
          maxBarThickness: 24
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: baseScales
      }
    });
  }
}

async function swapAdminPage(url, push = true) {
  const response = await fetch(url, {
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!response.ok) {
    window.location.href = url;
    return;
  }

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const nextSidebar = doc.querySelector('.admin-sidebar');
  const nextMain = doc.querySelector('.admin-main');

  if (!nextSidebar || !nextMain) {
    window.location.href = url;
    return;
  }

  const currentSidebar = document.querySelector('.admin-sidebar');
  const currentMain = document.querySelector('.admin-main');
  const savedSidebarScroll = currentSidebar?.scrollTop || 0;
  const savedWindowScroll = window.scrollY;

  document.title = doc.title;
  if (currentSidebar) currentSidebar.innerHTML = nextSidebar.innerHTML;
  if (currentMain) currentMain.innerHTML = nextMain.innerHTML;

  runInlineScripts(document);
  initAnnouncementHistory();
  initNotificationsAfterSwap();
  initWarningModal();
  renderAnalyticsCharts();

  requestAnimationFrame(() => {
    if (currentSidebar) currentSidebar.scrollTop = savedSidebarScroll;
    window.scrollTo(0, savedWindowScroll);
  });

  if (push) {
    window.history.pushState({ adminUrl: url }, '', url);
  }
}

export function initAdminNavigation() {
  if (adminNavBound) return;
  adminNavBound = true;

  document.addEventListener('click', (event) => {
    const link = event.target.closest('.admin-sidebar a[href]');
    if (!link) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const url = new URL(link.href, window.location.origin);
    if (url.origin !== window.location.origin) return;
    if (!url.pathname.startsWith('/admin')) return;

    event.preventDefault();
    swapAdminPage(url.pathname + url.search);
  });

  window.addEventListener('popstate', () => {
    if (!window.location.pathname.startsWith('/admin')) return;
    swapAdminPage(window.location.pathname + window.location.search, false);
  });

  renderAnalyticsCharts();
}
