const API_BASE_URL = 'http://localhost:4000';

const authUserRaw = localStorage.getItem('authUser');
const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;

const managerUserLine = document.getElementById('managerUserLine');
const managerStatus = document.getElementById('managerStatus');
const managerTotalUsers = document.getElementById('managerTotalUsers');
const managerTotalOrders = document.getElementById('managerTotalOrders');
const managerTotalRevenue = document.getElementById('managerTotalRevenue');
const managerLowStock = document.getElementById('managerLowStock');
const managerCustomers = document.getElementById('managerCustomers');
const managerEmployees = document.getElementById('managerEmployees');
const managerManagers = document.getElementById('managerManagers');
const managerRecentOrders = document.getElementById('managerRecentOrders');
const managerCriticalStock = document.getElementById('managerCriticalStock');
const managerUsersTable = document.getElementById('managerUsersTable');

function setStatus(message, type = 'info') {
  if (!managerStatus) return;
  managerStatus.className = `alert alert-${type} mb-4`;
  managerStatus.textContent = message;
  managerStatus.classList.remove('d-none');
}

function clearStatus() {
  if (!managerStatus) return;
  managerStatus.classList.add('d-none');
  managerStatus.textContent = '';
}

function formatMoney(amount) {
  return `₪ ${Number(amount || 0).toFixed(2)}`;
}

function requireManager() {
  if (!authUser || authUser.role !== 'manager') {
    window.location.href = './login.html';
    return false;
  }
  return true;
}

function renderDashboard(data) {
  if (managerTotalUsers) managerTotalUsers.textContent = String(data.users?.totalUsers || 0);
  if (managerTotalOrders) managerTotalOrders.textContent = String(data.orders?.totalOrders || 0);
  if (managerTotalRevenue) managerTotalRevenue.textContent = formatMoney(data.orders?.totalRevenue || 0);
  if (managerLowStock) {
    managerLowStock.textContent = String(data.inventory?.lowStockCount || 0);
  }
  if (managerCustomers) managerCustomers.textContent = String(data.users?.customerCount || 0);
  if (managerEmployees) managerEmployees.textContent = String(data.users?.employeeCount || 0);
  if (managerManagers) managerManagers.textContent = String(data.users?.managerCount || 0);

  if (managerRecentOrders) {
    managerRecentOrders.innerHTML = (data.recentOrders || [])
      .map(
        (order) => `
          <li class="border-bottom pb-2 mb-2">
            <div class="d-flex justify-content-between gap-2">
              <span class="fw-semibold">הזמנה #${order.id}</span>
              <span>${formatMoney(order.totalAmount)}</span>
            </div>
            <div class="text-muted small">${new Date(order.createdAt).toLocaleString('he-IL')}</div>
          </li>
        `
      )
      .join('') || '<li class="text-muted">אין הזמנות אחרונות.</li>';
  }

  if (managerCriticalStock) {
    managerCriticalStock.innerHTML = (data.criticalStock || [])
      .map(
        (item) => `
          <li class="border-bottom pb-2 mb-2">
            <div class="fw-semibold">${item.productName}</div>
            <div class="text-muted small">${item.category} · מלאי ${item.stock} · מינימום ${item.minStock}</div>
          </li>
        `
      )
      .join('') || '<li class="text-muted">אין פריטים קריטיים כרגע.</li>';
  }
}

function renderUsers(users) {
  if (!managerUsersTable) return;

  managerUsersTable.innerHTML = users
    .map(
      (user) => `
        <tr>
          <td><input class="form-control form-control-sm" data-field="fullName" data-user-id="${user.id}" value="${user.fullName || ''}"></td>
          <td><input class="form-control form-control-sm" data-field="email" data-user-id="${user.id}" value="${user.email || ''}"></td>
          <td>
            <select class="form-select form-select-sm" data-field="role" data-user-id="${user.id}">
              <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>לקוח</option>
              <option value="employee" ${user.role === 'employee' ? 'selected' : ''}>עובד</option>
              <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>מנהל</option>
            </select>
          </td>
          <td><input class="form-control form-control-sm" data-field="password" data-user-id="${user.id}" value="${user.password || ''}"></td>
          <td>
            <button type="button" class="btn btn-dark btn-sm" data-save-user="${user.id}">שמור</button>
          </td>
        </tr>
      `
    )
    .join('');

  bindUserButtons();
}

function bindUserButtons() {
  document.querySelectorAll('[data-save-user]').forEach((button) => {
    button.addEventListener('click', () => updateUser(button.dataset.saveUser));
  });
}

function getRowValue(userId, field) {
  const selector = `[data-field="${field}"][data-user-id="${userId}"]`;
  const element = document.querySelector(selector);
  return element ? element.value : '';
}

async function updateUser(userId) {
  try {
    const payload = {
      userId: authUser.id,
      fullName: getRowValue(userId, 'fullName').trim(),
      email: getRowValue(userId, 'email').trim(),
      role: getRowValue(userId, 'role'),
      password: getRowValue(userId, 'password').trim(),
    };

    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update user');
    }

    clearStatus();
    await refreshManagerData();
  } catch (_err) {
    setStatus('לא ניתן לעדכן משתמש כרגע.', 'danger');
  }
}

async function loadDashboard() {
  const response = await fetch(`${API_BASE_URL}/api/admin/dashboard?userId=${authUser.id}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to load dashboard');
  }
  renderDashboard(data);
}

async function loadUsers() {
  const response = await fetch(`${API_BASE_URL}/api/admin/users?userId=${authUser.id}`);
  const users = await response.json();
  if (!response.ok) {
    throw new Error(users.message || 'Failed to load users');
  }
  renderUsers(users);
}

async function refreshManagerData() {
  await loadDashboard();
  await loadUsers();
}

function init() {
  if (!requireManager()) return;

  if (managerUserLine) {
    managerUserLine.textContent = `מחובר כ-${authUser.fullName} · מנהל מערכת`;
  }

  setStatus('כאן אפשר לערוך משתמשים ולראות תמונת מצב מלאה של המערכת.', 'info');

  refreshManagerData().catch(() => {
    setStatus('שגיאה בטעינת לוח המנהל. ודא שהשרת רץ ושהמשתמש מוגדר כמנהל.', 'danger');
  });
}

init();
