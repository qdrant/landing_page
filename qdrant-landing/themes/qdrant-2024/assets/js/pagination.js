(() => {
  const paginationMenus = document.querySelectorAll('.pagination__pages-menu');
  if (!paginationMenus.length) return;

  paginationMenus.forEach((menu) => {
    menu.addEventListener('toggle', () => {
      if (!menu.open) return;
      paginationMenus.forEach((other) => {
        if (other !== menu) other.removeAttribute('open');
      });
    });
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.pagination__pages-menu')) return;
    paginationMenus.forEach((menu) => menu.removeAttribute('open'));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    paginationMenus.forEach((menu) => menu.removeAttribute('open'));
  });
})();
