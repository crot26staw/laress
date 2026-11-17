// Панели с формой в личном кабинете (src/partials/profile-edit-drawer.html, address-drawer.html).
// До WordPress отправка имитируется: валидная форма не уходит на сервер, панель закрывается,
// а если у формы есть [data-drawer-success="<id окна>"] — открывается это окно («Адрес успешно добавлен»).
// В теме с Contact Form 7 вместо submit слушаем событие wpcf7mailsent на форме.
// Кнопка [data-field-clear] очищает поле рядом с собой.

export function initDrawerForms() {
  document.querySelectorAll('[data-drawer-form]').forEach((form) => {
    const dialog = form.closest('dialog');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      dialog.close();
      form.reset();
      document.getElementById(form.dataset.drawerSuccess ?? '')?.showModal();
    });

    // Закрыли без отправки — возвращаем исходные значения
    dialog.addEventListener('close', () => form.reset());
  });

  document.querySelectorAll('[data-field-clear]').forEach((button) => {
    const input = button.parentElement.querySelector('input');

    button.addEventListener('click', () => {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
    });
  });
}
