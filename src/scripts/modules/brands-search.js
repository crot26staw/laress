// Страница «Все бренды»: фильтр списка по введённому тексту (без запросов к серверу).

export function initBrandsSearch() {
  const input = document.querySelector('[data-brands-search]');
  const list = document.querySelector('[data-brands-list]');
  if (!input || !list) return;

  const groups = [...list.querySelectorAll('[data-brands-group]')];
  const empty = document.querySelector('[data-brands-empty]');

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    let found = 0;
    groups.forEach((group) => {
      let visible = 0;
      group.querySelectorAll('li').forEach((item) => {
        const match = item.textContent.toLowerCase().includes(query);
        item.hidden = !match;
        if (match) visible++;
      });
      group.hidden = visible === 0;
      found += visible;
    });
    if (empty) empty.hidden = found > 0;
  });
}
