// «Популярные бренды»: бесконечная карусель с крупной центральной карточкой.
// Каждая карточка позиционируется по своему «слоту» относительно центра через transform,
// поэтому соседние карточки плавно переезжают, а центральная плавно растёт.
// Список размножается копиями, чтобы карточка, переходящая с одного края на другой, перескакивала за экраном.

const SMALL = 254; // ширина обычной карточки, px макета 1440
const LARGE = 446; // ширина центральной карточки
const GAP = 12;
const COPIES = 3; // сколько раз повторить список (оригинал + копии слева и справа)

// Масштаб макета: корневой шрифт растёт от 16px (1440) до 21.33px (1920)
const scale = () => parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;

// Центр карточки со слотом s относительно центра ряда, в px экрана
function slotCenter(s) {
  if (s === 0) return 0;
  const sign = Math.sign(s);
  const n = Math.abs(s);
  return sign * (LARGE / 2 + GAP + (n - 1) * (SMALL + GAP) + SMALL / 2) * scale();
}

export function initBrandsSliders() {
  document.querySelectorAll('[data-brands-slider]').forEach((root) => {
    const track = root.querySelector('[data-brands-track]');
    const prev = root.querySelector('[data-brands-prev]');
    const next = root.querySelector('[data-brands-next]');
    const originals = [...(track?.children ?? [])];
    if (!track || originals.length < 2) return;

    const ACTIVE = 'brands__item--active';
    const startIndex = Math.max(0, originals.findIndex((item) => item.classList.contains(ACTIVE)));

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

    const render = (animate) => {
      items.forEach((item, index) => {
        const slot = slotOf(index);
        // Карточка перескочила с одного края на другой — переносим без анимации (она за экраном)
        const wrapped = Math.abs(slot - previousSlots[index]) > 1;
        item.classList.toggle('brands__item--no-transition', !animate || wrapped);
        item.style.setProperty('--brands-x', `${slotCenter(slot)}px`);
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

    // При изменении ширины окна меняется масштаб — пересчитать позиции без анимации
    let resizeFrame;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => render(false));
    });
  });
}
