// «Читать продолжение» / «Скрыть» в описании товара: снимает и возвращает ограничение высоты.
// Подписи кнопки — data-label-expand / data-label-collapse.
export function initProductDescription() {
  document.querySelectorAll('[data-description]').forEach((root) => {
    const text = root.querySelector('[data-description-text]');
    const toggle = root.querySelector('[data-description-toggle]');
    if (!text || !toggle) return;

    const { labelExpand = toggle.textContent, labelCollapse = 'Скрыть' } = toggle.dataset;

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      text.classList.toggle('product-details__text--collapsed', expanded);
      toggle.setAttribute('aria-expanded', String(!expanded));
      toggle.textContent = expanded ? labelExpand : labelCollapse;
      // Свернули длинный текст — возвращаем описание в поле зрения
      if (expanded && root.getBoundingClientRect().top < 0) {
        root.scrollIntoView({ block: 'start' });
      }
    });
  });
}
