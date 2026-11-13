// Кнопка «в избранное» на карточке: визуальное переключение (логику сохранения добавит WordPress).
export function initWishlist() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.product-card__wishlist');
    if (!button) return;
    const pressed = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', String(!pressed));
    button.setAttribute('aria-label', pressed ? 'Добавить в избранное' : 'Убрать из избранного');
  });
}
