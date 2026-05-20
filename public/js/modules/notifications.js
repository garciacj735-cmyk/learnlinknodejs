import { $, $$ } from './dom.js';

let notificationsGlobalBound = false;

function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content || '';
}

function reduceUnreadBadges() {
  ['.bell-count', '.side-count'].forEach((selector) => {
    document.querySelectorAll(selector).forEach((badge) => {
      const total = Number.parseInt((badge.textContent || '').trim(), 10);
      if (!Number.isFinite(total) || total <= 1) {
        badge.remove();
        return;
      }
      badge.textContent = String(total - 1);
    });
  });
}

async function markNotificationRead(card) {
  if (!card || !card.classList.contains('unread')) return;
  const id = card.dataset.notificationId;
  const token = csrfToken();
  card.classList.remove('unread');
  reduceUnreadBadges();
  if (!id || !token) return;
  try {
    await fetch(`/notifications/${id}/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-CSRF-TOKEN': token,
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin',
      body: new URLSearchParams({ _csrf: token }).toString()
    });
  } catch (_) {
  }
}

export function initNotifications() {
  const trashToggle = $('[data-trash-mode]');
  const selectAll = $('[data-select-all]');
  const modal = $('#notificationModal');
  const modalContent = $('#notificationModalContent');

  if (trashToggle && trashToggle.dataset.bound !== '1') {
    trashToggle.dataset.bound = '1';
    trashToggle.addEventListener('click', () => document.body.classList.toggle('trash-mode'));
  }

  if (selectAll && selectAll.dataset.bound !== '1') {
    selectAll.dataset.bound = '1';
    selectAll.addEventListener('change', () => {
      $$('input[name="notifications[]"]').forEach((checkbox) => {
        checkbox.checked = selectAll.checked;
      });
    });
  }

  const close = () => {
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
    if (modalContent) modalContent.innerHTML = '';
  };

  $$('[data-notification-open]').forEach((card) => {
    if (card.dataset.bound === '1') return;
    card.dataset.bound = '1';
    card.addEventListener('click', (event) => {
      if (document.body.classList.contains('trash-mode')) return;
      if (event.target.closest('a,button,label,input')) return;
      markNotificationRead(card);
      const source = $('[data-notification-source]', card);
      if (!modal || !modalContent || !source) return;
      modalContent.innerHTML = source.innerHTML;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    });

    card.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && !document.body.classList.contains('trash-mode')) {
        event.preventDefault();
        card.click();
      }
    });
  });

  $$('[data-close-notification-modal]').forEach((element) => {
    if (element.dataset.bound === '1') return;
    element.dataset.bound = '1';
    element.addEventListener('click', close);
  });

  if (!notificationsGlobalBound) {
    notificationsGlobalBound = true;
    modal?.addEventListener('click', (event) => {
      if (event.target === modal) close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close();
    });
  }
}
