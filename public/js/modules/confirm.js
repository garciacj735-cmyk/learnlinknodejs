import { $$, $ } from './dom.js';

export function initConfirmModal() {
  const modal = $('#confirmModal');
  const message = $('#confirmModalMessage');
  const approve = $('#confirmModalApprove');
  let pendingForm = null;

  const close = () => {
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
    pendingForm = null;
  };

  const open = (text, form) => {
    if (!modal || !message) return;
    message.textContent = text || 'Are you sure?';
    pendingForm = form;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  };

  $$('form[onsubmit]').forEach((form) => {
    const inlineConfirm = form.getAttribute('onsubmit') || '';
    const match = inlineConfirm.match(/confirm\((['"`])([\s\S]*?)\1\)/);
    if (!match) return;
    if (!form.dataset.confirm) form.dataset.confirm = match[2];
    form.removeAttribute('onsubmit');
    form.onsubmit = null;
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.dataset.confirmBypass === '1') {
      delete form.dataset.confirmBypass;
      return;
    }
    if (!form.dataset.confirm) return;
    event.preventDefault();
    open(form.dataset.confirm, form);
  }, true);

  approve?.addEventListener('click', () => {
    if (!pendingForm) return;
    const form = pendingForm;
    form.dataset.confirmBypass = '1';
    close();
    form.requestSubmit();
  });

  $$('[data-close-confirm-modal]').forEach((element) => element.addEventListener('click', close));
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
}
