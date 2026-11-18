// «Избранное»: крестик на карточке убирает товар из списка (сохранение на сервере добавит WordPress).
export function initFavorites() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-favorite-remove]');
    if (!button) return;
    const card = button.closest('.product-card');
    (card.parentElement.tagName === 'LI' ? card.parentElement : card).remove();
  });
}
