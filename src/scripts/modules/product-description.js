// «Читать продолжение» в описании товара: снимает ограничение высоты и прячет кнопку.
export function initProductDescription() {
  document.querySelectorAll('[data-description]').forEach((root) => {
    const text = root.querySelector('[data-description-text]');
    const toggle = root.querySelector('[data-description-toggle]');
    if (!text || !toggle) return;

    toggle.addEventListener('click', () => {
      text.classList.remove('product-details__text--collapsed');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.hidden = true;
      text.setAttribute('tabindex', '-1');
      text.focus({ preventScroll: true });
    });
  });
}
