document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.querySelector('.sidebar');
  let isResizing = false;

  sidebar.addEventListener('mousedown', function (e) {
    if (e.offsetX > sidebar.clientWidth - 10) {
      isResizing = true;
      document.body.style.cursor = 'ew-resize';
    }
  });

  document.addEventListener('mousemove', function (e) {
    if (isResizing) {
      const newWidth = e.clientX;
      sidebar.style.width = `${newWidth}px`;
    }
  });

  document.addEventListener('mouseup', function () {
    isResizing = false;
    document.body.style.cursor = 'default';
  });

  const docHeader = document.querySelector('.sidebar h1');
  const sidebarContent = document.querySelector('.sidebar ul');
  const darkModeButton = document.getElementById('darkModeToggle');

  if (docHeader && sidebarContent) {
    docHeader.style.cursor = 'pointer';
    docHeader.title = "Cliquer pour réduire/développer";

    docHeader.addEventListener('click', () => {
      const isHidden = sidebarContent.classList.toggle('hidden');
      darkModeButton.classList.toggle('hidden', isHidden);
      localStorage.setItem('sidebar-collapsed', isHidden);
    });

    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    if (isCollapsed) {
      sidebarContent.classList.add('hidden');
      darkModeButton.classList.add('hidden');
    }
  }

  document.querySelectorAll(".route").forEach(route => {
    route.addEventListener("click", () => {
      const details = route.querySelector('.details');
      if (details) details.classList.toggle("hidden");
    });
  });

  document.querySelectorAll(".sidebar li").forEach(item => {
    item.addEventListener("click", () => {
      const targetId = item.dataset.path.replace(/\//g, '_').replace(/:/g, '_');
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
        targetElement.classList.remove('hidden');
      }
    });
  });

  const darkModeToggle = document.getElementById('darkModeToggle');
  let isDarkMode = localStorage.getItem('dark-mode') === 'enabled';

  const updateDarkMode = () => {
    document.body.classList.toggle('dark', isDarkMode);
    darkModeToggle.textContent = isDarkMode ? '☀️ Mode Clair' : '🌙 Mode Sombre';
    localStorage.setItem('dark-mode', isDarkMode ? 'enabled' : 'disabled');
  };

  darkModeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    updateDarkMode();
  });

  updateDarkMode();

  const toggleButton = document.getElementById('toggleSidebar');
  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      document.querySelector('.sidebar')?.classList.toggle('active');
    });
  }
});
