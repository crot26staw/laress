// Панель фильтров каталога на нативном <dialog>: фокус внутри панели и закрытие по Esc — средствами браузера.
// Закрытие: крестик, клик по затемнению. «Посмотреть все» раскрывает скрытые пункты группы (их выведет WordPress).

export function initFilters() {
  const dialog = document.querySelector('[data-filters]');
  if (!dialog) return;

  const openButtons = document.querySelectorAll('[data-filters-open]');

  openButtons.forEach((button) =>
    button.addEventListener('click', () => {
      dialog.showModal();
      button.setAttribute('aria-expanded', 'true');
    }),
  );

  dialog.addEventListener('close', () => {
    openButtons.forEach((button) => button.setAttribute('aria-expanded', 'false'));
  });

  dialog.querySelector('[data-filters-close]')?.addEventListener('click', () => dialog.close());

  // Форма занимает всю панель, поэтому клик по самому <dialog> — это клик по затемнению
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.querySelectorAll('[data-filters-more]').forEach((button) => {
    button.addEventListener('click', () => {
      const extra = button.closest('ul').querySelectorAll('[data-filters-extra]');
      const expanded = button.getAttribute('aria-expanded') === 'true';
      extra.forEach((item) => (item.hidden = expanded));
      button.setAttribute('aria-expanded', String(!expanded));
      button.textContent = expanded ? 'Посмотреть все' : 'Свернуть';
    });
  });
}
