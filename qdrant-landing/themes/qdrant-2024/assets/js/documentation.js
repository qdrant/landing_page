import ThemeSwitch from './theme-switch.js';

const themeSwitch = new ThemeSwitch();

document.addEventListener('DOMContentLoaded', () => {
  themeSwitch.initSwitcher();
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');

  sidebarToggle.addEventListener('click', () => {
    sidebarToggle.classList.toggle('active');
    sidebar.classList.toggle('active');
  });
});
