import { $ } from './dom.js';

export function initCursorGlow() {
  document.addEventListener('mousemove', (event) => {
    const glow = $('.cursor-glow');
    if (!glow) return;
    glow.style.left = `${event.clientX - 110}px`;
    glow.style.top = `${event.clientY - 110}px`;
  });
}
