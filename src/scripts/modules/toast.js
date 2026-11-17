// Уведомление (src/partials/toast.html): закрытие крестиком.

export function initToasts() {
  document.querySelectorAll('[data-toast]').forEach((toast) => {
    toast.querySelector('[data-toast-close]')?.addEventListener('click', () => {
      toast.hidden = true;
    });
  });
}
