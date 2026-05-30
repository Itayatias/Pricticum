const API_BASE_URL = 'http://localhost:4000';

const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const cartUserMessage = document.getElementById('cartUserMessage');
const orderHistoryList = document.getElementById('orderHistoryList');

const authUserRaw = localStorage.getItem('authUser');
const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;

function formatMoney(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

function syncHeaderCartCount(items) {
  const totalItems = (items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  document.querySelectorAll('.header-cart-count').forEach((el) => {
    el.textContent = String(totalItems);
  });
}

function updateLoggedOutState() {
  if (!cartUserMessage) return;
  cartUserMessage.className = 'small text-danger mb-3';
  cartUserMessage.textContent = 'צריך להתחבר כדי להוסיף מוצרים לסל ולבצע רכישה.';
  if (checkoutBtn) checkoutBtn.disabled = true;
}

function updateLoggedInState() {
  if (!cartUserMessage || !authUser) return;
  cartUserMessage.className = 'small text-success mb-3';
  cartUserMessage.textContent = `מחובר כ-${authUser.fullName}. אפשר להוסיף לסל ולבצע רכישה.`;
  if (checkoutBtn) checkoutBtn.disabled = false;
}

async function loadCart() {
  if (!authUser || !authUser.id) {
    if (cartItemsList) cartItemsList.innerHTML = '<li class="text-muted">אין פריטים בסל.</li>';
    if (cartTotal) cartTotal.textContent = formatMoney(0);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/${authUser.id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to load cart');
    }

    if (!cartItemsList || !cartTotal) return;

    if (!data.items.length) {
      cartItemsList.innerHTML = '<li class="text-muted">אין פריטים בסל.</li>';
    } else {
      cartItemsList.innerHTML = data.items
        .map(
          (item) =>
            `<li class="mb-2 border-bottom pb-2">
              <div class="d-flex justify-content-between">
                <span>${item.productName}</span>
                <span>${formatMoney(item.price * item.quantity)}</span>
              </div>
              <div class="d-flex align-items-center gap-2 mt-2">
                <button type="button" class="btn btn-outline-secondary btn-sm cart-decrease-btn" data-product-id="${item.productId}" data-quantity="${item.quantity}">-</button>
                <span>x${item.quantity}</span>
                <button type="button" class="btn btn-outline-secondary btn-sm cart-increase-btn" data-product-id="${item.productId}" data-quantity="${item.quantity}">+</button>
                <button type="button" class="btn btn-outline-danger btn-sm ms-auto cart-remove-btn" data-product-id="${item.productId}">מחק</button>
              </div>
            </li>`
        )
        .join('');
    }

    cartTotal.textContent = formatMoney(data.total);
    syncHeaderCartCount(data.items);
    bindCartActionButtons();
  } catch (_err) {
    if (cartItemsList) cartItemsList.innerHTML = '<li class="text-danger">שגיאה בטעינת סל.</li>';
  }
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
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update quantity');
    }

    await loadCart();
  } catch (_err) {
    if (cartUserMessage) {
      cartUserMessage.className = 'small text-danger mb-3';
      cartUserMessage.textContent = 'לא ניתן לעדכן כמות כרגע.';
    }
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
    if (!response.ok) {
      throw new Error(data.message || 'Failed to remove item');
    }

    await loadCart();
  } catch (_err) {
    if (cartUserMessage) {
      cartUserMessage.className = 'small text-danger mb-3';
      cartUserMessage.textContent = 'לא ניתן למחוק פריט כרגע.';
    }
  }
}

function bindCartActionButtons() {
  const increaseButtons = document.querySelectorAll('.cart-increase-btn');
  const decreaseButtons = document.querySelectorAll('.cart-decrease-btn');
  const removeButtons = document.querySelectorAll('.cart-remove-btn');

  increaseButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const currentQuantity = Number(button.dataset.quantity || '1');
      updateCartItemQuantity(button.dataset.productId, currentQuantity + 1);
    });
  });

  decreaseButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const currentQuantity = Number(button.dataset.quantity || '1');
      if (currentQuantity <= 1) {
        removeCartItem(button.dataset.productId);
        return;
      }
      updateCartItemQuantity(button.dataset.productId, currentQuantity - 1);
    });
  });

  removeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      removeCartItem(button.dataset.productId);
    });
  });
}

async function loadOrderHistory() {
  if (!orderHistoryList) return;
  if (!authUser || !authUser.id) {
    orderHistoryList.innerHTML = '<li class="text-muted">התחבר כדי לצפות בהזמנות.</li>';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/${authUser.id}`);
    const orders = await response.json();

    if (!response.ok) {
      throw new Error('Failed to load orders');
    }

    if (!orders.length) {
      orderHistoryList.innerHTML = '<li class="text-muted">אין עדיין הזמנות.</li>';
      return;
    }

    orderHistoryList.innerHTML = orders
      .map((order) => {
        const itemsSummary = order.items
          .map((item) => `${item.productName} x${item.quantity}`)
          .join(', ');
        return `<li class="mb-3 border-bottom pb-2">
          <div class="fw-semibold">#${order.id} - ${formatMoney(order.totalAmount)}</div>
          <div class="text-muted">${new Date(order.createdAt).toLocaleString('he-IL')}</div>
          <div>${itemsSummary}</div>
        </li>`;
      })
      .join('');
  } catch (_err) {
    orderHistoryList.innerHTML = '<li class="text-danger">שגיאה בטעינת הזמנות.</li>';
  }
}

async function addToCart(button) {
  if (!authUser || !authUser.id) {
    window.location.href = './login.html';
    return;
  }

  const payload = {
    userId: authUser.id,
    productId: button.dataset.productId,
    productName: button.dataset.productName,
    price: Number(button.dataset.productPrice),
    quantity: 1,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add product');
    }

    await loadCart();
    await loadOrderHistory();
  } catch (_err) {
    if (cartUserMessage) {
      cartUserMessage.className = 'small text-danger mb-3';
      cartUserMessage.textContent = 'לא ניתן להוסיף לסל כרגע. ודא ששרת ההתחברות רץ.';
    }
  }
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
    if (!response.ok) {
      throw new Error(data.message || 'Checkout failed');
    }

    if (cartUserMessage) {
      cartUserMessage.className = 'small text-success mb-3';
      cartUserMessage.textContent = `הרכישה בוצעה בהצלחה. מספר הזמנה: ${data.order.id}`;
    }

    await loadCart();
  } catch (_err) {
    if (cartUserMessage) {
      cartUserMessage.className = 'small text-danger mb-3';
      cartUserMessage.textContent = 'לא ניתן להשלים רכישה כרגע.';
    }
  }
}

if (!authUser) {
  updateLoggedOutState();
} else {
  updateLoggedInState();
}

addToCartButtons.forEach((button) => {
  button.addEventListener('click', () => addToCart(button));
});

if (checkoutBtn) {
  checkoutBtn.addEventListener('click', checkout);
}

loadCart();
loadOrderHistory();
