// Шапка: выпадающие меню (наведение, фокус, Esc) и компактный режим после прокрутки.
// Планшет и мобильная версия (<1280): меню открывается кнопкой «Каталог» нижнего таб-бара,
// категории переключаются нажатием; шапка в потоке закреплена через position: sticky (CSS).

const OPEN_DELAY = 80; // мс — чтобы меню не мигало, когда курсор просто проходит над пунктами
const CLOSE_DELAY = 200;
const touchLayout = window.matchMedia('(max-width: 1279.98px)');

export function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  const overlay = document.querySelector('[data-page-overlay]');
  const catalogToggle = document.querySelector('[data-catalog-toggle]');
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

  // ---------- Меню категорий на планшете и мобильной (кнопка «Каталог» в таб-баре) ----------

  const catalogOpen = () => header.classList.contains('header--catalog-open');

  // Панель меню начинается сразу под шапкой (над шапкой может быть полоса объявления)
  const placeCatalog = () => {
    const top = Math.max(0, header.getBoundingClientRect().bottom);
    header.style.setProperty('--header-nav-top', `${top}px`);
  };

  const showItem = (item) => {
    open(item);
    item.querySelector('[data-menu-link]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  const openCatalog = () => {
    header.classList.add('header--catalog-open');
    document.documentElement.classList.add('is-catalog-open');
    catalogToggle?.setAttribute('aria-expanded', 'true');
    placeCatalog();
    showItem(items[0]);
    lockWidths();
  };

  const closeCatalog = ({ restoreFocus = false } = {}) => {
    if (!catalogOpen()) return;
    close();
    header.classList.remove('header--catalog-open');
    document.documentElement.classList.remove('is-catalog-open');
    catalogToggle?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) catalogToggle?.focus();
  };

  catalogToggle?.addEventListener('click', () => (catalogOpen() ? closeCatalog() : openCatalog()));

  touchLayout.addEventListener('change', () => {
    closeCatalog();
    close();
  });

  // ---------- Наведение и фокус ----------

  items.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      if (touchLayout.matches) return;
      clearTimeout(closeTimer);
      clearTimeout(openTimer);
      openTimer = setTimeout(() => open(item), current ? 0 : OPEN_DELAY);
    });
    item.addEventListener('focusin', () => {
      if (touchLayout.matches && !catalogOpen()) return;
      clearTimeout(closeTimer);
      open(item);
    });
    // На планшете и мобильной нажатие на категорию переключает панель, а не ведёт по ссылке
    item.querySelector('[data-menu-link]')?.addEventListener('click', (event) => {
      if (!touchLayout.matches) return;
      event.preventDefault();
      showItem(item);
    });
  });

  // Пункты без выпадающего меню и остальные элементы шапки закрывают меню
  header.querySelectorAll('.header__menu-item:not([data-menu-item]), .header__top').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      if (touchLayout.matches) return;
      clearTimeout(openTimer);
      closeTimer = setTimeout(close, CLOSE_DELAY);
    });
  });

  header.addEventListener('mouseleave', () => {
    if (touchLayout.matches) return;
    clearTimeout(openTimer);
    closeTimer = setTimeout(close, CLOSE_DELAY);
  });

  header.addEventListener('focusout', (event) => {
    if (touchLayout.matches) return;
    if (!header.contains(event.relatedTarget)) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (catalogOpen()) {
      closeCatalog({ restoreFocus: true });
      return;
    }
    if (!current) return;
    const link = current.querySelector('[data-menu-link]');
    close();
    link?.focus();
  });

  overlay?.addEventListener('click', () => (catalogOpen() ? closeCatalog() : close()));

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
    // На планшете и мобильной шапка в потоке закреплена через sticky — компактный режим нужен только прозрачной
    const compact = window.scrollY > threshold && !(touchLayout.matches && inFlow);
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
      if (catalogOpen()) placeCatalog();
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
