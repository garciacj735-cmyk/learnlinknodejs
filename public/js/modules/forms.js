import { $, $$ } from './dom.js';

export function initTextareaCounters() {
  $$('textarea[maxlength]').forEach((textarea) => {
    const counter = $('[data-count-text]');
    const sync = () => {
      if (counter) counter.textContent = textarea.value.length;
    };
    textarea.addEventListener('input', sync);
    sync();
  });
}

export function initPostFormToggles() {
  const subjectSelect = $('[data-subject-select]');
  const subjectOther = $('[data-subject-other]');
  if (subjectSelect && subjectOther) {
    const customInput = $('input[name="custom_subject"]', subjectOther);
    const syncSubject = () => {
      const open = subjectSelect.value === 'Other';
      subjectOther.classList.toggle('hidden', !open);
      if (customInput) customInput.required = open;
    };
    subjectSelect.addEventListener('change', syncSubject);
    syncSubject();
  }

  const categoryFilter = $('[data-post-category-filter]');
  const customSubjectFilter = $('[data-custom-subject-filter]');
  if (categoryFilter && customSubjectFilter) {
    const syncFilter = () => {
      const open = categoryFilter.value === 'Other';
      customSubjectFilter.classList.toggle('hidden', !open);
      if (!open) customSubjectFilter.value = '';
    };
    categoryFilter.addEventListener('change', syncFilter);
    syncFilter();
  }
}
