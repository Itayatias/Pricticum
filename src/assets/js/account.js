const API_BASE_URL = 'http://localhost:4000';

const authUserRaw = localStorage.getItem('authUser');
const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;

const accountUserLine = document.getElementById('accountUserLine');
const accountStatus = document.getElementById('accountStatus');
const accountCartItemsList = document.getElementById('accountCartItemsList');
const accountCartTotalSummary = document.getElementById('accountCartTotalSummary');
const accountCartCount = document.getElementById('accountCartCount');
const accountOrdersCount = document.getElementById('accountOrdersCount');
const accountOrdersList = document.getElementById('accountOrdersList');
const accountCheckoutBtn = document.getElementById('accountCheckoutBtn');

function formatMoney(amount) {
  return `₪ ${Number(amount || 0).toFixed(2)}`;
}

function setStatus(message, type = 'info') {
  if (!accountStatus) return;
  accountStatus.className = `alert alert-${type} mb-4`;
  accountStatus.textContent = message;
  accountStatus.classList.remove('d-none');
}

function clearStatus() {
  if (!accountStatus) return;
  accountStatus.classList.add('d-none');
  accountStatus.textContent = '';
}

function syncHeaderCartCount(items) {
  const totalItems = (items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  document.querySelectorAll('.header-cart-count').forEach((el) => {
    el.textContent = String(totalItems);
  });
}

function updateLoggedOutView() {
  if (accountUserLine) {
    accountUserLine.textContent = 'כדי לצפות בסל ובהיסטוריית ההזמנות יש להתחבר למערכת.';
  }

  if (accountCartItemsList) {
    accountCartItemsList.innerHTML = `
      <li class="text-muted">אין גישה לסל ללא התחברות.</li>
    `;
  }

  if (accountOrdersList) {
    accountOrdersList.innerHTML = `
      <li class="text-muted">אין גישה להיסטוריית הזמנות ללא התחברות.</li>
    `;
  }

  if (accountCartTotalSummary) accountCartTotalSummary.textContent = formatMoney(0);
  if (accountCartCount) accountCartCount.textContent = '0';
  if (accountOrdersCount) accountOrdersCount.textContent = '0';
  if (accountCheckoutBtn) accountCheckoutBtn.disabled = true;
  setStatus('כדי לנהל סל והזמנות יש להתחבר למערכת.', 'warning');
}

function bindCartButtons() {
  document.querySelectorAll('.account-cart-increase').forEach((button) => {
    button.addEventListener('click', () => {
      const quantity = Number(button.dataset.quantity || '1');
      updateCartItemQuantity(button.dataset.productId, quantity + 1);
    });
  });

  document.querySelectorAll('.account-cart-decrease').forEach((button) => {
    button.addEventListener('click', () => {
      const quantity = Number(button.dataset.quantity || '1');
      if (quantity <= 1) {
        removeCartItem(button.dataset.productId);
        return;
      }
      updateCartItemQuantity(button.dataset.productId, quantity - 1);
    });
  });

  document.querySelectorAll('.account-cart-remove').forEach((button) => {
    button.addEventListener('click', () => {
      removeCartItem(button.dataset.productId);
    });
  });
}

async function loadCart() {
  if (!authUser || !authUser.id) {
    updateLoggedOutView();
    return { items: [], total: 0 };
  }

  const response = await fetch(`${API_BASE_URL}/api/cart/${authUser.id}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load cart');
  }

  const items = data.items || [];
  const total = Number(data.total || 0);

  if (accountCartItemsList) {
    if (!items.length) {
      accountCartItemsList.innerHTML = '<li class="text-muted">הסל ריק כרגע.</li>';
    } else {
      accountCartItemsList.innerHTML = items
        .map((item) => `
          <li class="border-bottom pb-3 mb-3">
            <div class="d-flex justify-content-between gap-3">
              <div>
                <div class="fw-semibold">${item.productName}</div>
                <div class="text-muted small">${formatMoney(item.price)} ליחידה</div>
              </div>
              <div class="fw-semibold">${formatMoney(item.price * item.quantity)}</div>
            </div>
            <div class="d-flex align-items-center gap-2 mt-3 flex-wrap">
              <button type="button" class="btn btn-outline-secondary btn-sm account-cart-decrease" data-product-id="${item.productId}" data-quantity="${item.quantity}">-</button>
              <span class="px-2">כמות: ${item.quantity}</span>
              <button type="button" class="btn btn-outline-secondary btn-sm account-cart-increase" data-product-id="${item.productId}" data-quantity="${item.quantity}">+</button>
              <button type="button" class="btn btn-outline-danger btn-sm me-auto account-cart-remove" data-product-id="${item.productId}">הסר</button>
            </div>
          </li>
        `)
        .join('');
    }
  }

  if (accountCartTotalSummary) accountCartTotalSummary.textContent = formatMoney(total);
  if (accountCartCount) {
    accountCartCount.textContent = String(items.reduce((sum, item) => sum + Number(item.quantity || 0), 0));
  }

  syncHeaderCartCount(items);
  bindCartButtons();
  return { items, total };
}

async function updateCartItemQuantity(productId, quantity) {
  if (!authUser || !authUser.id) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/update-quantity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authUser.id, productId, quantity }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update quantity');

    clearStatus();
    await refreshAccountData();
  } catch (_err) {
    setStatus('לא ניתן לעדכן כמות כרגע.', 'danger');
  }
}

async function removeCartItem(productId) {
  if (!authUser || !authUser.id) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authUser.id, productId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to remove item');

    clearStatus();
    await refreshAccountData();
  } catch (_err) {
    setStatus('לא ניתן להסיר פריט כרגע.', 'danger');
  }
}

async function loadOrders() {
  if (!authUser || !authUser.id) {
    if (accountOrdersList) {
      accountOrdersList.innerHTML = '<li class="text-muted">התחבר כדי לצפות בהזמנות.</li>';
    }
    if (accountOrdersCount) accountOrdersCount.textContent = '0';
    return [];
  }

  const response = await fetch(`${API_BASE_URL}/api/orders/${authUser.id}`);
  const orders = await response.json();

  if (!response.ok) {
    throw new Error('Failed to load orders');
  }

  if (accountOrdersCount) accountOrdersCount.textContent = String(orders.length);

  if (accountOrdersList) {
    if (!orders.length) {
      accountOrdersList.innerHTML = '<li class="text-muted">אין עדיין הזמנות.</li>';
    } else {
      accountOrdersList.innerHTML = orders
        .map((order) => {
          const itemsSummary = order.items
            .map((item) => `${item.productName} x${item.quantity}`)
            .join(' · ');
          return `
            <li class="border-bottom pb-3 mb-3">
              <div class="d-flex justify-content-between gap-3">
                <div class="fw-semibold">הזמנה #${order.id}</div>
                <div class="fw-semibold">${formatMoney(order.totalAmount)}</div>
              </div>
              <div class="text-muted small mb-2">${new Date(order.createdAt).toLocaleString('he-IL')}</div>
              <div>${itemsSummary}</div>
            </li>
          `;
        })
        .join('');
    }
  }

  return orders;
}

async function checkout() {
  if (!authUser || !authUser.id) {
    window.location.href = './login.html';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authUser.id }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Checkout failed');

    setStatus(`הרכישה בוצעה בהצלחה. מספר הזמנה: ${data.order.id}`, 'success');
    await refreshAccountData();
  } catch (_err) {
    setStatus('לא ניתן להשלים רכישה כרגע.', 'danger');
  }
}

async function refreshAccountData() {
  const cart = await loadCart();
  await loadOrders();
  if (accountCheckoutBtn) {
    accountCheckoutBtn.disabled = !cart.items.length;
  }
}

function initPage() {
  if (!authUser || !authUser.fullName) {
    updateLoggedOutView();
    return;
  }

  if (accountUserLine) {
    accountUserLine.textContent = `מחובר כ-${authUser.fullName}${authUser.email ? ` · ${authUser.email}` : ''}`;
  }

  if (accountCheckoutBtn) {
    accountCheckoutBtn.addEventListener('click', checkout);
  }

  setStatus('כאן אפשר לנהל את הסל וההזמנות שלך במקום אחד.', 'info');
  refreshAccountData().catch(() => {
    setStatus('שגיאה בטעינת נתוני האזור האישי. ודא שהשרת רץ.', 'danger');
  });
}

initPage();
