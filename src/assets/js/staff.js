const API_BASE_URL = 'http://localhost:4000';

const authUserRaw = localStorage.getItem('authUser');
const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;

const staffUserLine = document.getElementById('staffUserLine');
const staffStatus = document.getElementById('staffStatus');
const inventoryTableBody = document.getElementById('inventoryTableBody');
const inventoryMovementsList = document.getElementById('inventoryMovementsList');
const staffSkuCount = document.getElementById('staffSkuCount');
const staffLowStockCount = document.getElementById('staffLowStockCount');
const staffOutOfStockCount = document.getElementById('staffOutOfStockCount');
const managerPanel = document.getElementById('managerPanel');

function setStatus(message, type = 'info') {
  if (!staffStatus) return;
  staffStatus.className = `alert alert-${type} mb-4`;
  staffStatus.textContent = message;
  staffStatus.classList.remove('d-none');
}

function clearStatus() {
  if (!staffStatus) return;
  staffStatus.classList.add('d-none');
  staffStatus.textContent = '';
}

function formatStockStatus(stock, minStock) {
  if (stock <= 0) return { label: 'אזל', className: 'badge bg-danger' };
  if (stock <= minStock) return { label: 'מלאי נמוך', className: 'badge bg-warning text-dark' };
  return { label: 'תקין', className: 'badge bg-success' };
}

function requireStaff() {
  if (!authUser || !['employee', 'manager'].includes(authUser.role)) {
    window.location.href = './login.html';
    return false;
  }
  return true;
}

function renderSummary(items) {
  if (staffSkuCount) staffSkuCount.textContent = String(items.length);
  if (staffLowStockCount) staffLowStockCount.textContent = String(items.filter((item) => item.stock > 0 && item.stock <= item.min_stock).length);
  if (staffOutOfStockCount) staffOutOfStockCount.textContent = String(items.filter((item) => item.stock <= 0).length);
}

function bindInventoryButtons() {
  document.querySelectorAll('[data-adjust-stock]').forEach((button) => {
    button.addEventListener('click', () => {
      const delta = Number(button.dataset.adjustStock);
      adjustStock(button.dataset.productId, delta);
    });
  });
}

function renderInventory(items) {
  if (!inventoryTableBody) return;

  inventoryTableBody.innerHTML = items
    .map((item) => {
      const stockStatus = formatStockStatus(item.stock, item.min_stock);
      return `
        <tr>
          <td>
            <div class="fw-semibold">${item.productName}</div>
            <div class="text-muted small">מיקום: ${item.location}</div>
          </td>
          <td>${item.category}</td>
          <td><span class="fw-semibold">${item.stock}</span></td>
          <td>${item.min_stock}</td>
          <td><span class="${stockStatus.className}">${stockStatus.label}</span></td>
          <td>
            <div class="d-flex gap-2 flex-wrap">
              <button type="button" class="btn btn-outline-secondary btn-sm" data-adjust-stock="+5" data-product-id="${item.productId}">+5</button>
              <button type="button" class="btn btn-outline-secondary btn-sm" data-adjust-stock="-5" data-product-id="${item.productId}">-5</button>
              <button type="button" class="btn btn-dark btn-sm" data-adjust-stock="+1" data-product-id="${item.productId}">+1</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  renderSummary(items);
  bindInventoryButtons();
}

function renderMovements(movements) {
  if (!inventoryMovementsList) return;

  if (!movements.length) {
    inventoryMovementsList.innerHTML = '<li class="text-muted">אין עדיין תנועות מלאי.</li>';
    return;
  }

  inventoryMovementsList.innerHTML = movements
    .map(
      (movement) => `
        <li class="border-bottom pb-2 mb-2">
          <div class="d-flex justify-content-between gap-2">
            <span class="fw-semibold">${movement.productId}</span>
            <span class="${movement.delta > 0 ? 'text-success' : 'text-danger'}">${movement.delta > 0 ? '+' : ''}${movement.delta}</span>
          </div>
          <div class="text-muted small">${movement.reason}</div>
          <div class="text-muted small">${new Date(movement.createdAt).toLocaleString('he-IL')}</div>
        </li>
      `
    )
    .join('');
}

async function loadInventory() {
  const response = await fetch(`${API_BASE_URL}/api/inventory?userId=${authUser.id}`);
  const items = await response.json();
  if (!response.ok) {
    throw new Error(items.message || 'Failed to load inventory');
  }
  renderInventory(items);
}

async function loadMovements() {
  const response = await fetch(`${API_BASE_URL}/api/inventory/movements?userId=${authUser.id}`);
  const movements = await response.json();
  if (!response.ok) {
    throw new Error(movements.message || 'Failed to load movements');
  }
  renderMovements(movements);
}

async function adjustStock(productId, delta) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: authUser.id,
        productId,
        delta,
        reason: 'עדכון מלאי מהמערכת',
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update inventory');
    }

    clearStatus();
    await refreshStaffData();
  } catch (_err) {
    setStatus('לא ניתן לעדכן מלאי כרגע.', 'danger');
  }
}

async function refreshStaffData() {
  await loadInventory();
  await loadMovements();
}

function init() {
  if (!requireStaff()) return;

  if (staffUserLine) {
    const roleLabel = authUser.role === 'manager' ? 'מנהל חנות' : 'עובד חנות';
    staffUserLine.textContent = `מחובר כ-${authUser.fullName} · ${roleLabel}`;
  }

  if (managerPanel && authUser.role === 'manager') {
    managerPanel.classList.remove('d-none');
  }

  setStatus('כאן אפשר לעדכן מלאי, לעקוב אחרי תנועות ולהמשיך להרחיב את שכבת הניהול.', 'info');

  refreshStaffData().catch(() => {
    setStatus('שגיאה בטעינת נתוני המלאי. ודא שהשרת רץ ושהמשתמש הוא עובד/מנהל.', 'danger');
  });
}

init();
