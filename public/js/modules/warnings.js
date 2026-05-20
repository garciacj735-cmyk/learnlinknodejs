import { $, $$ } from './dom.js';

let warningDelegatesBound = false;

function openOverlay(element) {
  element?.classList.add('open');
  element?.setAttribute('aria-hidden', 'false');
}

function closeOverlay(element) {
  element?.classList.remove('open');
  element?.setAttribute('aria-hidden', 'true');
}

function getWarningElements() {
  return {
    form: $('[data-warning-form]'),
    modal: $('#warningDeactivationModal'),
    approve: $('#warningModalApprove'),
    daysInput: $('#warningReactivationDays'),
    hiddenDays: $('[data-reactivation-days]'),
    userSelect: $('[data-warning-user-select]'),
    historyOverlay: $('#warningHistoryOverlay'),
    accountModal: $('#warningAccountModal'),
    accountModalContent: $('#warningAccountModalContent')
  };
}

function closeDeactivationModal(resetPending = true) {
  const { modal } = getWarningElements();
  closeOverlay(modal);
  if (modal && resetPending) modal.dataset.pendingSubmit = '0';
}

function closeWarningHistory() {
  const { historyOverlay, accountModal, accountModalContent } = getWarningElements();
  closeOverlay(historyOverlay);
  closeOverlay(accountModal);
  if (accountModalContent) accountModalContent.innerHTML = '';
}

function openWarningHistory() {
  const { historyOverlay, accountModal, accountModalContent } = getWarningElements();
  closeOverlay(accountModal);
  if (accountModalContent) accountModalContent.innerHTML = '';
  openOverlay(historyOverlay);
}

function openWarningAccount(card) {
  const { historyOverlay, accountModal, accountModalContent } = getWarningElements();
  const source = card?.querySelector('[data-warning-source]');
  if (!source || !accountModal || !accountModalContent) return;
  accountModalContent.innerHTML = source.innerHTML;
  closeOverlay(historyOverlay);
  openOverlay(accountModal);
}

function bindDelegatedHandlers() {
  if (warningDelegatesBound) return;
  warningDelegatesBound = true;

  document.addEventListener('click', (event) => {
    const openHistoryButton = event.target.closest('[data-open-warning-history]');
    if (openHistoryButton) {
      event.preventDefault();
      openWarningHistory();
      return;
    }

    const closeHistoryButton = event.target.closest('[data-close-warning-history]');
    if (closeHistoryButton) {
      event.preventDefault();
      closeWarningHistory();
      return;
    }

    const closeWarningButton = event.target.closest('[data-close-warning-account]');
    if (closeWarningButton) {
      event.preventDefault();
      const { accountModal, accountModalContent } = getWarningElements();
      closeOverlay(accountModal);
      if (accountModalContent) accountModalContent.innerHTML = '';
      openWarningHistory();
      return;
    }

    const closeModalButton = event.target.closest('[data-close-warning-modal]');
    if (closeModalButton) {
      event.preventDefault();
      closeDeactivationModal();
      return;
    }

    const approveButton = event.target.closest('#warningModalApprove');
    if (approveButton) {
      event.preventDefault();
      const { form, daysInput, hiddenDays, modal } = getWarningElements();
      const days = Number(daysInput?.value || 0);
      if (!days || days < 1) {
        daysInput?.focus();
        return;
      }
      if (hiddenDays) hiddenDays.value = String(days);
      if (modal) modal.dataset.pendingSubmit = '1';
      closeDeactivationModal(false);
      form?.requestSubmit();
      return;
    }

    const accountCard = event.target.closest('[data-open-warning-account]');
    if (accountCard) {
      if (event.target.closest('button, form, a')) return;
      event.preventDefault();
      openWarningAccount(accountCard);
      return;
    }

    const { modal, historyOverlay, accountModal } = getWarningElements();
    if (event.target === modal) {
      closeDeactivationModal();
      return;
    }
    if (event.target === historyOverlay) {
      closeWarningHistory();
      return;
    }
    if (event.target === accountModal) {
      openWarningHistory();
    }
  });

  document.addEventListener('keydown', (event) => {
    const accountCard = event.target.closest('[data-open-warning-account]');
    if (!accountCard) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openWarningAccount(accountCard);
  });
}

function initWarningForm() {
  const { form, modal, daysInput, hiddenDays, userSelect } = getWarningElements();
  const reasonField = form?.querySelector('textarea[name="reason"]');
  const params = new URLSearchParams(window.location.search);
  const presetUserId = params.get('user_id');
  const presetReason = params.get('reason');

  if (presetUserId && userSelect) {
    userSelect.value = presetUserId;
  }
  if (presetReason && reasonField && !reasonField.value) {
    reasonField.value = presetReason;
  }

  if (!form || form.dataset.bound === '1') return;
  form.dataset.bound = '1';
  if (modal) modal.dataset.pendingSubmit = '0';

  form.addEventListener('submit', (event) => {
    if (modal?.dataset.pendingSubmit === '1') {
      modal.dataset.pendingSubmit = '0';
      return;
    }

    const selected = userSelect?.selectedOptions?.[0];
    const strikes = Number(selected?.dataset?.strikes || 0);
    if (strikes < 2) {
      if (hiddenDays) hiddenDays.value = '';
      return;
    }

    event.preventDefault();
    openOverlay(modal);
    daysInput?.focus();
  });
}

export function initWarningModal() {
  bindDelegatedHandlers();
  initWarningForm();
}
