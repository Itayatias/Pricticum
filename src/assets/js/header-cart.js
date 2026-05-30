const API_BASE_URL = 'http://localhost:4000';

async function loadHeaderCartCount() {
  const countElements = document.querySelectorAll('.header-cart-count');
  const cartLinks = document.querySelectorAll('.header-cart-link');
  const authUserRaw = localStorage.getItem('authUser');
  const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;

  if (!countElements.length || !cartLinks.length) return;

  if (!authUser || !authUser.id) {
    countElements.forEach((el) => {
      el.textContent = '0';
    });
    cartLinks.forEach((link) => {
      link.setAttribute('title', 'יש להתחבר כדי לנהל את סל הקניות');
    });
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/${authUser.id}`);
    const data = await response.json();
    if (!response.ok) throw new Error('Failed to load cart');

    const itemCount = (data.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    countElements.forEach((el) => {
      el.textContent = String(itemCount);
    });

    cartLinks.forEach((link) => {
      link.setAttribute('title', `יש לך ${itemCount} פריטים בסל`);
    });
  } catch (_err) {
    countElements.forEach((el) => {
      el.textContent = '0';
    });
  }
}

document.addEventListener('DOMContentLoaded', loadHeaderCartCount);
