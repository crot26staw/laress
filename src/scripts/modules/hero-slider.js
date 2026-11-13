// Слайдер первого экрана: стрелки и полоски прогресса. Без зависимостей.
export function initHeroSlider() {
  const root = document.querySelector('[data-hero-slider]');
  if (!root) return;

  const slides = [...root.querySelectorAll('[data-hero-slide]')];
  const dots = [...root.querySelectorAll('[data-hero-dot]')];
  const prev = root.querySelector('[data-hero-prev]');
  const next = root.querySelector('[data-hero-next]');
  if (slides.length < 2) return;

  let current = slides.findIndex((slide) => slide.classList.contains('hero__slide--active'));
  if (current < 0) current = 0;

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle('hero__slide--active', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
    });
    dots.forEach((dot, i) => {
      const active = i === current;
      dot.classList.toggle('hero__progress-item--active', active);
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  prev?.addEventListener('click', () => goTo(current - 1));
  next?.addEventListener('click', () => goTo(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  goTo(current);
}
