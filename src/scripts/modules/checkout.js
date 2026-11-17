// Оформление заказа: переключатель «Курьером до двери» / «Самовывоз» показывает нужный блок
// (адрес и время доставки или адрес бутика и дата самовывоза). Поля скрытого блока отключаются,
// чтобы не уходить с формой и не мешать проверке required.

export function initCheckout() {
  const form = document.querySelector('[data-checkout]');
  if (!form) return;

  const switches = form.querySelectorAll('[data-delivery-switch]');
  const panels = form.querySelectorAll('[data-delivery-panel]');

  const update = () => {
    const current = form.querySelector('[data-delivery-switch]:checked')?.value;
    panels.forEach((panel) => {
      const active = panel.dataset.deliveryPanel === current;
      panel.hidden = !active;
      panel.querySelectorAll('input').forEach((field) => (field.disabled = !active));
    });
  };

  switches.forEach((input) => input.addEventListener('change', update));
  update();
}
