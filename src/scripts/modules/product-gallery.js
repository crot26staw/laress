// Галерея товара (src/partials/product-preview.html). На десктопе — статичная сетка, скрипт ничего не меняет.
// Планшет и мобильная: лента с нативной прокруткой (scroll-snap), стрелки листают по кругу,
// миниатюры переключают фото, активная миниатюра — aria-current.
export function initProductGallery() {
  document.querySelectorAll('[data-gallery]').forEach((root) => {
    const track = root.querySelector('[data-gallery-track]');
    const slides = track ? [...track.children] : [];
    if (slides.length < 2) return;

    const thumbsList = root.querySelector('[data-gallery-thumbs]');
    const thumbs = thumbsList ? [...thumbsList.querySelectorAll('button')] : [];

    const current = () => Math.round(track.scrollLeft / track.clientWidth) || 0;
    const goTo = (index) => {
      const i = (index + slides.length) % slides.length;
      track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: 'smooth' });
    };

    const setActive = (index) => {
      thumbs.forEach((thumb, i) => {
        if (i === index) {
          thumb.setAttribute('aria-current', 'true');
          // Прокручиваем только ленту миниатюр, не страницу
          const left = thumb.offsetLeft - thumbsList.offsetLeft;
          if (left < thumbsList.scrollLeft || left + thumb.offsetWidth > thumbsList.scrollLeft + thumbsList.clientWidth) {
            thumbsList.scrollTo({ left, behavior: 'smooth' });
          }
        } else {
          thumb.removeAttribute('aria-current');
        }
      });
    };

    root.querySelector('[data-gallery-prev]')?.addEventListener('click', () => goTo(current() - 1));
    root.querySelector('[data-gallery-next]')?.addEventListener('click', () => goTo(current() + 1));
    thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => goTo(i)));

    let frame = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setActive(current()));
    }, { passive: true });
  });
}
