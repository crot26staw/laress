// Шапка: выпадающие меню (наведение, фокус, Esc) и компактный режим после прокрутки.

const OPEN_DELAY = 80; // мс — чтобы меню не мигало, когда курсор просто проходит над пунктами
const CLOSE_DELAY = 200;

export function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  const overlay = document.querySelector('[data-page-overlay]');
  const items = [...header.querySelectorAll('[data-menu-item]')];
  const links = [...header.querySelectorAll('.header__menu-link')];
  let current = null;
  let openTimer;
  let closeTimer;

  // Жирный активный пункт шире обычного — фиксируем ширину пунктов, чтобы меню не «прыгало»
  const lockWidths = () => {
    links.forEach((link) => (link.style.width = ''));
    const widths = links.map((link) => link.getBoundingClientRect().width);
    links.forEach((link, i) => {
      if (widths[i]) link.style.width = `${widths[i]}px`;
    });
  };

  const setOverlay = (visible) => overlay?.classList.toggle('page-overlay--visible', visible);

  const open = (item) => {
    if (current === item) return;
    current?.classList.remove('header__menu-item--open');
    current?.querySelector('[data-menu-link]')?.setAttribute('aria-expanded', 'false');
    current = item;
    item.classList.add('header__menu-item--open');
    item.querySelector('[data-menu-link]')?.setAttribute('aria-expanded', 'true');
    header.classList.add('header--menu-open');
    setOverlay(true);
  };

  const close = () => {
    if (!current) return;
    current.classList.remove('header__menu-item--open');
    current.querySelector('[data-menu-link]')?.setAttribute('aria-expanded', 'false');
    current = null;
    header.classList.remove('header--menu-open');
    setOverlay(false);
  };

  items.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      clearTimeout(closeTimer);
      clearTimeout(openTimer);
      openTimer = setTimeout(() => open(item), current ? 0 : OPEN_DELAY);
    });
    item.addEventListener('focusin', () => {
      clearTimeout(closeTimer);
      open(item);
    });
  });

  // Пункты без выпадающего меню и остальные элементы шапки закрывают меню
  header.querySelectorAll('.header__menu-item:not([data-menu-item]), .header__top').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      clearTimeout(openTimer);
      closeTimer = setTimeout(close, CLOSE_DELAY);
    });
  });

  header.addEventListener('mouseleave', () => {
    clearTimeout(openTimer);
    closeTimer = setTimeout(close, CLOSE_DELAY);
  });

  header.addEventListener('focusout', (event) => {
    if (!header.contains(event.relatedTarget)) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !current) return;
    const link = current.querySelector('[data-menu-link]');
    close();
    link?.focus();
  });

  overlay?.addEventListener('click', close);

  // Компактная шапка: включается, когда полная шапка ушла за верх экрана.
  // Обычная шапка стоит в потоке (прозрачная на главной — поверх фото), поэтому, когда она становится fixed,
  // сохраняем её высоту отступом у body — иначе страница прыгнет вверх.
  const inFlow = getComputedStyle(header).position !== 'absolute';
  let threshold = 0;
  let fullHeight = 0;
  const reserveSpace = (compact) => {
    if (inFlow) document.body.style.paddingTop = compact ? `${fullHeight}px` : '';
  };
  const measure = () => {
    const wasCompact = header.classList.contains('header--compact');
    header.classList.remove('header--compact');
    reserveSpace(false);
    fullHeight = header.offsetHeight;
    threshold = header.getBoundingClientRect().bottom + window.scrollY;
    header.classList.toggle('header--compact', wasCompact);
    reserveSpace(wasCompact);
  };

  const updateCompact = () => {
    const compact = window.scrollY > threshold;
    if (compact === header.classList.contains('header--compact')) return;
    close();
    header.classList.toggle('header--compact', compact);
    reserveSpace(compact);
    lockWidths();
  };

  let resizeFrame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      measure();
      lockWidths();
      updateCompact();
    });
  });
  window.addEventListener('scroll', updateCompact, { passive: true });

  measure();
  document.fonts?.ready.then(() => {
    measure();
    lockWidths();
  });
  lockWidths();
  updateCompact();
}
