
import { Tooltip } from 'bootstrap';

// Custom JS
document.addEventListener('DOMContentLoaded', () => {
  const tooltipTriggers = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipTriggers.forEach((el) => {
    new Tooltip(el);
  });

  console.log('Bootstrap + Vite setup is ready!');
});
