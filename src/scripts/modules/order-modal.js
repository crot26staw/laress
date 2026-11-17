// Модалка «Оформление заказа»: после отправки формы показывает экран «Заказ успешно оформлен».
// До WordPress отправка имитируется: валидная форма не уходит на сервер, сразу показывается успех.
// В теме с Contact Form 7 вместо submit слушаем событие wpcf7mailsent на форме.
// При закрытии модалка возвращается к пустой форме.

export function initOrderModal() {
  const dialog = document.querySelector('[data-order-modal]');
  if (!dialog) return;

  const form = dialog.querySelector('[data-order-form]');
  const success = dialog.querySelector('[data-order-success]');

  const showSuccess = () => {
    form.hidden = true;
    success.hidden = false;
    success.querySelector('a, button')?.focus();
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    showSuccess();
  });

  dialog.addEventListener('close', () => {
    if (form.hidden) form.reset();
    form.hidden = false;
    success.hidden = true;
  });
}
