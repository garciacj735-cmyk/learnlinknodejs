import { $, $$ } from './dom.js';

export function initChat() {
  const windowEl = $('#chatWindow');
  const openButton = $('#chatOpen');
  const closeButton = $('#chatClose');
  const messages = $('#chatMessages');
  const form = $('#chatForm');
  const input = $('#chatInput');

  openButton?.addEventListener('click', () => windowEl?.classList.add('open'));
  closeButton?.addEventListener('click', () => windowEl?.classList.remove('open'));

  $$('.quick-chat button').forEach((button) => {
    button.addEventListener('click', () => {
      if (!input || !form) return;
      input.value = button.textContent || '';
      form.requestSubmit();
    });
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = input?.value.trim();
    if (!message || !messages || !input) return;

    const safeMessage = message.replace(/[<>]/g, '');
    messages.insertAdjacentHTML('beforeend', '<p class="user">' + safeMessage + '</p><p class="bot typing">...</p>');
    const typing = messages.lastElementChild;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    try {
      const response = await fetch('/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]')?.content || ''
        },
        body: JSON.stringify({ message })
      });
      const data = await response.json();
      if (typing) typing.textContent = data.reply || 'I am here to help with LearnLink.';
    } catch {
      if (typing) typing.textContent = 'Chat is temporarily unavailable.';
    }

    typing?.classList.remove('typing');
    messages.scrollTop = messages.scrollHeight;
  });
}
