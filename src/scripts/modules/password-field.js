// Поле пароля: «показать / скрыть» и «очистить» (src/partials/password-field.html).

export function initPasswordFields() {
  document.querySelectorAll('[data-password-field]').forEach((field) => {
    const input = field.querySelector('input');
    const toggle = field.querySelector('[data-password-toggle]');
    const clear = field.querySelector('[data-password-clear]');

    toggle?.addEventListener('click', () => {
      const shown = input.type === 'text';
      input.type = shown ? 'password' : 'text';
      toggle.setAttribute('aria-pressed', String(!shown));
      toggle.setAttribute('aria-label', shown ? 'Показать пароль' : 'Скрыть пароль');
    });

    clear?.addEventListener('click', () => {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
    });
  });
}
