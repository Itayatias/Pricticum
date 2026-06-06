import { Modal } from 'bootstrap';

const API_BASE_URL = 'http://localhost:4000';

const authUserRaw = localStorage.getItem('authUser');
const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;

const managerUserLine = document.getElementById('managerUserLine');
const managerStatus = document.getElementById('managerStatus');
const managerNotificationCount = document.getElementById('managerNotificationCount');
const managerProfileName = document.getElementById('managerProfileName');
const managerProfileInitials = document.getElementById('managerProfileInitials');
const managerLastSync = document.getElementById('managerLastSync');
const managerLogoutLink = document.querySelector('[data-manager-logout]');

const dashboardEls = {
  totalUsers: document.getElementById('managerTotalUsers'),
  totalOrders: document.getElementById('managerTotalOrders'),
  totalRevenue: document.getElementById('managerTotalRevenue'),
  lowStock: document.getElementById('managerLowStock'),
  suppliers: document.getElementById('managerSuppliers'),
  purchaseOrders: document.getElementById('managerPurchaseOrders'),
  customers: document.getElementById('managerCustomers'),
  employees: document.getElementById('managerEmployees'),
  managers: document.getElementById('managerManagers'),
  recentOrders: document.getElementById('managerRecentOrdersBody') || document.getElementById('managerRecentOrders'),
  criticalStock: document.getElementById('managerCriticalStock'),
  categorySales: document.getElementById('managerCategorySales'),
  monthlyRevenue: document.getElementById('managerMonthlyRevenue'),
};

const usersEls = {
  modalEl: document.getElementById('managerUserModal'),
  modalTitle: document.getElementById('managerUserModalTitle'),
  form: document.getElementById('managerUserForm'),
  addBtn: document.getElementById('managerUserAddBtn'),
  table: document.getElementById('managerUsersTable'),
  search: document.getElementById('managerUsersSearchInput'),
  roleFilter: document.getElementById('managerUsersRoleFilter'),
  clearFiltersBtn: document.getElementById('managerUsersClearFiltersBtn'),
  pagination: document.getElementById('managerUsersPagination'),
  paginationMeta: document.getElementById('managerUsersPaginationMeta'),
  pageInfo: document.getElementById('managerUsersPageInfo'),
  fullName: document.getElementById('managerUserFullName'),
  email: document.getElementById('managerUserEmail'),
  password: document.getElementById('managerUserPassword'),
  role: document.getElementById('managerUserRole'),
  customerType: document.getElementById('managerUserCustomerType'),
  saveBtn: document.getElementById('managerUserSaveBtn'),
};

const suppliersEls = {
  modalEl: document.getElementById('managerSupplierModal'),
  modalTitle: document.getElementById('managerSupplierModalTitle'),
  form: document.getElementById('managerSupplierForm'),
  addBtn: document.getElementById('managerSupplierAddBtn'),
  table: document.getElementById('managerSuppliersTable'),
  lowStock: document.getElementById('managerSupplierLowStock'),
  purchaseOrders: document.getElementById('managerPurchaseOrdersTable'),
  search: document.getElementById('managerSuppliersSearchInput'),
  categoryFilter: document.getElementById('managerSuppliersCategoryFilter'),
  clearFiltersBtn: document.getElementById('managerSuppliersClearFiltersBtn'),
  pagination: document.getElementById('managerSuppliersPagination'),
  paginationMeta: document.getElementById('managerSuppliersPaginationMeta'),
  pageInfo: document.getElementById('managerSuppliersPageInfo'),
  name: document.getElementById('managerSupplierName'),
  email: document.getElementById('managerSupplierEmail'),
  phone: document.getElementById('managerSupplierPhone'),
  notes: document.getElementById('managerSupplierNotes'),
  saveBtn: document.getElementById('managerSupplierSaveBtn'),
  purchaseOrdersSearch: document.getElementById('managerPurchaseOrdersSearchInput'),
  purchaseOrdersClearFiltersBtn: document.getElementById('managerPurchaseOrdersClearFiltersBtn'),
  purchaseOrdersPagination: document.getElementById('managerPurchaseOrdersPagination'),
  purchaseOrdersPaginationMeta: document.getElementById('managerPurchaseOrdersPaginationMeta'),
  purchaseOrdersPageInfo: document.getElementById('managerPurchaseOrdersPageInfo'),
};

const reportsEls = {
  buttons: document.querySelectorAll('[data-report-kind]'),
  title: document.getElementById('managerReportTitle'),
  meta: document.getElementById('managerReportMeta'),
  filterInput: document.getElementById('managerReportFilterInput'),
  clearFiltersBtn: document.getElementById('managerReportClearFiltersBtn'),
  tableHead: document.getElementById('managerReportHead'),
  tableBody: document.getElementById('managerReportBody'),
  pagination: document.getElementById('managerReportPagination'),
  paginationMeta: document.getElementById('managerReportPaginationMeta'),
  pageInfo: document.getElementById('managerReportPageInfo'),
  exportBtn: document.getElementById('managerReportExportBtn'),
};

let currentUsers = [];
let currentSuppliers = [];
let currentPurchaseOrders = [];
let purchaseOrdersLoaded = false;
let currentReport = null;
let currentEditingUserId = null;
let currentEditingSupplierId = null;
let userModal = null;
let supplierModal = null;
const usersPageState = {
  allItems: [],
  filteredItems: [],
  currentPage: 1,
  pageSize: 15,
};
const suppliersPageState = {
  allItems: [],
  filteredItems: [],
  currentPage: 1,
  pageSize: 15,
};
const purchaseOrdersPageState = {
  allItems: [],
  filteredItems: [],
  currentPage: 1,
  pageSize: 15,
};
const reportsPageState = {
  allItems: [],
  filteredItems: [],
  currentPage: 1,
  pageSize: 15,
};

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
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function formatDateTime(value) {
  if (!value) return '--';
  return new Date(value).toLocaleString('he-IL');
}

function getPurchaseOrderStatusLabel(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'new') return 'חדש';
  if (normalized === 'in_progress') return 'בתהליך';
  if (normalized === 'picking') return 'ליקוט';
  if (normalized === 'done') return 'בוצע';
  if (normalized === 'sent') return 'נשלח';
  if (normalized === 'draft') return 'טיוטה';
  return String(status || '--');
}

function formatDate(value) {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('he-IL');
}

function formatMonthLabel(value) {
  if (!value) return '--';
  const parts = String(value).split('-');
  if (parts.length === 2) {
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
    }
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  }
  return String(value);
}

function getInitials(name) {
  const tokens = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!tokens.length) return 'מ';
  const initials = tokens.slice(0, 2).map((token) => token[0]).join('');
  return initials.toUpperCase();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

function requireManager() {
  if (!authUser || authUser.role !== 'manager') {
    window.location.href = './login.html';
    return false;
  }
  return true;
}

function getReportConfig(kind) {
  const reports = {
    workHours: {
      title: 'דו"ח שעות עובדים',
      endpoint: `${API_BASE_URL}/api/admin/reports/work-hours?userId=${authUser.id}`,
      columns: ['עובד', 'תאריך', 'כניסה', 'יציאה', 'משך', 'הערות'],
      csvName: 'work-hours-report.csv',
      renderRow: (item) => [
        item.fullName || '',
        formatDate(item.checkIn),
        new Date(item.checkIn).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        item.checkOut ? new Date(item.checkOut).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : 'פעילה',
        getDurationLabel(item.checkIn, item.checkOut),
        item.notes || '',
      ],
    },
    customers: {
      title: 'דו"ח לקוחות',
      endpoint: `${API_BASE_URL}/api/admin/reports/customers?userId=${authUser.id}`,
      columns: ['שם', 'אימייל', 'סוג לקוח', 'תאריך יצירה'],
      csvName: 'customers-report.csv',
      renderRow: (item) => [item.fullName || '', item.email || '', item.customerType || '', formatDate(item.createdAt)],
    },
    products: {
      title: 'דו"ח מוצרים',
      endpoint: `${API_BASE_URL}/api/admin/reports/products?userId=${authUser.id}`,
      columns: ['מוצר', 'קטגוריה', 'מלאי', 'מינימום', 'ספק', 'מחיר', 'עודכן'],
      csvName: 'products-report.csv',
      renderRow: (item) => [
        item.productName || '',
        item.category || '',
        String(item.stock ?? 0),
        String(item.minStock ?? 0),
        item.supplierName || '',
        formatMoney(item.price),
        formatDateTime(item.updatedAt),
      ],
    },
    purchaseOrders: {
      title: 'דו"ח הזמנות רכש מספקים',
      endpoint: `${API_BASE_URL}/api/admin/reports/purchase-orders?userId=${authUser.id}`,
      columns: ['ספק', 'סטטוס', 'נושא', 'נוצר על ידי', 'תאריך'],
      csvName: 'purchase-orders-report.csv',
      renderRow: (item) => [item.supplierName || '', getPurchaseOrderStatusLabel(item.status), item.subject || '', item.createdBy || '', formatDateTime(item.createdAt)],
    },
  };

  return reports[kind] || reports.workHours;
}

function getDurationLabel(checkIn, checkOut) {
  if (!checkIn) return '--';
  const start = new Date(checkIn).getTime();
  const end = checkOut ? new Date(checkOut).getTime() : Date.now();
  const totalMinutes = Math.max(0, Math.floor((end - start) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}

function toCsv(rows, headers) {
  const csvRows = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','));
  return csvRows.join('\n');
}

function downloadCsv(filename, rows, headers) {
  const blob = new Blob([toCsv(rows, headers)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function renderBars(container, items, valueKey, labelKey) {
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '<div class="text-muted small">אין נתונים להצגה.</div>';
    return;
  }

  const maxValue = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 1);
  container.innerHTML = items
    .map((item) => {
      const width = Math.max(6, (Number(item[valueKey] || 0) / maxValue) * 100);
      return `
        <div class="manager-chart__item">
          <div class="manager-chart__row">
            <span>${escapeHtml(item[labelKey])}</span>
            <span class="manager-chart__value">${escapeHtml(item[valueKey])}</span>
          </div>
          <div class="progress manager-progress">
            <div class="progress-bar bg-dark" role="progressbar" style="width: ${width}%"></div>
          </div>
        </div>
      `;
    })
    .join('');
}

function getPageItems(items, pageState) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageState.pageSize));
  pageState.currentPage = Math.min(pageState.currentPage, totalPages);
  const startIndex = (pageState.currentPage - 1) * pageState.pageSize;
  return {
    totalPages,
    pageItems: items.slice(startIndex, startIndex + pageState.pageSize),
  };
}

function renderPagination(container, pageState, metaEl, pageInfoEl, label) {
  if (!container) return;

  const total = pageState.filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageState.pageSize));
  const currentPage = Math.min(pageState.currentPage, totalPages);
  pageState.currentPage = currentPage;

  if (!total) {
    container.innerHTML = '';
    if (metaEl) metaEl.textContent = 'אין נתונים תואמים לסינון';
    if (pageInfoEl) pageInfoEl.textContent = '0';
    return;
  }

  const from = (currentPage - 1) * pageState.pageSize + 1;
  const to = Math.min(total, currentPage * pageState.pageSize);
  if (metaEl) metaEl.textContent = `מציגים ${from}-${to} מתוך ${total} ${label}`;
  if (pageInfoEl) pageInfoEl.textContent = `${currentPage}/${totalPages}`;

  const buttons = [];
  buttons.push(`<button type="button" class="btn btn-outline-secondary btn-sm" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>קודם</button>`);

  const visibleRange = 2;
  const startPage = Math.max(1, currentPage - visibleRange);
  const endPage = Math.min(totalPages, currentPage + visibleRange);

  if (startPage > 1) {
    buttons.push(`<button type="button" class="btn btn-outline-secondary btn-sm" data-page="1">1</button>`);
    if (startPage > 2) buttons.push('<span class="inventory-pagination__ellipsis">…</span>');
  }

  for (let page = startPage; page <= endPage; page += 1) {
    buttons.push(`<button type="button" class="btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-outline-secondary'}" data-page="${page}">${page}</button>`);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) buttons.push('<span class="inventory-pagination__ellipsis">…</span>');
    buttons.push(`<button type="button" class="btn btn-outline-secondary btn-sm" data-page="${totalPages}">${totalPages}</button>`);
  }

  buttons.push(`<button type="button" class="btn btn-outline-secondary btn-sm" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>הבא</button>`);
  container.innerHTML = buttons.join('');
}

function bindPagination(container, pageState, renderFn) {
  if (!container) return;
  container.addEventListener('click', (event) => {
    const target = event.target.closest('[data-page]');
    if (!target || target.disabled) return;
    const page = Number(target.dataset.page);
    if (!Number.isInteger(page) || page < 1) return;
    pageState.currentPage = page;
    renderFn();
  });
}

function syncSidebarActiveState() {
  const links = document.querySelectorAll('aside.manager-sidebar nav.manager-nav .manager-nav__link[href]');
  const currentPath = window.location.pathname.split('/').pop() || 'manager.html';
  links.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const linkPath = href.split('/').pop();
    link.classList.toggle('active', linkPath === currentPath);
  });
}

function getUserSearchTerms() {
  return String(usersEls.search?.value || '').trim().toLowerCase();
}

function getSupplierSearchTerms() {
  return String(suppliersEls.search?.value || '').trim().toLowerCase();
}

function getPurchaseOrderSearchTerms() {
  return String(suppliersEls.purchaseOrdersSearch?.value || '').trim().toLowerCase();
}

function getReportSearchTerms() {
  return String(reportsEls.filterInput?.value || '').trim().toLowerCase();
}

function renderDashboard(data) {
  const lowStockCount = Number(data.inventory?.lowStockCount || 0);
  const openPurchaseOrders = Number(data.purchaseOrders?.openPurchaseOrders || 0);

  if (dashboardEls.totalUsers) dashboardEls.totalUsers.textContent = String(data.users?.totalUsers || 0);
  if (dashboardEls.totalOrders) dashboardEls.totalOrders.textContent = String(data.orders?.totalOrders || 0);
  if (dashboardEls.totalRevenue) dashboardEls.totalRevenue.textContent = formatMoney(data.orders?.totalRevenue || 0);
  if (dashboardEls.lowStock) dashboardEls.lowStock.textContent = String(data.inventory?.lowStockCount || 0);
  if (dashboardEls.suppliers) dashboardEls.suppliers.textContent = String(data.suppliers?.totalSuppliers || 0);
  if (dashboardEls.purchaseOrders) dashboardEls.purchaseOrders.textContent = String(data.purchaseOrders?.openPurchaseOrders || 0);
  if (dashboardEls.customers) dashboardEls.customers.textContent = String(data.users?.customerCount || 0);
  if (dashboardEls.employees) dashboardEls.employees.textContent = String(data.users?.employeeCount || 0);
  if (dashboardEls.managers) dashboardEls.managers.textContent = String(data.users?.managerCount || 0);

  if (managerNotificationCount) {
    managerNotificationCount.textContent = String(Math.min(99, lowStockCount + openPurchaseOrders));
  }

  if (managerLastSync) {
    managerLastSync.textContent = `מעודכן ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (dashboardEls.recentOrders) {
    dashboardEls.recentOrders.innerHTML = (data.recentOrders || [])
      .map(
        (order) => `
          <tr>
            <td class="fw-semibold">#${escapeHtml(order.id)}</td>
            <td>${escapeHtml(order.customerName || 'לקוח כללי')}</td>
            <td>${formatDateTime(order.createdAt)}</td>
            <td><span class="manager-badge">${formatMoney(order.totalAmount)}</span></td>
          </tr>
        `
      )
      .join('') || '<tr><td colspan="4" class="text-muted">אין הזמנות אחרונות.</td></tr>';
  }

  if (dashboardEls.criticalStock) {
    dashboardEls.criticalStock.innerHTML = (data.criticalStock || [])
      .map(
        (item) => `
          <li>
            <div class="d-flex align-items-start justify-content-between gap-3">
              <div>
                <div class="manager-list__title">${escapeHtml(item.productName)}</div>
                <div class="manager-list__meta">
                  ${escapeHtml(item.category)} · מלאי ${escapeHtml(item.stock)} · מינימום ${escapeHtml(item.minStock)}
                </div>
                <div class="manager-list__meta">
                  ${item.location ? `מיקום: ${escapeHtml(item.location)} · ` : ''}
                  ${item.supplierName ? `ספק: ${escapeHtml(item.supplierName)}` : 'ללא ספק משויך'}
                </div>
              </div>
              <span class="manager-badge">${escapeHtml(item.stock)} / ${escapeHtml(item.minStock)}</span>
            </div>
          </li>
        `
      )
      .join('') || '<li class="text-muted">אין מוצרים קריטיים כרגע.</li>';
  }

  renderBars(dashboardEls.categorySales, data.categorySales || [], 'revenue', 'category');

  if (dashboardEls.monthlyRevenue) {
    const items = (data.monthlyRevenue || []).map((item) => ({
      label: formatMonthLabel(item.month),
      value: item.revenue,
    }));
    renderBars(
      dashboardEls.monthlyRevenue,
      items,
      'value',
      'label'
    );
  }

  if (managerProfileName && authUser?.fullName) {
    managerProfileName.textContent = authUser.fullName;
  }

  if (managerProfileInitials && authUser?.fullName) {
    managerProfileInitials.textContent = getInitials(authUser.fullName);
  }
}

function setUserFormState(user = null) {
  currentEditingUserId = user ? user.id : null;
  if (usersEls.form) usersEls.form.dataset.mode = user ? 'edit' : 'create';
  if (usersEls.saveBtn) usersEls.saveBtn.textContent = user ? 'שמירת שינויים' : 'הוספת משתמש';
  if (usersEls.modalTitle) usersEls.modalTitle.textContent = user ? 'עריכת משתמש' : 'הוספת משתמש חדש';
  if (usersEls.fullName) usersEls.fullName.value = user?.fullName || '';
  if (usersEls.email) usersEls.email.value = user?.email || '';
  if (usersEls.password) usersEls.password.value = '';
  if (usersEls.role) usersEls.role.value = user?.role || 'customer';
  if (usersEls.customerType) {
    usersEls.customerType.value = user?.customerType || 'private';
    usersEls.customerType.disabled = (user?.role || 'customer') !== 'customer';
  }
}

function toggleCustomerTypeField() {
  if (!usersEls.customerType || !usersEls.role) return;
  usersEls.customerType.disabled = usersEls.role.value !== 'customer';
  if (usersEls.role.value !== 'customer') {
    usersEls.customerType.value = 'private';
  }
}

function applyUsersFilters(resetPage = false) {
  if (resetPage) usersPageState.currentPage = 1;

  const searchTerm = getUserSearchTerms();
  const role = String(usersEls.roleFilter?.value || '').trim();
  usersPageState.filteredItems = usersPageState.allItems.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      String(user.fullName || '').toLowerCase().includes(searchTerm) ||
      String(user.email || '').toLowerCase().includes(searchTerm) ||
      String(user.role || '').toLowerCase().includes(searchTerm);
    const matchesRole = !role || String(user.role || '') === role;
    return matchesSearch && matchesRole;
  });

  renderUsersPage();
}

function renderUsers(users) {
  currentUsers = users;
  usersPageState.allItems = [...users];
  applyUsersFilters(true);
}

function renderUsersPage() {
  if (!usersEls.table) return;

  const { pageItems } = getPageItems(usersPageState.filteredItems, usersPageState);
  if (!pageItems.length) {
    usersEls.table.innerHTML = '<tr><td colspan="6" class="text-muted">אין משתמשים תואמים לסינון.</td></tr>';
    renderPagination(usersEls.pagination, usersPageState, usersEls.paginationMeta, usersEls.pageInfo, 'משתמשים');
    return;
  }

  usersEls.table.innerHTML = pageItems
    .map(
      (user) => `
        <tr>
          <td class="fw-semibold">${escapeHtml(user.fullName || '')}</td>
          <td>${escapeHtml(user.email || '')}</td>
          <td><span class="manager-badge">${user.role === 'manager' ? 'מנהל' : user.role === 'employee' ? 'עובד' : 'לקוח'}</span></td>
          <td>${user.role === 'customer' ? escapeHtml(user.customerType || 'פרטי') : '--'}</td>
          <td><span class="manager-badge">פעיל</span></td>
          <td>
            <div class="d-flex gap-2 flex-wrap">
              <button type="button" class="btn btn-dark btn-sm" data-user-edit="${user.id}">ערוך</button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');

  document.querySelectorAll('[data-user-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const user = currentUsers.find((item) => String(item.id) === String(button.dataset.userEdit));
      if (user) {
        setUserFormState(user);
        getUserModal()?.show();
      }
    });
  });

  renderPagination(usersEls.pagination, usersPageState, usersEls.paginationMeta, usersEls.pageInfo, 'משתמשים');
}

function getUserModal() {
  if (!userModal && usersEls.modalEl) {
    userModal = new Modal(usersEls.modalEl);
  }
  return userModal;
}

function getUserFieldValue(userId, field) {
  const element = document.querySelector(`[data-user-field="${field}"][data-user-id="${userId}"]`);
  return element ? element.value : '';
}

async function refreshUsers() {
  const users = await fetchJson(`${API_BASE_URL}/api/admin/users?userId=${authUser.id}`);
  renderUsers(users);
}

async function saveUser(event) {
  event.preventDefault();

  try {
    const payload = {
      userId: authUser.id,
      fullName: String(usersEls.fullName?.value || '').trim(),
      email: String(usersEls.email?.value || '').trim(),
      role: String(usersEls.role?.value || 'customer'),
      customerType: String(usersEls.customerType?.value || 'private'),
    };

    const passwordValue = String(usersEls.password?.value || '').trim();

    if (!payload.fullName || !payload.email) {
      setStatus('יש למלא שם ואימייל.', 'warning');
      return;
    }

    if (!currentEditingUserId && !passwordValue) {
      setStatus('יש להזין סיסמה עבור משתמש חדש.', 'warning');
      return;
    }

    if (passwordValue) {
      payload.password = passwordValue;
    }

    if (currentEditingUserId) {
      await fetchJson(`${API_BASE_URL}/api/admin/users/${currentEditingUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setStatus('המשתמש עודכן בהצלחה.', 'success');
    } else {
      await fetchJson(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setStatus('המשתמש נוסף בהצלחה.', 'success');
    }

    setUserFormState(null);
    getUserModal()?.hide();
    await refreshUsers();
  } catch (_err) {
    setStatus('לא ניתן לשמור משתמש כרגע.', 'danger');
  }
}

async function updateUser(userId) {
  try {
    const payload = {
      userId: authUser.id,
      fullName: String(getUserFieldValue(userId, 'fullName')).trim(),
      email: String(getUserFieldValue(userId, 'email')).trim(),
      role: String(getUserFieldValue(userId, 'role')),
      customerType: String(getUserFieldValue(userId, 'customerType') || 'private'),
      password: String(getUserFieldValue(userId, 'password')).trim(),
    };

    await fetchJson(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setStatus('המשתמש עודכן בהצלחה.', 'success');
    await refreshUsers();
  } catch (_err) {
    setStatus('לא ניתן לעדכן משתמש כרגע.', 'danger');
  }
}

function renderSuppliers(suppliers) {
  currentSuppliers = suppliers;
  suppliersPageState.allItems = [...suppliers];
  applySuppliersFilters(true);
}

function applySuppliersFilters(resetPage = false) {
  if (resetPage) suppliersPageState.currentPage = 1;

  const searchTerm = getSupplierSearchTerms();
  const category = String(suppliersEls.categoryFilter?.value || '').trim();
  suppliersPageState.filteredItems = suppliersPageState.allItems.filter((supplier) => {
    const matchesSearch =
      !searchTerm ||
      String(supplier.supplierName || '').toLowerCase().includes(searchTerm) ||
      String(supplier.supplierCode || '').toLowerCase().includes(searchTerm) ||
      String(supplier.email || '').toLowerCase().includes(searchTerm) ||
      String(supplier.phone || '').toLowerCase().includes(searchTerm) ||
      String(supplier.productCategory || '').toLowerCase().includes(searchTerm);
    const matchesCategory = !category || String(supplier.productCategory || '') === category;
    return matchesSearch && matchesCategory;
  });
  renderSuppliersPage();
}

function renderSuppliersPage() {
  if (suppliersEls.table) {
    const { pageItems } = getPageItems(suppliersPageState.filteredItems, suppliersPageState);
    if (!pageItems.length) {
      suppliersEls.table.innerHTML = '<tr><td colspan="7" class="text-muted">אין ספקים תואמים לסינון.</td></tr>';
      renderPagination(suppliersEls.pagination, suppliersPageState, suppliersEls.paginationMeta, suppliersEls.pageInfo, 'ספקים');
      return;
    }

    suppliersEls.table.innerHTML = pageItems
      .map(
        (supplier) => `
          <tr>
            <td class="fw-semibold">${escapeHtml(supplier.supplierName)}</td>
            <td>${escapeHtml(supplier.supplierCode || '--')}</td>
            <td>${escapeHtml(supplier.email)}</td>
            <td>${escapeHtml(supplier.phone || '--')}</td>
            <td>${supplier.totalProducts}</td>
            <td><span class="badge bg-warning text-dark">${supplier.lowStockCount}</span></td>
            <td>
              <div class="d-flex gap-2 flex-wrap">
                <a class="btn btn-outline-dark btn-sm" href="${supplier.mailtoHref}">פתח דוא"ל</a>
                <button type="button" class="btn btn-outline-secondary btn-sm" data-supplier-order="${supplier.supplierId}">שמור הזמנה</button>
                <button type="button" class="btn btn-dark btn-sm" data-supplier-edit="${supplier.supplierId}">ערוך</button>
              </div>
            </td>
          </tr>
        `
      )
      .join('');
  }

  renderPagination(suppliersEls.pagination, suppliersPageState, suppliersEls.paginationMeta, suppliersEls.pageInfo, 'ספקים');

  if (suppliersEls.lowStock) {
    const lowStockItems = currentSuppliers.flatMap((supplier) =>
      supplier.lowStockProducts.map((item) => ({
        ...item,
        supplierName: supplier.supplierName,
        supplierId: supplier.supplierId,
      }))
    );

    suppliersEls.lowStock.innerHTML = lowStockItems.length
      ? lowStockItems
          .map(
            (item) => `
              <li class="border-bottom pb-2 mb-2">
                <div class="d-flex justify-content-between gap-3">
                  <span class="fw-semibold">${escapeHtml(item.productName)}</span>
                  <span class="text-muted small">${escapeHtml(item.supplierName)}${item.supplierCode ? ` · ${escapeHtml(item.supplierCode)}` : ''}</span>
                </div>
                <div class="text-muted small">
                  מלאי ${escapeHtml(item.stock)} · מינימום ${escapeHtml(item.minStock)} · הזמנה מוצעת ${escapeHtml(item.suggestedQuantity)}
                </div>
              </li>
            `
          )
          .join('')
      : '<li class="text-muted">אין מוצרים במלאי נמוך.</li>';
  }

  if (suppliersEls.purchaseOrders && purchaseOrdersLoaded) {
    renderPurchaseOrdersPage();
  }

  document.querySelectorAll('[data-supplier-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const supplier = currentSuppliers.find((item) => String(item.supplierId) === String(button.dataset.supplierEdit));
      if (supplier) {
        setSupplierFormState(supplier);
        getSupplierModal()?.show();
      }
    });
  });

  document.querySelectorAll('[data-supplier-order]').forEach((button) => {
    button.addEventListener('click', () => createPurchaseOrder(button.dataset.supplierOrder));
  });
}

function applyPurchaseOrdersFilters(resetPage = false) {
  if (resetPage) purchaseOrdersPageState.currentPage = 1;

  const searchTerm = getPurchaseOrderSearchTerms();
  purchaseOrdersPageState.filteredItems = purchaseOrdersPageState.allItems.filter((order) => {
    if (!searchTerm) return true;
    return [
      order.supplierName,
      order.status,
      order.subject,
      order.createdBy,
      order.createdAt ? formatDateTime(order.createdAt) : '',
    ]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm);
  });

  renderPurchaseOrdersPage();
}

function renderPurchaseOrdersPage() {
  if (!suppliersEls.purchaseOrders) return;

  const { pageItems } = getPageItems(purchaseOrdersPageState.filteredItems, purchaseOrdersPageState);
  if (!pageItems.length) {
    suppliersEls.purchaseOrders.innerHTML = '<tr><td colspan="5" class="text-muted">אין עדיין הזמנות רכש.</td></tr>';
    renderPagination(
      suppliersEls.purchaseOrdersPagination,
      purchaseOrdersPageState,
      suppliersEls.purchaseOrdersPaginationMeta,
      suppliersEls.purchaseOrdersPageInfo,
      'הזמנות'
    );
    return;
  }

  suppliersEls.purchaseOrders.innerHTML = pageItems
    .map(
      (order) => `
        <tr>
          <td>${escapeHtml(order.supplierName)}</td>
          <td><span class="manager-badge">${escapeHtml(getPurchaseOrderStatusLabel(order.status))}</span></td>
          <td>${escapeHtml(order.subject)}</td>
          <td>${escapeHtml(order.createdBy)}</td>
          <td>${formatDateTime(order.createdAt)}</td>
        </tr>
      `
    )
    .join('');

  renderPagination(
    suppliersEls.purchaseOrdersPagination,
    purchaseOrdersPageState,
    suppliersEls.purchaseOrdersPaginationMeta,
    suppliersEls.purchaseOrdersPageInfo,
    'הזמנות'
  );
}

function setSupplierFormState(supplier = null) {
  currentEditingSupplierId = supplier ? supplier.supplierId : null;
  if (suppliersEls.saveBtn) suppliersEls.saveBtn.textContent = supplier ? 'שמירת ספק' : 'הוספת ספק';
  if (suppliersEls.modalTitle) suppliersEls.modalTitle.textContent = supplier ? 'עריכת ספק' : 'הוספת ספק חדש';
  if (suppliersEls.name) suppliersEls.name.value = supplier?.supplierName || '';
  if (suppliersEls.email) suppliersEls.email.value = supplier?.email || '';
  if (suppliersEls.phone) suppliersEls.phone.value = supplier?.phone || '';
  if (suppliersEls.notes) suppliersEls.notes.value = supplier?.notes || '';
}

function getSupplierModal() {
  if (!supplierModal && suppliersEls.modalEl) {
    supplierModal = new Modal(suppliersEls.modalEl);
  }
  return supplierModal;
}

async function saveSupplier(event) {
  event.preventDefault();

  try {
    const payload = {
      userId: authUser.id,
      supplierId: currentEditingSupplierId,
      supplierName: String(suppliersEls.name?.value || '').trim(),
      email: String(suppliersEls.email?.value || '').trim(),
      phone: String(suppliersEls.phone?.value || '').trim(),
      notes: String(suppliersEls.notes?.value || '').trim(),
    };

    if (!payload.supplierName || !payload.email) {
      setStatus('יש למלא שם ספק ואימייל.', 'warning');
      return;
    }

    await fetchJson(`${API_BASE_URL}/api/admin/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setStatus('הספק נשמר בהצלחה.', 'success');
    setSupplierFormState(null);
    getSupplierModal()?.hide();
    await refreshSuppliers();
  } catch (_err) {
    setStatus('לא ניתן לשמור ספק כרגע.', 'danger');
  }
}

async function refreshSuppliers() {
  currentSuppliers = await fetchJson(`${API_BASE_URL}/api/admin/suppliers?userId=${authUser.id}`);
  renderSuppliers(currentSuppliers);
}

async function loadPurchaseOrders() {
  currentPurchaseOrders = await fetchJson(`${API_BASE_URL}/api/admin/purchase-orders?userId=${authUser.id}`);
  purchaseOrdersLoaded = true;
  purchaseOrdersPageState.allItems = [...currentPurchaseOrders];
  applyPurchaseOrdersFilters(true);
}

async function createPurchaseOrder(supplierId) {
  try {
    const supplier = currentSuppliers.find((item) => String(item.supplierId) === String(supplierId));
    if (!supplier) return;

    const result = await fetchJson(`${API_BASE_URL}/api/admin/purchase-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: authUser.id,
        supplierId: supplier.supplierId,
        status: 'new',
      }),
    });

    const order = result.order;
    currentPurchaseOrders = [
      {
        supplierName: order.supplierName,
        status: order.status,
        subject: order.subject,
        createdBy: authUser.fullName,
        createdAt: new Date().toISOString(),
      },
      ...currentPurchaseOrders,
    ];
    purchaseOrdersLoaded = true;
    purchaseOrdersPageState.allItems = [...currentPurchaseOrders];
    renderSuppliers(currentSuppliers);
    applyPurchaseOrdersFilters(true);
    setStatus(`הזמנת רכש נוצרה עבור ${supplier.supplierName}.`, 'success');
    window.location.href = supplier.mailtoHref;
  } catch (_err) {
    setStatus('לא ניתן ליצור הזמנת רכש כרגע.', 'danger');
  }
}

async function loadDashboard() {
  const data = await fetchJson(`${API_BASE_URL}/api/admin/dashboard?userId=${authUser.id}`);
  renderDashboard(data);
}

function renderReport(data, config) {
  if (!reportsEls.tableHead || !reportsEls.tableBody) return;

  reportsEls.tableHead.innerHTML = `
    <tr>
      ${config.columns.map((column) => `<th>${column}</th>`).join('')}
    </tr>
  `;

  reportsPageState.allItems = [...data];
  applyReportFilters(true);
}

async function loadReport(kind) {
  const config = getReportConfig(kind);
  const data = await fetchJson(config.endpoint);
  currentReport = { ...config, kind, data };

  if (reportsEls.title) reportsEls.title.textContent = config.title;
  if (reportsEls.meta) reportsEls.meta.textContent = `ייצוא מהיר ל-${config.csvName}`;
  renderReport(data, config);
}

function applyReportFilters(resetPage = false) {
  if (resetPage) reportsPageState.currentPage = 1;

  const searchTerm = getReportSearchTerms();
  reportsPageState.filteredItems = reportsPageState.allItems.filter((item) => {
    if (!searchTerm) return true;
    return currentReport?.renderRow(item).some((cell) => String(cell || '').toLowerCase().includes(searchTerm));
  });

  renderReportPage();
}

function renderReportPage() {
  if (!reportsEls.tableBody || !currentReport) return;

  const { pageItems } = getPageItems(reportsPageState.filteredItems, reportsPageState);
  if (!pageItems.length) {
    reportsEls.tableBody.innerHTML = `<tr><td colspan="${currentReport.columns.length}" class="text-muted">אין נתונים תואמים לסינון.</td></tr>`;
    renderPagination(reportsEls.pagination, reportsPageState, reportsEls.paginationMeta, reportsEls.pageInfo, 'שורות');
    return;
  }

  reportsEls.tableBody.innerHTML = pageItems
    .map((item) => {
      const row = currentReport.renderRow(item);
      return `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`;
    })
    .join('');

  renderPagination(reportsEls.pagination, reportsPageState, reportsEls.paginationMeta, reportsEls.pageInfo, 'שורות');
}

function bindReportButtons() {
  reportsEls.buttons.forEach((button) => {
    button.addEventListener('click', () => {
      loadReport(button.dataset.reportKind).catch(() => {
        setStatus('לא ניתן לטעון את הדו"ח כרגע.', 'danger');
      });
    });
  });

  if (reportsEls.exportBtn) {
    reportsEls.exportBtn.addEventListener('click', () => {
      if (!currentReport) {
        setStatus('יש לבחור דו"ח לפני הייצוא.', 'warning');
        return;
      }
      downloadCsv(
        currentReport.csvName,
        currentReport.data.map((item) => currentReport.renderRow(item)),
        currentReport.columns
      );
      setStatus('הדו"ח יוצא בהצלחה.', 'success');
    });
  }
}

function bindEvents() {
  if (usersEls.addBtn) {
    usersEls.addBtn.addEventListener('click', () => {
      setUserFormState(null);
      getUserModal()?.show();
    });
  }
  if (usersEls.form) usersEls.form.addEventListener('submit', saveUser);
  if (usersEls.role) usersEls.role.addEventListener('change', toggleCustomerTypeField);
  if (usersEls.customerType) usersEls.customerType.addEventListener('change', toggleCustomerTypeField);
  if (usersEls.modalEl) {
    usersEls.modalEl.addEventListener('hidden.bs.modal', () => {
      setUserFormState(null);
    });
  }
  if (usersEls.search) usersEls.search.addEventListener('input', () => applyUsersFilters(true));
  if (usersEls.roleFilter) usersEls.roleFilter.addEventListener('change', () => applyUsersFilters(true));
  if (usersEls.clearFiltersBtn) {
    usersEls.clearFiltersBtn.addEventListener('click', () => {
      if (usersEls.search) usersEls.search.value = '';
      if (usersEls.roleFilter) usersEls.roleFilter.value = '';
      applyUsersFilters(true);
    });
  }
  bindPagination(usersEls.pagination, usersPageState, renderUsersPage);

  if (suppliersEls.addBtn) {
    suppliersEls.addBtn.addEventListener('click', () => {
      setSupplierFormState(null);
      getSupplierModal()?.show();
    });
  }
  if (suppliersEls.form) suppliersEls.form.addEventListener('submit', saveSupplier);
  if (suppliersEls.modalEl) {
    suppliersEls.modalEl.addEventListener('hidden.bs.modal', () => {
      setSupplierFormState(null);
    });
  }
  if (suppliersEls.search) suppliersEls.search.addEventListener('input', () => applySuppliersFilters(true));
  if (suppliersEls.categoryFilter) suppliersEls.categoryFilter.addEventListener('change', () => applySuppliersFilters(true));
  if (suppliersEls.clearFiltersBtn) {
    suppliersEls.clearFiltersBtn.addEventListener('click', () => {
      if (suppliersEls.search) suppliersEls.search.value = '';
      if (suppliersEls.categoryFilter) suppliersEls.categoryFilter.value = '';
      applySuppliersFilters(true);
    });
  }
  bindPagination(suppliersEls.pagination, suppliersPageState, renderSuppliersPage);

  if (suppliersEls.purchaseOrdersSearch) {
    suppliersEls.purchaseOrdersSearch.addEventListener('input', () => applyPurchaseOrdersFilters(true));
  }
  if (suppliersEls.purchaseOrdersClearFiltersBtn) {
    suppliersEls.purchaseOrdersClearFiltersBtn.addEventListener('click', () => {
      if (suppliersEls.purchaseOrdersSearch) suppliersEls.purchaseOrdersSearch.value = '';
      applyPurchaseOrdersFilters(true);
    });
  }
  bindPagination(suppliersEls.purchaseOrdersPagination, purchaseOrdersPageState, renderPurchaseOrdersPage);

  if (reportsEls.filterInput) reportsEls.filterInput.addEventListener('input', () => applyReportFilters(true));
  if (reportsEls.clearFiltersBtn) {
    reportsEls.clearFiltersBtn.addEventListener('click', () => {
      if (reportsEls.filterInput) reportsEls.filterInput.value = '';
      applyReportFilters(true);
    });
  }
  bindPagination(reportsEls.pagination, reportsPageState, renderReportPage);

  if (managerLogoutLink) {
    managerLogoutLink.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.removeItem('authUser');
      window.location.href = 'login.html';
    });
  }

  bindReportButtons();
}

async function initDashboardPage() {
  await loadDashboard();
}

async function initUsersPage() {
  setUserFormState(null);
  await refreshUsers();
}

async function initSuppliersPage() {
  setSupplierFormState(null);
  await refreshSuppliers();
  await loadPurchaseOrders();
}

async function initReportsPage() {
  await loadReport('workHours');
}

function init() {
  if (!requireManager()) return;

  if (managerUserLine) {
    managerUserLine.textContent = `מחובר כ-${authUser.fullName} · הרשאת מנהל מלאה`;
  }

  if (managerProfileName) {
    managerProfileName.textContent = authUser.fullName || 'מנהל מערכת';
  }

  if (managerProfileInitials) {
    managerProfileInitials.textContent = getInitials(authUser.fullName);
  }

  syncSidebarActiveState();

  if (!managerStatus) return;
  setStatus('ברוכים הבאים ללוח הבקרה. כאן אפשר לעקוב אחרי ההזמנות, המלאי, הספקים והדו"חות במקום אחד.', 'info');
  bindEvents();

  const initTasks = [];
  if (dashboardEls.totalUsers || dashboardEls.totalOrders || dashboardEls.totalRevenue) {
    initTasks.push(initDashboardPage());
  }
  if (usersEls.table || usersEls.form) {
    initTasks.push(initUsersPage());
  }
  if (suppliersEls.table || suppliersEls.form || suppliersEls.lowStock) {
    initTasks.push(initSuppliersPage());
  }
  if (reportsEls.tableBody || reportsEls.buttons.length) {
    initTasks.push(initReportsPage());
  }

  Promise.all(initTasks).catch(() => {
    setStatus('שגיאה בטעינת אזור המנהל. ודא שהשרת רץ ושהמשתמש מוגדר כמנהל.', 'danger');
  });
}

init();
