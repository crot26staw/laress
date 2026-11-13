// Поиск: панель сверху с затемнением, кнопка очистки, подсказки по введённому тексту.
// Подсказки в разметке статичные; в WordPress список будет приходить AJAX-ом, логика показа та же.

export function initSearch() {
  const panel = document.querySelector('[data-search]');
  const overlay = document.querySelector('[data-page-overlay]');
  const openButtons = document.querySelectorAll('[data-search-open]');
  if (!panel) return;

  const input = panel.querySelector('[data-search-input]');
  const clear = panel.querySelector('[data-search-clear]');
  const closeButton = panel.querySelector('[data-search-close]');
  const items = [...panel.querySelectorAll('[data-search-suggestions] li')];
  const texts = items.map((li) => li.textContent.trim());
  let opener = null;

  const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const update = () => {
    const query = input.value.trim().toLowerCase();
    let visible = 0;
    items.forEach((li, i) => {
      const text = texts[i];
      const index = query ? text.toLowerCase().indexOf(query) : -1;
      li.hidden = index < 0;
      if (index < 0) return;
      visible++;
      const link = li.querySelector('.search__suggestion');
      link.innerHTML =
        escape(text.slice(0, index)) +
        `<span class="search__match">${escape(text.slice(index, index + query.length))}</span>` +
        escape(text.slice(index + query.length));
    });
    panel.classList.toggle('search--filled', input.value.length > 0);
    panel.classList.toggle('search--has-suggestions', visible > 0);
  };

  const open = (button) => {
    opener = button;
    panel.hidden = false;
    overlay?.classList.add('page-overlay--visible');
    openButtons.forEach((b) => b.setAttribute('aria-expanded', 'true'));
    input.focus();
  };

  const close = () => {
    if (panel.hidden) return;
    panel.hidden = true;
    overlay?.classList.remove('page-overlay--visible');
    openButtons.forEach((b) => b.setAttribute('aria-expanded', 'false'));
    opener?.focus();
  };

  openButtons.forEach((button) => button.addEventListener('click', () => open(button)));
  closeButton?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  input.addEventListener('input', update);
  clear?.addEventListener('click', () => {
    input.value = '';
    update();
    input.focus();
  });

  update();
}
