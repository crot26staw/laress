// Полоса объявления: закрытие по крестику.
export function initAnnouncement() {
  const banner = document.querySelector('[data-announcement]');
  if (!banner) return;

  const close = banner.querySelector('[data-announcement-close]');
  close?.addEventListener('click', () => {
    banner.hidden = true;
  });
}
