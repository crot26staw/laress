// Подарочная карта: быстрый выбор суммы подставляет значение в поле «Сумма подарка»,
// введённая вручную сумма форматируется с разрядами и знаком рубля.

const formatRub = (value) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;

export function initGiftCard() {
  const form = document.querySelector('[data-gift-card]');
  if (!form) return;

  const input = form.querySelector('[data-gift-card-amount]');

  form.querySelectorAll('[data-gift-card-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      input.value = formatRub(Number(button.dataset.giftCardPreset));
    });
  });

  input.addEventListener('focus', () => {
    input.value = input.value.replace(/\D/g, '');
  });

  input.addEventListener('blur', () => {
    const digits = input.value.replace(/\D/g, '');
    input.value = digits ? formatRub(Number(digits)) : '';
  });
}
