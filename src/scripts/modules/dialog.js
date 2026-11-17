// Диалоги на нативном <dialog>: боковые панели (.drawer) и модалки (.modal).
// Фокус внутри и закрытие по Esc — средствами браузера.
// Открытие: кнопка [data-dialog-open="<id диалога>"]. Закрытие: [data-dialog-close], клик по затемнению
// (вне [data-dialog-panel]; если его нет — вне самого <dialog>).

const isInside = (element, event) => {
  const rect = element.getBoundingClientRect();
  return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
};

export function initDialogs() {
  document.querySelectorAll('[data-dialog-open]').forEach((button) => {
    const dialog = document.getElementById(button.dataset.dialogOpen);
    if (!dialog) return;

    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
      dialog.showModal();
      button.setAttribute('aria-expanded', 'true');
    });
    dialog.addEventListener('close', () => button.setAttribute('aria-expanded', 'false'));
  });

  document.querySelectorAll('dialog.drawer, dialog.modal').forEach((dialog) => {
    dialog.querySelectorAll('[data-dialog-close]').forEach((button) => button.addEventListener('click', () => dialog.close()));

    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const panel = dialog.querySelector('[data-dialog-panel]') ?? dialog;
      if (!isInside(panel, event)) dialog.close();
    });
  });
}
