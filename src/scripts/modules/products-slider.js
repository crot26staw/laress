// «Выбор клиентов»: лента с нативной прокруткой (scroll-snap), стрелки листают на одну карточку.
export function initProductsSliders() {
  document.querySelectorAll('[data-products-slider]').forEach((root) => {
    const track = root.querySelector('[data-products-track]');
    const prev = root.querySelector('[data-products-prev]');
    const next = root.querySelector('[data-products-next]');
    if (!track) return;

    const step = () => {
      const item = track.firstElementChild;
      if (!item) return track.clientWidth;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return item.getBoundingClientRect().width + gap;
    };

    prev?.addEventListener('click', () => track.scrollBy({ left: -step() }));
    next?.addEventListener('click', () => track.scrollBy({ left: step() }));
  });
}
