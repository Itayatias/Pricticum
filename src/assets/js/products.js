const API_BASE_URL = 'http://localhost:4000';

const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const cartUserMessage = document.getElementById('cartUserMessage');
const orderHistoryList = document.getElementById('orderHistoryList');

const authUserRaw = localStorage.getItem('authUser');
const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
const publicInventory = new Map();

function formatMoney(amount) {
  return `₪ ${Number(amount || 0).toFixed(2)}`;
}

const PRODUCT_CATALOG = [
  { displayName: 'צבע לקיר לבן 18 ליטר', category: 'צבע', color: 'לבן', brand: 'אקווניר', price: 300, oldPrice: 350, productId: 'paint-wall-white-18l', featuredRank: 1 },
  { displayName: 'בלוק בנייה', category: 'חומרי בנייה', color: 'אפור', brand: 'חומרי בנייה', price: 10, oldPrice: 12, productId: 'concrete-block', featuredRank: 2 },
  { displayName: 'צבע בסיס', category: 'צבע', color: 'לבן', brand: 'נירלט', price: 68, oldPrice: 78, productId: 'base-paint', featuredRank: 3 },
  { displayName: 'ברז', category: 'אינסטלציה', color: 'אפור', brand: 'גרואה', price: 120, oldPrice: 150, productId: 'faucet', featuredRank: 4 },
  { displayName: 'דבק סיליקון', category: 'חומרי בנייה', color: 'לבן', brand: 'נירלט', price: 18, oldPrice: 20, productId: 'silicone-adhesive', featuredRank: 5 },
  { displayName: 'חוטי חשמל', category: 'חשמל', color: 'שחור', brand: 'חשמל', price: 5, oldPrice: 10, productId: 'electrical-wire', featuredRank: 6, priceSuffix: '(למטר) ' },
  { displayName: 'כבל מאריך', category: 'חשמל', color: 'לבן', brand: 'חשמל', price: 90, oldPrice: 100, productId: 'extension-cable', featuredRank: 7 },
  { displayName: 'סט מברשות צבע', category: 'צבע', color: 'לבן', brand: 'צבעים', price: 45, oldPrice: 50, productId: 'paint-brush-set', featuredRank: 8 },
  { displayName: 'מלט', category: 'חומרי בנייה', color: 'אפור', brand: 'נשר', price: 80, oldPrice: null, productId: 'cement-bag', featuredRank: 9 },
  { displayName: 'מקדחה חשמלית', category: 'כלי עבודה', color: 'שחור', brand: 'מקיטה', price: 450, oldPrice: 500, productId: 'electric-drill', featuredRank: 10 },
  { displayName: 'נירופלסט', category: 'חומרי בנייה', color: 'לבן', brand: 'נירלט', price: 28, oldPrice: 38, productId: 'niroplast', featuredRank: 11 },
  { displayName: 'סופר 7 - דבק', category: 'חומרי בנייה', color: 'שחור', brand: 'סופר-7', price: 20, oldPrice: null, productId: 'super7-adhesive', featuredRank: 12 },
  { displayName: 'סופר 5 - דבק סיליקון', category: 'חומרי בנייה', color: 'לבן', brand: 'סופר-5', price: 15, oldPrice: null, productId: 'super5-silicone', featuredRank: 13 },
  { displayName: 'סט אינסטלציה', category: 'אינסטלציה', color: 'אפור', brand: 'גרואה', price: 120, oldPrice: 180, productId: 'plumbing-set', featuredRank: 14 },
  { displayName: 'סט ברגים', category: 'כלי עבודה', color: 'שחור', brand: 'ברגים', price: 10, oldPrice: null, productId: 'screw-set', featuredRank: 15 },
  { displayName: 'סט מברגים', category: 'כלי עבודה', color: 'שחור', brand: 'ברגים', price: 90, oldPrice: 100, productId: 'screwdriver-set', featuredRank: 16 },
  { displayName: 'סט שפכטלים', category: 'כלי עבודה', color: 'אפור', brand: 'שפכטל', price: 50, oldPrice: null, productId: 'putty-set', featuredRank: 17 },
  { displayName: 'סיד', category: 'צבע', color: 'לבן', brand: 'נירלט', price: 100, oldPrice: null, productId: 'lime-whitewash', featuredRank: 18 },
  { displayName: 'סיפון', category: 'אינסטלציה', color: 'אפור', brand: 'ספדיני', price: 30, oldPrice: null, productId: 'sink-trap', featuredRank: 19 },
  { displayName: 'פלטת גבס', category: 'חומרי בנייה', color: 'לבן', brand: 'גבס', price: 120, oldPrice: null, productId: 'gypsum-board', featuredRank: 20 },
  { displayName: 'רולר צביעה', category: 'צבע', color: 'כחול', brand: 'צבעים', price: 40, oldPrice: 50, productId: 'paint-roller', featuredRank: 21 },
  { displayName: 'שק חול', category: 'חומרי בנייה', color: 'אפור', brand: 'חומרי בנייה', price: 450, oldPrice: 500, productId: 'sand-bag', featuredRank: 22 },
  { displayName: 'שק חצץ', category: 'חומרי בנייה', color: 'אפור', brand: 'חומרי בנייה', price: 500, oldPrice: null, productId: 'gravel-bag', featuredRank: 23 },
  { displayName: 'ציוד גינה', category: 'גינון', color: 'ירוק', brand: 'גינון', price: 220, oldPrice: 240, productId: 'garden-supplies', featuredRank: 24 },
];

function getPriceBand(price) {
  if (price < 100) return 'low';
  if (price <= 300) return 'mid';
  return 'high';
}

function hydrateProductCards() {
  const cards = Array.from(document.querySelectorAll('#productsGrid .product-card'));

  cards.forEach((card, index) => {
    const meta = PRODUCT_CATALOG[index];
    if (!meta) return;

    const wrapper = card.closest('.col-sm-6, .col-md-4');
    if (wrapper) {
      wrapper.dataset.category = meta.category;
      wrapper.dataset.color = meta.color;
      wrapper.dataset.priceBand = getPriceBand(meta.price);
      wrapper.dataset.price = String(meta.price);
      wrapper.dataset.rank = String(meta.featuredRank);
      wrapper.dataset.name = meta.displayName;
    }

    const title = card.querySelector('h3');
    if (title) {
      title.textContent = meta.displayName;
    }

    const brandLabel = card.querySelector('.card-body > p.text-muted');
    if (brandLabel) {
      brandLabel.textContent = meta.category;
    }

    const priceRow = card.querySelector('.mb-3 > div');
    if (priceRow) {
      if (meta.oldPrice) {
        priceRow.innerHTML = `<span class="fw-semibold text-decoration-line-through">${formatMoney(meta.oldPrice)}</span><span class="">${meta.priceSuffix || ''}${formatMoney(meta.price)}</span>`;
      } else {
        priceRow.innerHTML = `<span class="">${meta.priceSuffix || ''}${formatMoney(meta.price)}</span>`;
      }
    }

    const button = card.querySelector('.add-to-cart-btn');
    if (button) {
      button.dataset.productId = meta.productId;
      button.dataset.productName = meta.displayName;
      button.dataset.productPrice = String(meta.price);
    }
  });

  cards.forEach((card) => {
    const title = card.querySelector('h3');
    if (!title) return;
    // Remove leftover anchors from any card that still contains them.
    const anchor = title.querySelector('a');
    if (anchor) {
      title.textContent = anchor.textContent.trim();
    }
  });
}

function applyInventoryBadges() {
  const cards = Array.from(document.querySelectorAll('#productsGrid .product-card'));

  cards.forEach((card) => {
    const button = card.querySelector('.add-to-cart-btn');
    const productId = button?.dataset.productId;
    if (!productId) return;

    const stock = publicInventory.get(productId);
    const title = card.querySelector('.mb-3');
    let badge = card.querySelector('.inventory-badge');

    if (!badge && title) {
      badge = document.createElement('span');
      badge.className = 'inventory-badge badge rounded-pill mt-2';
      title.appendChild(badge);
    }

    if (typeof stock !== 'number') {
      if (badge) badge.textContent = 'מידע מלאי יטען בקרוב';
      return;
    }

    if (stock <= 0) {
      if (badge) {
        badge.className = 'inventory-badge badge rounded-pill bg-danger mt-2';
        badge.textContent = 'אזל מהמלאי';
      }
      if (button) {
        button.disabled = true;
        button.textContent = 'אזל מהמלאי';
      }
      return;
    }

    if (badge) {
      badge.className = `inventory-badge badge rounded-pill mt-2 ${stock <= 5 ? 'bg-warning text-dark' : 'bg-success'}`;
      badge.textContent = stock <= 5 ? `מלאי מוגבל · ${stock} יחידות` : `במלאי · ${stock} יחידות`;
    }

    if (button) {
      button.disabled = false;
      button.textContent = 'הוסף לסל';
    }
  });
}

async function loadPublicInventory() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/inventory/public`);
    const items = await response.json();
    if (!response.ok) return;

    publicInventory.clear();
    items.forEach((item) => {
      publicInventory.set(item.productId, Number(item.stock || 0));
    });
    applyInventoryBadges();
  } catch (_err) {
    // If inventory data fails to load we keep the product grid usable.
  }
}

function getActiveFilterValues(selector) {
  return Array.from(document.querySelectorAll(selector))
    .filter((input) => input.checked)
    .map((input) => input.value);
}

function sortWrappers(wrappers, sortValue) {
  const items = [...wrappers];

  switch (sortValue) {
    case 'מחיר - מהנמוך לגבוה':
      return items.sort((a, b) => Number(a.dataset.price || 0) - Number(b.dataset.price || 0));
    case 'מחיר - מהגבוה לנמוך':
      return items.sort((a, b) => Number(b.dataset.price || 0) - Number(a.dataset.price || 0));
    case 'לפי א״ב - עולה':
      return items.sort((a, b) => (a.dataset.name || '').localeCompare(b.dataset.name || '', 'he'));
    case 'לפי א״ב - יורד':
      return items.sort((a, b) => (b.dataset.name || '').localeCompare(a.dataset.name || '', 'he'));
    case 'נמכרים ביותר':
      return items.sort((a, b) => Number(a.dataset.rank || 0) - Number(b.dataset.rank || 0));
    default:
      return items.sort((a, b) => Number(a.dataset.rank || 0) - Number(b.dataset.rank || 0));
  }
}

function applyProductFilters() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const wrappers = Array.from(grid.querySelectorAll(':scope > .col-sm-6.col-md-4'));
  const categories = getActiveFilterValues('.filter-category');
  const prices = getActiveFilterValues('.filter-price');
  const colors = getActiveFilterValues('.filter-color');
  const sortValue = document.getElementById('sortSelect')?.value || 'מיון: מומלצים';

  const filtered = wrappers.filter((wrapper) => {
    const categoryMatch = !categories.length || categories.includes(wrapper.dataset.category);
    const priceMatch = !prices.length || prices.includes(wrapper.dataset.priceBand);
    const colorMatch = !colors.length || colors.includes(wrapper.dataset.color);
    return categoryMatch && priceMatch && colorMatch;
  });

  const sorted = sortWrappers(filtered, sortValue);
  const controlBlock = grid.querySelector(':scope > .col-12');
  sorted.forEach((wrapper) => {
    wrapper.classList.remove('d-none');
    grid.appendChild(wrapper);
  });

  wrappers
    .filter((wrapper) => !filtered.includes(wrapper))
    .forEach((wrapper) => {
      wrapper.classList.add('d-none');
      grid.appendChild(wrapper);
    });

  if (controlBlock) {
    grid.insertBefore(controlBlock, grid.firstChild);
  }
}

function bindFilterControls() {
  const applyBtn = document.getElementById('applyFiltersBtn');
  const sortSelect = document.getElementById('sortSelect');
  const filters = document.querySelectorAll('.filter-category, .filter-price, .filter-color');

  applyBtn?.addEventListener('click', applyProductFilters);
  sortSelect?.addEventListener('change', applyProductFilters);
  filters.forEach((input) => input.addEventListener('change', applyProductFilters));
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
    await loadPublicInventory();
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

hydrateProductCards();
bindFilterControls();
applyProductFilters();
loadPublicInventory();

addToCartButtons.forEach((button) => {
  button.addEventListener('click', () => addToCart(button));
});

if (checkoutBtn) {
  checkoutBtn.addEventListener('click', checkout);
}

loadCart();
loadOrderHistory();
