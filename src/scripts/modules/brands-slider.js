// «Популярные бренды»: бесконечная карусель с крупной центральной карточкой.
// Каждая карточка позиционируется по своему «слоту» относительно центра через transform,
// поэтому соседние карточки плавно переезжают, а центральная плавно растёт.
// Список размножается копиями, чтобы карточка, переходящая с одного края на другой, перескакивала за экраном.

// Ширина обычной и центральной карточки и отступ, px макета — по брейкпоинтам (как в CSS brands.css)
const SIZES = [
  { query: '(max-width: 767.98px)', small: 343, large: 343, gap: 12 }, // мобильная: все карточки одинаковые
  { query: '(max-width: 1279.98px)', small: 230, large: 340, gap: 12 }, // планшет
  { query: 'all', small: 254, large: 446, gap: 12 }, // десктоп (макет 1440)
];
const COPIES = 3; // сколько раз повторить список (оригинал + копии слева и справа)
const SWIPE_THRESHOLD = 40; // px — короче считается касанием, а не свайпом

// На мобильной карточка не шире ряда (на экранах уже 375 — по ширине контейнера)
const sizes = (slider) => {
  const size = SIZES.find(({ query }) => window.matchMedia(query).matches);
  if (size !== SIZES[0] || !slider) return size;
  const card = Math.min(size.large, slider.clientWidth);
  return { ...size, small: card, large: card };
};

// Масштаб макета: корневой шрифт растёт от 16px (1440) до 21.33px (1920); на планшете и мобильной — 16px
const scale = () => parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;

// Центр карточки со слотом s относительно центра ряда, в px экрана
function slotCenter(s, size) {
  if (s === 0) return 0;
  const { small, large, gap } = size;
  const sign = Math.sign(s);
  const n = Math.abs(s);
  return sign * (large / 2 + gap + (n - 1) * (small + gap) + small / 2) * scale();
}

export function initBrandsSliders() {
  document.querySelectorAll('[data-brands-slider]').forEach((root) => {
    const track = root.querySelector('[data-brands-track]');
    const prev = root.querySelector('[data-brands-prev]');
    const next = root.querySelector('[data-brands-next]');
    const originals = [...(track?.children ?? [])];
    if (!track || originals.length < 2) return;

    const ACTIVE = 'brands__item--active';
    // Стартовая карточка — отмеченная активной; на мобильной (там все карточки одинаковые) — первая, как в макете
    const isMobile = window.matchMedia(SIZES[0].query).matches;
    const startIndex = isMobile ? 0 : Math.max(0, originals.findIndex((item) => item.classList.contains(ACTIVE)));

    // Копии слева и справа — недоступны для клавиатуры и скринридеров
    const makeClones = () =>
      originals.map((item) => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.inert = true;
        return clone;
      });
    const before = makeClones();
    const after = makeClones();
    track.prepend(...before);
    track.append(...after);

    const items = [...before, ...originals, ...after];
    const total = items.length;
    const half = Math.floor(total / 2);
    const centerIndex = originals.length * Math.floor(COPIES / 2) + startIndex;
    let offset = 0;

    // Слот элемента: от -half до total - 1 - half, 0 — центр
    const slotOf = (index) => {
      let s = (index - centerIndex - offset) % total;
      if (s < 0) s += total;
      if (s > total - 1 - half) s -= total;
      return s;
    };

    let previousSlots = items.map(slotOf);

    const slider = track.parentElement;
    const render = (animate) => {
      const size = sizes(slider);
      root.style.setProperty('--brands-card', `${size.large}px`);
      items.forEach((item, index) => {
        const slot = slotOf(index);
        // Карточка перескочила с одного края на другой — переносим без анимации (она за экраном)
        const wrapped = Math.abs(slot - previousSlots[index]) > 1;
        item.classList.toggle('brands__item--no-transition', !animate || wrapped);
        item.style.setProperty('--brands-x', `${slotCenter(slot, size)}px`);
        item.classList.toggle(ACTIVE, slot === 0);
        previousSlots[index] = slot;
      });
    };

    previousSlots = items.map(slotOf);
    render(false);
    track.classList.add('brands__track--carousel');
    // Включить анимацию со следующего кадра, чтобы стартовая раскладка не «поехала»
    requestAnimationFrame(() => requestAnimationFrame(() => {
      items.forEach((item) => item.classList.remove('brands__item--no-transition'));
    }));

    const move = (step) => {
      offset += step;
      render(true);
    };

    next?.addEventListener('click', () => move(1));
    prev?.addEventListener('click', () => move(-1));

    // Планшет и мобильная: стрелок нет, карусель листается свайпом
    let touchStart = null;
    track.addEventListener(
      'touchstart',
      (event) => {
        const touch = event.touches[0];
        touchStart = { x: touch.clientX, y: touch.clientY };
      },
      { passive: true },
    );
    track.addEventListener('touchend', (event) => {
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStart.x;
      const dy = touch.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
      move(dx < 0 ? 1 : -1);
    });

    // При изменении ширины окна меняются масштаб и размеры карточек — пересчитать позиции без анимации
    let resizeFrame;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => render(false));
    });
  });
}
