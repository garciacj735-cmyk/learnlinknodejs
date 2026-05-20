import { $, $$ } from './dom.js';

export function initPasswordToggles() {
  $$('[data-eye]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = button.parentElement?.querySelector('input');
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      button.textContent = input.type === 'password' ? 'Show' : 'Hide';
    });
  });
}

export function initLoginModal() {
  const modal = $('#loginModal');
  $$('[data-open-login]').forEach((button) => button.addEventListener('click', () => modal?.classList.add('open')));
  $$('[data-close-login]').forEach((button) => button.addEventListener('click', () => modal?.classList.remove('open')));
  $$('[data-login]').forEach((button) => button.addEventListener('click', () => alert('Please login or register to use this feature.')));
}
