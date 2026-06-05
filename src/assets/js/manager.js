const API_BASE_URL = 'http://localhost:4000';

const authUserRaw = localStorage.getItem('authUser');
const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;

const managerUserLine = document.getElementById('managerUserLine');
const managerStatus = document.getElementById('managerStatus');

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
  recentOrders: document.getElementById('managerRecentOrders'),
  criticalStock: document.getElementById('managerCriticalStock'),
  categorySales: document.getElementById('managerCategorySales'),
  monthlyRevenue: document.getElementById('managerMonthlyRevenue'),
};

const usersEls = {
  form: document.getElementById('managerUserForm'),
  table: document.getElementById('managerUsersTable'),
  fullName: document.getElementById('managerUserFullName'),
  email: document.getElementById('managerUserEmail'),
  password: document.getElementById('managerUserPassword'),
  role: document.getElementById('managerUserRole'),
  customerType: document.getElementById('managerUserCustomerType'),
  saveBtn: document.getElementById('managerUserSaveBtn'),
};

const suppliersEls = {
  form: document.getElementById('managerSupplierForm'),
  table: document.getElementById('managerSuppliersTable'),
  lowStock: document.getElementById('managerSupplierLowStock'),
  purchaseOrders: document.getElementById('managerPurchaseOrdersTable'),
  name: document.getElementById('managerSupplierName'),
  email: document.getElementById('managerSupplierEmail'),
  phone: document.getElementById('managerSupplierPhone'),
  notes: document.getElementById('managerSupplierNotes'),
  saveBtn: document.getElementById('managerSupplierSaveBtn'),
};

const reportsEls = {
  buttons: document.querySelectorAll('[data-report-kind]'),
  title: document.getElementById('managerReportTitle'),
  meta: document.getElementById('managerReportMeta'),
  tableHead: document.getElementById('managerReportHead'),
  tableBody: document.getElementById('managerReportBody'),
  exportBtn: document.getElementById('managerReportExportBtn'),
};

let currentUsers = [];
let currentSuppliers = [];
let currentPurchaseOrders = [];
let currentReport = null;
let currentEditingUserId = null;
let currentEditingSupplierId = null;

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

function formatDateTime(value) {
  if (!value) return '--';
  return new Date(value).toLocaleString('he-IL');
}

function formatDate(value) {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('he-IL');
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
      renderRow: (item) => [item.supplierName || '', item.status || '', item.subject || '', item.createdBy || '', formatDateTime(item.createdAt)],
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
        <div class="mb-3">
          <div class="d-flex justify-content-between gap-3 small mb-1">
            <span class="fw-semibold">${escapeHtml(item[labelKey])}</span>
            <span>${escapeHtml(item[valueKey])}</span>
          </div>
          <div class="progress" style="height: 12px;">
            <div class="progress-bar bg-dark" role="progressbar" style="width: ${width}%"></div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderDashboard(data) {
  if (dashboardEls.totalUsers) dashboardEls.totalUsers.textContent = String(data.users?.totalUsers || 0);
  if (dashboardEls.totalOrders) dashboardEls.totalOrders.textContent = String(data.orders?.totalOrders || 0);
  if (dashboardEls.totalRevenue) dashboardEls.totalRevenue.textContent = formatMoney(data.orders?.totalRevenue || 0);
  if (dashboardEls.lowStock) dashboardEls.lowStock.textContent = String(data.inventory?.lowStockCount || 0);
  if (dashboardEls.suppliers) dashboardEls.suppliers.textContent = String(data.suppliers?.totalSuppliers || 0);
  if (dashboardEls.purchaseOrders) dashboardEls.purchaseOrders.textContent = String(data.purchaseOrders?.openPurchaseOrders || 0);
  if (dashboardEls.customers) dashboardEls.customers.textContent = String(data.users?.customerCount || 0);
  if (dashboardEls.employees) dashboardEls.employees.textContent = String(data.users?.employeeCount || 0);
  if (dashboardEls.managers) dashboardEls.managers.textContent = String(data.users?.managerCount || 0);

  if (dashboardEls.recentOrders) {
    dashboardEls.recentOrders.innerHTML = (data.recentOrders || [])
      .map(
        (order) => `
          <li class="border-bottom pb-2 mb-2">
            <div class="d-flex justify-content-between gap-2">
              <span class="fw-semibold">הזמנה #${escapeHtml(order.id)}</span>
              <span>${formatMoney(order.totalAmount)}</span>
            </div>
            <div class="text-muted small">${escapeHtml(order.customerName || 'לקוח כללי')}</div>
            <div class="text-muted small">${formatDateTime(order.createdAt)}</div>
          </li>
        `
      )
      .join('') || '<li class="text-muted">אין הזמנות אחרונות.</li>';
  }

  if (dashboardEls.criticalStock) {
    dashboardEls.criticalStock.innerHTML = (data.criticalStock || [])
      .map(
        (item) => `
          <li class="border-bottom pb-2 mb-2">
            <div class="fw-semibold">${escapeHtml(item.productName)}</div>
            <div class="text-muted small">
              ${escapeHtml(item.category)} · מלאי ${escapeHtml(item.stock)} · מינימום ${escapeHtml(item.minStock)}
              ${item.supplierName ? ` · ספק ${escapeHtml(item.supplierName)}` : ''}
            </div>
          </li>
        `
      )
      .join('') || '<li class="text-muted">אין מוצרים קריטיים כרגע.</li>';
  }

  renderBars(dashboardEls.categorySales, data.categorySales || [], 'revenue', 'category');

  if (dashboardEls.monthlyRevenue) {
    const items = (data.monthlyRevenue || []).map((item) => ({
      label: item.month,
      value: item.revenue,
    }));
    renderBars(
      dashboardEls.monthlyRevenue,
      items.map((item) => ({ ...item, monthLabel: item.label })),
      'value',
      'label'
    );
  }
}

function setUserFormState(user = null) {
  currentEditingUserId = user ? user.id : null;
  if (usersEls.form) usersEls.form.dataset.mode = user ? 'edit' : 'create';
  if (usersEls.saveBtn) usersEls.saveBtn.textContent = user ? 'שמירת שינויים' : 'הוספת משתמש';
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

function renderUsers(users) {
  currentUsers = users;
  if (!usersEls.table) return;

  usersEls.table.innerHTML = users
    .map(
      (user) => `
        <tr>
          <td><input class="form-control form-control-sm" data-user-field="fullName" data-user-id="${user.id}" value="${escapeHtml(user.fullName || '')}"></td>
          <td><input class="form-control form-control-sm" data-user-field="email" data-user-id="${user.id}" value="${escapeHtml(user.email || '')}"></td>
          <td>
            <select class="form-select form-select-sm" data-user-field="role" data-user-id="${user.id}">
              <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>לקוח</option>
              <option value="employee" ${user.role === 'employee' ? 'selected' : ''}>עובד</option>
              <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>מנהל</option>
            </select>
          </td>
          <td>
            <select class="form-select form-select-sm" data-user-field="customerType" data-user-id="${user.id}" ${user.role !== 'customer' ? 'disabled' : ''}>
              <option value="private" ${user.customerType === 'private' ? 'selected' : ''}>פרטי</option>
              <option value="business" ${user.customerType === 'business' ? 'selected' : ''}>עסקי</option>
              <option value="contractor" ${user.customerType === 'contractor' ? 'selected' : ''}>קבלן</option>
            </select>
          </td>
          <td><input type="password" class="form-control form-control-sm" data-user-field="password" data-user-id="${user.id}" placeholder="השאר ריק אם לא משנים"></td>
          <td>
            <div class="d-flex gap-2 flex-wrap">
              <button type="button" class="btn btn-dark btn-sm" data-user-save="${user.id}">שמור</button>
              <button type="button" class="btn btn-outline-secondary btn-sm" data-user-edit="${user.id}">טען לעריכה</button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');

  document.querySelectorAll('[data-user-save]').forEach((button) => {
    button.addEventListener('click', () => updateUser(button.dataset.userSave));
  });

  document.querySelectorAll('[data-user-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const user = currentUsers.find((item) => String(item.id) === String(button.dataset.userEdit));
      if (user) setUserFormState(user);
    });
  });
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
  if (suppliersEls.table) {
    suppliersEls.table.innerHTML = suppliers
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
                <button type="button" class="btn btn-dark btn-sm" data-supplier-edit="${supplier.supplierId}">ערוך</button>
                <a class="btn btn-outline-primary btn-sm" href="${supplier.mailtoHref}">פתח דוא"ל</a>
                <button type="button" class="btn btn-outline-secondary btn-sm" data-supplier-order="${supplier.supplierId}">שמור הזמנה</button>
              </div>
            </td>
          </tr>
        `
      )
      .join('');
  }

  if (suppliersEls.lowStock) {
    const lowStockItems = suppliers.flatMap((supplier) =>
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

  if (suppliersEls.purchaseOrders) {
    suppliersEls.purchaseOrders.innerHTML = currentPurchaseOrders.length
      ? currentPurchaseOrders
          .map(
            (order) => `
              <tr>
                <td>${escapeHtml(order.supplierName)}</td>
                <td>${escapeHtml(order.status)}</td>
                <td>${escapeHtml(order.subject)}</td>
                <td>${escapeHtml(order.createdBy)}</td>
                <td>${formatDateTime(order.createdAt)}</td>
              </tr>
            `
          )
          .join('')
      : '<tr><td colspan="5" class="text-muted">אין עדיין הזמנות רכש.</td></tr>';
  }

  document.querySelectorAll('[data-supplier-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const supplier = currentSuppliers.find((item) => String(item.supplierId) === String(button.dataset.supplierEdit));
      if (supplier) setSupplierFormState(supplier);
    });
  });

  document.querySelectorAll('[data-supplier-order]').forEach((button) => {
    button.addEventListener('click', () => createPurchaseOrder(button.dataset.supplierOrder));
  });
}

function setSupplierFormState(supplier = null) {
  currentEditingSupplierId = supplier ? supplier.supplierId : null;
  if (suppliersEls.saveBtn) suppliersEls.saveBtn.textContent = supplier ? 'שמירת ספק' : 'הוספת ספק';
  if (suppliersEls.name) suppliersEls.name.value = supplier?.supplierName || '';
  if (suppliersEls.email) suppliersEls.email.value = supplier?.email || '';
  if (suppliersEls.phone) suppliersEls.phone.value = supplier?.phone || '';
  if (suppliersEls.notes) suppliersEls.notes.value = supplier?.notes || '';
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
  renderSuppliers(currentSuppliers);
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
        status: 'sent',
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
    renderSuppliers(currentSuppliers);
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

  reportsEls.tableBody.innerHTML = data.length
    ? data
        .map((item) => {
          const row = config.renderRow(item);
          return `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`;
        })
        .join('')
    : `<tr><td colspan="${config.columns.length}" class="text-muted">אין נתונים להצגה.</td></tr>`;
}

async function loadReport(kind) {
  const config = getReportConfig(kind);
  const data = await fetchJson(config.endpoint);
  currentReport = { ...config, kind, data };

  if (reportsEls.title) reportsEls.title.textContent = config.title;
  if (reportsEls.meta) reportsEls.meta.textContent = `ייצוא מהיר ל-${config.csvName}`;
  renderReport(data, config);
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
  if (usersEls.form) usersEls.form.addEventListener('submit', saveUser);
  if (usersEls.role) usersEls.role.addEventListener('change', toggleCustomerTypeField);
  if (usersEls.customerType) usersEls.customerType.addEventListener('change', toggleCustomerTypeField);

  if (suppliersEls.form) suppliersEls.form.addEventListener('submit', saveSupplier);

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

  if (!managerStatus) return;
  setStatus('ברוך הבא לאזור הניהולי. כאן אפשר לנהל ספקים, משתמשים, מלאי ודו"חות.', 'info');
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
