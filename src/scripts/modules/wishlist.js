// Сердечко «в избранное» на карточке и окно «Добавление в избранное» (src/partials/favorites-modal.html).
// Не отмечено → открывает окно; «Добавить» в строке подборки отмечает сердечко и закрывает окно.
// Отмечено → снимает отметку. Сохранение на сервере и список подборок пользователя добавит WordPress.
const WISHLIST = '.product-card__wishlist, .product-preview__wishlist';

const setPressed = (button, pressed) => {
  button.setAttribute('aria-pressed', String(pressed));
  button.setAttribute('aria-label', pressed ? 'Убрать из избранного' : 'Добавить в избранное');
};

export function initWishlist() {
  const dialog = document.getElementById('favorites-modal');
  let current = null; // сердечко, которым открыто окно

  document.addEventListener('click', (event) => {
    const button = event.target.closest(WISHLIST);
    if (!button) return;
    const pressed = button.getAttribute('aria-pressed') === 'true';
    if (pressed || !dialog) {
      setPressed(button, !pressed);
      return;
    }
    current = button;
    dialog.showModal();
  });

  if (!dialog) return;

  const list = dialog.querySelector('[data-favorites-list]');
  const listView = dialog.querySelector('[data-favorites-view="list"]');
  const form = dialog.querySelector('[data-favorites-view="create"]');
  const showView = (view) => {
    listView.hidden = view !== listView;
    form.hidden = view !== form;
  };

  dialog.addEventListener('click', (event) => {
    if (event.target.closest('[data-favorites-add]')) {
      if (current) setPressed(current, true);
      dialog.close();
    } else if (event.target.closest('[data-favorites-create]')) {
      showView(form);
      form.elements['collection-name'].focus();
    } else if (event.target.closest('[data-favorites-back]')) {
      showView(listView);
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = form.elements['collection-name'].value.trim();
    if (!name) return;
    const item = list.lastElementChild.cloneNode(true);
    item.querySelector('.favorites-modal__name').textContent = name;
    item.querySelector('[data-favorites-add]').setAttribute('aria-label', `Добавить в подборку «${name}»`);
    list.append(item);
    form.reset();
    showView(listView);
  });

  dialog.addEventListener('close', () => {
    showView(listView);
    form.reset();
    current?.focus();
    current = null;
  });
}
