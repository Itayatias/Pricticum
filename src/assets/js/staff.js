import { Modal } from 'bootstrap';

const API_BASE_URL = 'http://localhost:4000';

const authUserRaw = localStorage.getItem('authUser');
const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;

const staffUserLine = document.getElementById('staffUserLine');
const staffStatus = document.getElementById('staffStatus');
const inventoryTableBody = document.getElementById('inventoryTableBody');
const inventoryMovementsList = document.getElementById('inventoryMovementsList');
const inventoryMovementsBody = document.getElementById('inventoryMovementsBody');
const staffSkuCount = document.getElementById('staffSkuCount');
const staffLowStockCount = document.getElementById('staffLowStockCount');
const staffOutOfStockCount = document.getElementById('staffOutOfStockCount');
const managerPanel = document.getElementById('managerPanel');
const inventoryToolbar = document.getElementById('inventoryToolbar');
const inventoryAddProductBtn = document.getElementById('inventoryAddProductBtn');
const inventoryMovementsBtn = document.getElementById('inventoryMovementsBtn');
const inventorySearchInput = document.getElementById('inventorySearchInput');
const inventoryCategoryFilter = document.getElementById('inventoryCategoryFilter');
const inventoryClearFiltersBtn = document.getElementById('inventoryClearFiltersBtn');
const inventoryPagination = document.getElementById('inventoryPagination');
const inventoryPaginationMeta = document.getElementById('inventoryPaginationMeta');
const inventoryPageInfo = document.getElementById('inventoryPageInfo');
const inventoryProductModalEl = document.getElementById('inventoryProductModal');
const inventoryMovementsModalEl = document.getElementById('inventoryMovementsModal');
const inventoryProductModalTitle = document.getElementById('inventoryProductModalTitle');
const inventoryForm = document.getElementById('inventoryForm');
const inventoryProductId = document.getElementById('inventoryProductId');
const inventoryProductName = document.getElementById('inventoryProductName');
const inventoryCategory = document.getElementById('inventoryCategory');
const inventoryPrice = document.getElementById('inventoryPrice');
const inventoryStock = document.getElementById('inventoryStock');
const inventoryMinStock = document.getElementById('inventoryMinStock');
const inventoryLocation = document.getElementById('inventoryLocation');
const inventorySupplierId = document.getElementById('inventorySupplierId');
const inventoryImageUrl = document.getElementById('inventoryImageUrl');
const inventoryImageFile = document.getElementById('inventoryImageFile');
const inventoryImagePreview = document.getElementById('inventoryImagePreview');
const inventoryImagePreviewEmpty = document.getElementById('inventoryImagePreviewEmpty');
const inventoryResetBtn = document.getElementById('inventoryResetBtn');
const inventorySaveBtn = document.getElementById('inventorySaveBtn');
const workHoursStatusBadge = document.getElementById('workHoursStatusBadge');
const workHoursCheckIn = document.getElementById('workHoursCheckIn');
const workHoursCheckOut = document.getElementById('workHoursCheckOut');
const workHoursTodayTotal = document.getElementById('workHoursTodayTotal');
const workHoursShiftCount = document.getElementById('workHoursShiftCount');
const workHoursNotes = document.getElementById('workHoursNotes');
const workHoursCheckInBtn = document.getElementById('workHoursCheckInBtn');
const workHoursCheckOutBtn = document.getElementById('workHoursCheckOutBtn');
const workHoursSaveNoteBtn = document.getElementById('workHoursSaveNoteBtn');
const workHoursExportBtn = document.getElementById('workHoursExportBtn');
const workHoursReportBody = document.getElementById('workHoursReportBody');
const workHoursReportFilterInput = document.getElementById('workHoursReportFilterInput');
const workHoursReportClearFiltersBtn = document.getElementById('workHoursReportClearFiltersBtn');
const workHoursReportPagination = document.getElementById('workHoursReportPagination');
const workHoursReportPaginationMeta = document.getElementById('workHoursReportPaginationMeta');
const workHoursReportPageInfo = document.getElementById('workHoursReportPageInfo');
const purchaseOrdersTableBody = document.getElementById('staffPurchaseOrdersTable');
const purchaseOrdersSearchInput = document.getElementById('staffPurchaseOrdersSearchInput');
const purchaseOrdersStatusFilter = document.getElementById('staffPurchaseOrdersStatusFilter');
const purchaseOrdersClearFiltersBtn = document.getElementById('staffPurchaseOrdersClearFiltersBtn');
const purchaseOrdersPagination = document.getElementById('staffPurchaseOrdersPagination');
const purchaseOrdersPaginationMeta = document.getElementById('staffPurchaseOrdersPaginationMeta');
const purchaseOrdersPageInfo = document.getElementById('staffPurchaseOrdersPageInfo');
const customerOrdersTableBody = document.getElementById('staffCustomerOrdersTable');
const customerOrdersSearchInput = document.getElementById('staffCustomerOrdersSearchInput');
const customerOrdersPagination = document.getElementById('staffCustomerOrdersPagination');
const customerOrdersPaginationMeta = document.getElementById('staffCustomerOrdersPaginationMeta');
const customerOrdersPageInfo = document.getElementById('staffCustomerOrdersPageInfo');
const customerOrdersInProgressTableBody = document.getElementById('staffCustomerOrdersInProgressTable');
const customerOrdersInProgressPagination = document.getElementById('staffCustomerOrdersInProgressPagination');
const customerOrdersInProgressPaginationMeta = document.getElementById('staffCustomerOrdersInProgressPaginationMeta');
const customerOrdersInProgressPageInfo = document.getElementById('staffCustomerOrdersInProgressPageInfo');
const customerOrdersSentTableBody = document.getElementById('staffCustomerOrdersSentTable');
const customerOrdersSentPagination = document.getElementById('staffCustomerOrdersSentPagination');
const customerOrdersSentPaginationMeta = document.getElementById('staffCustomerOrdersSentPaginationMeta');
const customerOrdersSentPageInfo = document.getElementById('staffCustomerOrdersSentPageInfo');
const customerOrdersDoneTableBody = document.getElementById('staffCustomerOrdersDoneTable');
const customerOrdersDonePagination = document.getElementById('staffCustomerOrdersDonePagination');
const customerOrdersDonePaginationMeta = document.getElementById('staffCustomerOrdersDonePaginationMeta');
const customerOrdersDonePageInfo = document.getElementById('staffCustomerOrdersDonePageInfo');
const staffLogoutLink = document.querySelector('[data-staff-logout]');

let currentEditProductId = null;
let inventoryProductModal = null;
let inventoryMovementsModal = null;
let workHoursReportState = {
  allItems: [],
  filteredItems: [],
  currentPage: 1,
  pageSize: 15,
};
let purchaseOrdersState = {
  allItems: [],
  filteredItems: [],
  currentPage: 1,
  pageSize: 15,
};
let customerOrdersState = {
  allItems: [],
  filteredItems: [],
  currentPage: 1,
  pageSize: 15,
};
const customerOrdersPageStates = {
  new: { currentPage: 1, pageSize: 15, allItems: [], filteredItems: [] },
  in_progress: { currentPage: 1, pageSize: 15, allItems: [], filteredItems: [] },
  sent: { currentPage: 1, pageSize: 15, allItems: [], filteredItems: [] },
  done: { currentPage: 1, pageSize: 15, allItems: [], filteredItems: [] },
};
const inventoryPageState = {
  allItems: [],
  filteredItems: [],
  currentPage: 1,
  pageSize: 15,
};
const hasInventoryView = Boolean(inventoryTableBody || inventoryMovementsList);
const hasInventoryFormView = Boolean(inventoryForm);
const hasProductCreateView = Boolean(inventoryPrice || inventoryImageUrl || inventoryImageFile || inventoryImagePreview);
const hasSupplierSelectView = Boolean(inventorySupplierId);
const hasInventoryManagementView = Boolean(inventoryToolbar);
const hasPurchaseOrdersView = Boolean(purchaseOrdersTableBody);
const hasCustomerOrdersView = Boolean(customerOrdersTableBody);
const hasWorkHoursView = Boolean(
  workHoursStatusBadge ||
    workHoursCheckIn ||
    workHoursCheckOut ||
    workHoursTodayTotal ||
    workHoursShiftCount ||
    workHoursNotes ||
    workHoursCheckInBtn ||
    workHoursCheckOutBtn ||
    workHoursSaveNoteBtn ||
    workHoursExportBtn ||
    workHoursReportBody
);

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

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatStockStatus(stock, minStock) {
  if (stock <= 0) return { label: 'אזל', className: 'badge bg-danger' };
  if (stock <= minStock) return { label: 'מלאי נמוך', className: 'badge bg-warning text-dark' };
  return { label: 'תקין', className: 'badge bg-success' };
}

function resetImagePreview() {
  if (inventoryImagePreview) {
    inventoryImagePreview.src = '';
    inventoryImagePreview.classList.add('d-none');
  }
  if (inventoryImagePreviewEmpty) {
    inventoryImagePreviewEmpty.classList.remove('d-none');
  }
}

function setImagePreview(src) {
  if (!inventoryImagePreview) return;
  if (src) {
    inventoryImagePreview.src = src;
    inventoryImagePreview.classList.remove('d-none');
    if (inventoryImagePreviewEmpty) inventoryImagePreviewEmpty.classList.add('d-none');
  } else {
    resetImagePreview();
  }
}

function getTrimmedImageUrl() {
  return String(inventoryImageUrl?.value || '').trim();
}

function getSelectedImageFile() {
  return inventoryImageFile?.files?.[0] || null;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

function isSupportedImageSource(value) {
  return /^(data:image\/|https?:\/\/|\.{1,2}\/|\/)/i.test(String(value || '').trim());
}

function getInventoryProductModal() {
  if (!inventoryProductModal && inventoryProductModalEl) {
    inventoryProductModal = new Modal(inventoryProductModalEl);
  }
  return inventoryProductModal;
}

function getInventoryMovementsModal() {
  if (!inventoryMovementsModal && inventoryMovementsModalEl) {
    inventoryMovementsModal = new Modal(inventoryMovementsModalEl);
  }
  return inventoryMovementsModal;
}

function getProductImageSource() {
  const file = getSelectedImageFile();
  if (file) {
    return readFileAsDataUrl(file);
  }
  return Promise.resolve(getTrimmedImageUrl());
}

function getInventoryProductLabel(productId) {
  const item = (window.__inventoryItems || []).find((entry) => String(entry.productId) === String(productId));
  return item?.productName || String(productId || '');
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

function normalizePurchaseOrderStatusClient(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (['new', 'in_progress', 'picking', 'done'].includes(normalized)) return normalized;
  if (normalized === 'draft' || normalized === 'sent') return 'new';
  return 'new';
}

function getPurchaseOrderStatusClass(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'done') return 'text-bg-success';
  if (normalized === 'picking') return 'text-bg-warning';
  if (normalized === 'in_progress') return 'text-bg-primary';
  if (normalized === 'new') return 'text-bg-danger';
  return 'text-bg-secondary';
}

function isOpenPurchaseOrderStatus(status) {
  return ['new', 'in_progress', 'picking', 'sent', 'draft'].includes(String(status || '').trim().toLowerCase());
}

function getCustomerOrderStatusLabel(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'new') return 'הזמנה חדשה';
  if (normalized === 'in_progress') return 'בתהליך';
  if (normalized === 'sent') return 'נשלח';
  if (normalized === 'done') return 'הושלם';
  return String(status || '--');
}

function getCustomerOrderStatusClass(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'new') return 'text-bg-danger';
  if (normalized === 'in_progress') return 'text-bg-primary';
  if (normalized === 'sent') return 'text-bg-warning';
  if (normalized === 'done') return 'text-bg-success';
  return 'text-bg-secondary';
}

function normalizeCustomerOrderStatusClient(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (['new', 'in_progress', 'sent', 'done'].includes(normalized)) return normalized;
  return 'new';
}

function syncSidebarActiveState() {
  const links = document.querySelectorAll('aside.manager-sidebar nav.manager-nav .manager-nav__link[href]');
  const currentPath = window.location.pathname.split('/').pop() || 'staff.html';
  links.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const linkPath = href.split('/').pop();
    link.classList.toggle('active', linkPath === currentPath);
  });
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

function renderStatusSelect(value, purchaseOrderId) {
  const normalizedValue = normalizePurchaseOrderStatusClient(value);
  return `
    <select class="form-select form-select-sm" data-purchase-order-status="${purchaseOrderId}">
      <option value="new" ${normalizedValue === 'new' ? 'selected' : ''}>חדש</option>
      <option value="in_progress" ${normalizedValue === 'in_progress' ? 'selected' : ''}>בתהליך</option>
      <option value="picking" ${normalizedValue === 'picking' ? 'selected' : ''}>ליקוט</option>
      <option value="done" ${normalizedValue === 'done' ? 'selected' : ''}>בוצע</option>
    </select>
  `;
}

function renderCustomerOrderStatusSelect(value, orderId) {
  const normalizedValue = normalizeCustomerOrderStatusClient(value);
  return `
    <select class="form-select form-select-sm" data-customer-order-status="${orderId}">
      <option value="new" ${normalizedValue === 'new' ? 'selected' : ''}>הזמנה חדשה</option>
      <option value="in_progress" ${normalizedValue === 'in_progress' ? 'selected' : ''}>בתהליך</option>
      <option value="sent" ${normalizedValue === 'sent' ? 'selected' : ''}>נשלח</option>
      <option value="done" ${normalizedValue === 'done' ? 'selected' : ''}>הושלם</option>
    </select>
  `;
}

function updateInventoryPageInfo() {
  if (!inventoryPageInfo) return;
  const total = inventoryPageState.filteredItems.length;
  const from = total ? (inventoryPageState.currentPage - 1) * inventoryPageState.pageSize + 1 : 0;
  const to = Math.min(total, inventoryPageState.currentPage * inventoryPageState.pageSize);
  inventoryPageInfo.textContent = total
    ? `מציגים ${from}-${to} מתוך ${total} מוצרים`
    : 'אין מוצרים תואמים לסינון';
  if (inventoryPaginationMeta) {
    inventoryPaginationMeta.textContent = total
      ? `מקסימום ${inventoryPageState.pageSize} מוצרים בכל עמוד`
      : 'נסה לשנות חיפוש או קטגוריה';
  }
}

function renderInventoryPagination() {
  if (!inventoryPagination) return;

  const totalPages = Math.max(1, Math.ceil(inventoryPageState.filteredItems.length / inventoryPageState.pageSize));
  const currentPage = Math.min(inventoryPageState.currentPage, totalPages);
  inventoryPageState.currentPage = currentPage;

  if (!inventoryPageState.filteredItems.length) {
    inventoryPagination.innerHTML = '';
    updateInventoryPageInfo();
    return;
  }

  const pages = [];
  const visibleRange = 2;
  const startPage = Math.max(1, currentPage - visibleRange);
  const endPage = Math.min(totalPages, currentPage + visibleRange);

  pages.push(`
    <button type="button" class="btn btn-outline-secondary btn-sm" data-page="${Math.max(1, currentPage - 1)}" ${currentPage === 1 ? 'disabled' : ''}>קודם</button>
  `);

  if (startPage > 1) {
    pages.push(`<button type="button" class="btn btn-outline-secondary btn-sm" data-page="1">1</button>`);
    if (startPage > 2) {
      pages.push('<span class="inventory-pagination__ellipsis">…</span>');
    }
  }

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(`
      <button type="button" class="btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-outline-secondary'}" data-page="${page}">
        ${page}
      </button>
    `);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push('<span class="inventory-pagination__ellipsis">…</span>');
    }
    pages.push(`<button type="button" class="btn btn-outline-secondary btn-sm" data-page="${totalPages}">${totalPages}</button>`);
  }

  pages.push(`
    <button type="button" class="btn btn-outline-secondary btn-sm" data-page="${Math.min(totalPages, currentPage + 1)}" ${currentPage === totalPages ? 'disabled' : ''}>הבא</button>
  `);

  inventoryPagination.innerHTML = pages.join('');
  updateInventoryPageInfo();
}

function getFilteredInventoryItems() {
  const searchTerm = String(inventorySearchInput?.value || '').trim().toLowerCase();
  const category = String(inventoryCategoryFilter?.value || '').trim();

  return inventoryPageState.allItems.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      String(item.productName || '').toLowerCase().includes(searchTerm) ||
      String(item.productId || '').toLowerCase().includes(searchTerm);
    const matchesCategory = !category || String(item.category || '') === category;
    return matchesSearch && matchesCategory;
  });
}

function renderInventoryPageTable() {
  if (!inventoryTableBody) return;

  inventoryPageState.filteredItems = getFilteredInventoryItems();
  const totalPages = Math.max(1, Math.ceil(inventoryPageState.filteredItems.length / inventoryPageState.pageSize));
  inventoryPageState.currentPage = Math.min(inventoryPageState.currentPage, totalPages);
  const startIndex = (inventoryPageState.currentPage - 1) * inventoryPageState.pageSize;
  const pageItems = inventoryPageState.filteredItems.slice(startIndex, startIndex + inventoryPageState.pageSize);

  if (!pageItems.length) {
    inventoryTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-muted">אין מוצרים התואמים לסינון הנוכחי.</td>
      </tr>
    `;
    renderInventoryPagination();
    return;
  }

  inventoryTableBody.innerHTML = pageItems
    .map((item) => {
      const stockStatus = formatStockStatus(item.stock, item.min_stock);
      return `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-3 inventory-product-cell">
              ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.productName}" class="rounded-3 inventory-product-thumb">` : '<div class="inventory-product-thumb inventory-product-thumb--empty"><i class="bi bi-box-seam"></i></div>'}
              <div>
                <div class="fw-semibold">${item.productName}</div>
                <div class="text-muted small">מיקום: ${item.location || 'מחסן ראשי'}</div>
                <div class="text-muted small">קוד: ${item.productId}</div>
              </div>
            </div>
          </td>
          <td>${item.category}</td>
          <td>${item.price ? `₪ ${Number(item.price).toFixed(2)}` : '—'}</td>
          <td><span class="fw-semibold">${item.stock}</span></td>
          <td>${item.min_stock}</td>
          <td><span class="${stockStatus.className}">${stockStatus.label}</span></td>
          <td>
            <div class="d-flex gap-2 flex-wrap inventory-actions">
              <button type="button" class="btn btn-outline-secondary btn-sm" data-adjust-stock="+5" data-product-id="${item.productId}">+5</button>
              <button type="button" class="btn btn-outline-secondary btn-sm" data-adjust-stock="-5" data-product-id="${item.productId}">-5</button>
              <button type="button" class="btn btn-dark btn-sm" data-adjust-stock="+1" data-product-id="${item.productId}">+1</button>
              <button type="button" class="btn btn-outline-danger btn-sm" data-adjust-stock="-1" data-product-id="${item.productId}">-1</button>
              <button type="button" class="btn btn-outline-dark btn-sm" data-edit-inventory="${item.productId}">ערוך</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  renderSummary(inventoryPageState.filteredItems);
  bindInventoryButtons();
  renderInventoryPagination();
}

function syncInventoryCategoryOptions(items) {
  if (!inventoryCategoryFilter) return;
  const currentValue = inventoryCategoryFilter.value;
  const categories = [...new Set(items.map((item) => String(item.category || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'he'));
  inventoryCategoryFilter.innerHTML = `
    <option value="">כל הקטגוריות</option>
    ${categories.map((category) => `<option value="${category}">${category}</option>`).join('')}
  `;
  inventoryCategoryFilter.value = categories.includes(currentValue) ? currentValue : '';
}

function openInventoryProductModal(item = null) {
  if (!inventoryForm) return;

  if (item) {
    loadItemIntoForm(item);
    if (inventoryProductModalTitle) inventoryProductModalTitle.textContent = 'עריכת מוצר';
  } else {
    resetInventoryForm();
    currentEditProductId = null;
    if (inventoryProductId) inventoryProductId.readOnly = false;
    if (inventoryProductModalTitle) inventoryProductModalTitle.textContent = 'הוספת מוצר חדש';
  }

  const modal = getInventoryProductModal();
  modal?.show();
}

async function openInventoryMovementsModal() {
  const modal = getInventoryMovementsModal();
  if (modal) modal.show();
  try {
    await loadMovements();
  } catch (_err) {
    setStatus('לא ניתן לטעון תנועות מלאי כרגע.', 'danger');
  }
}

function applyInventoryFilters(resetPage = false) {
  if (resetPage) {
    inventoryPageState.currentPage = 1;
  }
  if (!inventoryPageState.allItems.length) {
    inventoryPageState.filteredItems = [];
    renderInventoryPageTable();
    return;
  }
  renderInventoryPageTable();
}

async function loadSupplierOptions() {
  if (!inventorySupplierId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/suppliers?userId=${authUser.id}`);
    const suppliers = await response.json();
    if (!response.ok) {
      throw new Error(suppliers.message || 'Failed to load suppliers');
    }

    const options = suppliers
      .map((supplier) => `<option value="${supplier.supplierId}">${supplier.supplierName}</option>`)
      .join('');

    inventorySupplierId.innerHTML = `
      <option value="">ללא ספק משויך</option>
      ${options}
    `;
  } catch (_err) {
    inventorySupplierId.innerHTML = '<option value="">לא ניתן לטעון ספקים</option>';
  }
}

function getWorkHoursStorageKey() {
  return authUser?.id ? `staff-work-hours:${authUser.id}` : 'staff-work-hours:guest';
}

function getActiveShiftStorageKey() {
  return authUser?.id ? `staff-work-hours-active:${authUser.id}` : 'staff-work-hours-active:guest';
}

function loadWorkHoursEntries() {
  try {
    const raw = localStorage.getItem(getWorkHoursStorageKey());
    return raw ? JSON.parse(raw) : [];
  } catch (_err) {
    return [];
  }
}

function saveWorkHoursEntries(entries) {
  localStorage.setItem(getWorkHoursStorageKey(), JSON.stringify(entries));
}

function loadActiveShift() {
  try {
    const raw = localStorage.getItem(getActiveShiftStorageKey());
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
}

function saveActiveShift(shift) {
  if (!shift) {
    localStorage.removeItem(getActiveShiftStorageKey());
    return;
  }
  localStorage.setItem(getActiveShiftStorageKey(), JSON.stringify(shift));
}

async function syncShiftStart(shift) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/work-hours/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: shift.userId,
        checkIn: shift.checkIn,
        notes: shift.notes,
      }),
    });
    const data = await response.json();
    if (!response.ok) return null;
    return data.shift || null;
  } catch (_err) {
    return null;
  }
}

async function syncShiftFinish(shiftId, checkOut, notes) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/work-hours/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: authUser.id,
        shiftId,
        checkOut,
        notes,
      }),
    });
    if (!response.ok) return false;
    return true;
  } catch (_err) {
    return false;
  }
}

async function syncShiftNote(shiftId, notes) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/work-hours/note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: authUser.id,
        shiftId,
        notes,
      }),
    });
    if (!response.ok) return false;
    return true;
  } catch (_err) {
    return false;
  }
}

async function loadPurchaseOrders() {
  const response = await fetch(`${API_BASE_URL}/api/staff/purchase-orders?userId=${authUser.id}`);
  const orders = await response.json();
  if (!response.ok) {
    throw new Error(orders.message || 'Failed to load purchase orders');
  }

  purchaseOrdersState.allItems = orders;
  applyPurchaseOrderFilters(true);
}

async function updatePurchaseOrderStatus(purchaseOrderId, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/staff/purchase-orders/${purchaseOrderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: authUser.id,
        status,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update purchase order status');
    }

    setStatus('סטטוס ההזמנה עודכן בהצלחה.', 'success');
    await loadPurchaseOrders();
  } catch (_err) {
    setStatus('לא ניתן לעדכן את סטטוס ההזמנה כרגע.', 'danger');
  }
}

function formatClockValue(value) {
  if (!value) return '--';
  return new Date(value).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function formatMoney(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return '₪ 0.00';
  return `₪ ${amount.toFixed(2)}`;
}

function formatDateTime(value) {
  if (!value) return '--';
  return new Date(value).toLocaleString('he-IL');
}

function formatDateValue(value) {
  return new Date(value).toLocaleDateString('he-IL');
}

function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}

function getEntryDuration(entry) {
  if (!entry?.checkIn) return 0;
  const start = new Date(entry.checkIn).getTime();
  const end = entry.checkOut ? new Date(entry.checkOut).getTime() : Date.now();
  return Math.max(0, end - start);
}

function getTodayTotal(entries) {
  const today = new Date().toISOString().slice(0, 10);
  const completedTotal = entries
    .filter((entry) => String(entry.checkIn || '').slice(0, 10) === today)
    .reduce((sum, entry) => sum + getEntryDuration(entry), 0);
  const activeShift = loadActiveShift();
  if (activeShift && String(activeShift.checkIn || '').slice(0, 10) === today) {
    return completedTotal + getEntryDuration(activeShift);
  }
  return completedTotal;
}

function updateWorkHoursSummary(entries) {
  const activeShift = loadActiveShift();
  const sortedEntries = [...entries].sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));

  if (workHoursStatusBadge) {
    const isActive = Boolean(activeShift);
    workHoursStatusBadge.textContent = isActive ? 'משמרת פעילה' : 'לא התחלת משמרת';
    workHoursStatusBadge.className = `badge ${isActive ? 'text-bg-success' : 'text-bg-secondary'}`;
  }

  if (workHoursCheckIn) workHoursCheckIn.textContent = formatClockValue(activeShift?.checkIn || sortedEntries[0]?.checkIn);
  if (workHoursCheckOut) workHoursCheckOut.textContent = formatClockValue(activeShift?.checkOut || sortedEntries[0]?.checkOut);
  if (workHoursTodayTotal) workHoursTodayTotal.textContent = formatDuration(getTodayTotal(entries));
  if (workHoursShiftCount) workHoursShiftCount.textContent = String(entries.length);
}

function renderWorkHoursReport(entries) {
  if (!workHoursReportBody) return;

  const activeShift = loadActiveShift();
  const sortedEntries = [...entries].sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
  const reportEntries = activeShift ? [activeShift, ...sortedEntries] : sortedEntries;
  workHoursReportState.allItems = reportEntries;
  applyWorkHoursReportFilters(true);
}

function applyWorkHoursReportFilters(resetPage = false) {
  if (resetPage) workHoursReportState.currentPage = 1;

  const searchTerm = String(workHoursReportFilterInput?.value || '').trim().toLowerCase();
  workHoursReportState.filteredItems = workHoursReportState.allItems.filter((entry) => {
    if (!searchTerm) return true;
    return [
      formatDateValue(entry.checkIn),
      formatClockValue(entry.checkIn),
      entry.checkOut ? formatClockValue(entry.checkOut) : 'פעילה',
      formatDuration(getEntryDuration(entry)),
      String(entry.notes || ''),
    ]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm);
  });

  renderWorkHoursReportPage();
}

function renderWorkHoursReportPage() {
  if (!workHoursReportBody) return;

  const { pageItems } = getPageItems(workHoursReportState.filteredItems, workHoursReportState);
  if (!pageItems.length) {
    workHoursReportBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-muted">אין עדיין משמרות מתועדות.</td>
      </tr>
    `;
    renderPagination(workHoursReportPagination, workHoursReportState, workHoursReportPaginationMeta, workHoursReportPageInfo, 'שורות');
    return;
  }

  workHoursReportBody.innerHTML = pageItems
    .map((entry) => `
      <tr>
        <td>${formatDateValue(entry.checkIn)}</td>
        <td>${formatClockValue(entry.checkIn)}</td>
        <td>${entry.checkOut ? formatClockValue(entry.checkOut) : 'פעילה'}</td>
        <td>${formatDuration(getEntryDuration(entry))}</td>
      </tr>
    `)
    .join('');

  renderPagination(workHoursReportPagination, workHoursReportState, workHoursReportPaginationMeta, workHoursReportPageInfo, 'שורות');
}

function renderWorkHours() {
  const entries = loadWorkHoursEntries();
  updateWorkHoursSummary(entries);
  renderWorkHoursReport(entries);
}

function renderPurchaseOrders() {
  if (!purchaseOrdersTableBody) return;

  const { pageItems } = getPageItems(purchaseOrdersState.filteredItems, purchaseOrdersState);
  if (!pageItems.length) {
    purchaseOrdersTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-muted">אין הזמנות התואמות לסינון הנוכחי.</td>
      </tr>
    `;
    renderPagination(purchaseOrdersPagination, purchaseOrdersState, purchaseOrdersPaginationMeta, purchaseOrdersPageInfo, 'הזמנות');
    return;
  }

  purchaseOrdersTableBody.innerHTML = pageItems
    .map(
      (order) => `
        <tr>
          <td>
            <div class="fw-semibold">${escapeHtml(order.supplierName || '')}</div>
            <div class="text-muted small">${escapeHtml(order.supplierCode || '--')} · ${escapeHtml(order.productCategory || '--')}</div>
          </td>
          <td>
            <div class="fw-semibold">${escapeHtml(order.subject || 'הזמנה חדשה')}</div>
            <div class="text-muted small">${escapeHtml(order.body || '')}</div>
          </td>
          <td>
            <span class="badge text-bg-light border">${escapeHtml(order.itemCount ?? 0)} פריטים</span>
          </td>
          <td>
            <span class="badge ${getPurchaseOrderStatusClass(order.status)}">${getPurchaseOrderStatusLabel(order.status)}</span>
          </td>
          <td>
            ${renderStatusSelect(order.status, order.id)}
          </td>
          <td>${escapeHtml(order.createdBy || '--')}</td>
          <td>${formatDateTime(order.createdAt)}</td>
          <td>
            <button type="button" class="btn btn-dark btn-sm" data-purchase-order-save="${order.id}">שמור סטטוס</button>
          </td>
        </tr>
      `
    )
    .join('');

  bindPurchaseOrderButtons();
  renderPagination(purchaseOrdersPagination, purchaseOrdersState, purchaseOrdersPaginationMeta, purchaseOrdersPageInfo, 'הזמנות');
}

function applyPurchaseOrderFilters(resetPage = false) {
  if (resetPage) purchaseOrdersState.currentPage = 1;

  const searchTerm = String(purchaseOrdersSearchInput?.value || '').trim().toLowerCase();
  const statusFilter = String(purchaseOrdersStatusFilter?.value || 'open').trim();

  purchaseOrdersState.filteredItems = purchaseOrdersState.allItems.filter((order) => {
    const normalizedStatus = String(order.status || '').trim().toLowerCase();
    const matchesSearch =
      !searchTerm ||
      String(order.supplierName || '').toLowerCase().includes(searchTerm) ||
      String(order.supplierCode || '').toLowerCase().includes(searchTerm) ||
      String(order.subject || '').toLowerCase().includes(searchTerm) ||
      String(order.body || '').toLowerCase().includes(searchTerm) ||
      String(order.createdBy || '').toLowerCase().includes(searchTerm);

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'open'
          ? isOpenPurchaseOrderStatus(normalizedStatus)
          : normalizedStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  renderPurchaseOrders();
}

function bindPurchaseOrderButtons() {
  document.querySelectorAll('[data-purchase-order-save]').forEach((button) => {
    button.addEventListener('click', () => {
      const orderId = button.dataset.purchaseOrderSave;
      const select = document.querySelector(`[data-purchase-order-status="${orderId}"]`);
      if (!select) return;
      updatePurchaseOrderStatus(orderId, select.value);
    });
  });
}

async function loadCustomerOrders() {
  const response = await fetch(`${API_BASE_URL}/api/staff/customer-orders?userId=${authUser.id}`);
  const orders = await response.json();
  if (!response.ok) {
    throw new Error(orders.message || 'Failed to load customer orders');
  }

  customerOrdersState.allItems = orders;
  applyCustomerOrdersFilters(true);
}

function getCustomerOrdersFilteredItems() {
  const searchTerm = String(customerOrdersSearchInput?.value || '').trim().toLowerCase();
  return customerOrdersState.allItems.filter((order) => {
    if (!searchTerm) return true;
    return [
      `#${order.id}`,
      String(order.customerName || ''),
      String(order.customerEmail || ''),
      String(order.customerType || ''),
      String(order.totalAmount || ''),
      String(order.itemCount || ''),
      String(order.status || ''),
      String(order.staffNotes || ''),
      formatDateTime(order.createdAt),
    ]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm);
  });
}

function renderCustomerOrderTable(tableBody, paginationEl, metaEl, pageInfoEl, state, statusFilter, emptyLabel) {
  if (!tableBody) return;

  const filteredItems = state.filteredItems.filter((order) => normalizeCustomerOrderStatusClient(order.status) === statusFilter);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / state.pageSize));
  state.currentPage = Math.min(state.currentPage, totalPages);
  const startIndex = (state.currentPage - 1) * state.pageSize;
  const pageItems = filteredItems.slice(startIndex, startIndex + state.pageSize);

  if (!pageItems.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-muted">${escapeHtml(emptyLabel)}</td>
      </tr>
    `;
    renderPagination(paginationEl, { ...state, filteredItems }, metaEl, pageInfoEl, 'הזמנות');
    return;
  }

  tableBody.innerHTML = pageItems
    .map(
      (order) => `
        <tr>
          <td>
            <div class="fw-semibold">#${escapeHtml(order.id)}</div>
            <div class="text-muted small">${escapeHtml(order.customerType || 'פרטי')}</div>
          </td>
          <td>
            <div class="fw-semibold">${escapeHtml(order.customerName || '--')}</div>
            <div class="text-muted small">${escapeHtml(order.customerEmail || '--')}</div>
          </td>
          <td>
            <span class="badge text-bg-light border">${escapeHtml(order.itemCount ?? 0)} פריטים</span>
          </td>
          <td>${formatMoney(order.totalAmount)}</td>
          <td>
            <span class="badge ${getCustomerOrderStatusClass(order.status)}">${getCustomerOrderStatusLabel(order.status)}</span>
          </td>
          <td>
            ${renderCustomerOrderStatusSelect(order.status, order.id)}
            <textarea class="form-control form-control-sm mt-2" rows="2" placeholder="הערות להזמנה" data-customer-order-notes="${order.id}">${escapeHtml(order.staffNotes || '')}</textarea>
          </td>
          <td>${formatDateTime(order.createdAt)}</td>
          <td>
            <button type="button" class="btn btn-dark btn-sm" data-customer-order-save="${order.id}">שמור</button>
          </td>
        </tr>
      `
    )
    .join('');

  bindCustomerOrderButtons();
  renderPagination(paginationEl, { ...state, filteredItems }, metaEl, pageInfoEl, 'הזמנות');
}

function renderCustomerOrders() {
  if (!customerOrdersTableBody) return;

  const newOrdersState = customerOrdersPageStates.new;
  const inProgressState = customerOrdersPageStates.in_progress;
  const sentState = customerOrdersPageStates.sent;
  const doneState = customerOrdersPageStates.done;

  newOrdersState.filteredItems = customerOrdersState.filteredItems;
  inProgressState.filteredItems = customerOrdersState.filteredItems;
  sentState.filteredItems = customerOrdersState.filteredItems;
  doneState.filteredItems = customerOrdersState.filteredItems;

  renderCustomerOrderTable(
    customerOrdersTableBody,
    customerOrdersPagination,
    customerOrdersPaginationMeta,
    customerOrdersPageInfo,
    newOrdersState,
    'new',
    'אין הזמנות חדשות התואמות לסינון הנוכחי.'
  );
  renderCustomerOrderTable(
    customerOrdersInProgressTableBody,
    customerOrdersInProgressPagination,
    customerOrdersInProgressPaginationMeta,
    customerOrdersInProgressPageInfo,
    inProgressState,
    'in_progress',
    'אין הזמנות בתהליך.'
  );
  renderCustomerOrderTable(
    customerOrdersSentTableBody,
    customerOrdersSentPagination,
    customerOrdersSentPaginationMeta,
    customerOrdersSentPageInfo,
    sentState,
    'sent',
    'אין הזמנות שנשלחו.'
  );
  renderCustomerOrderTable(
    customerOrdersDoneTableBody,
    customerOrdersDonePagination,
    customerOrdersDonePaginationMeta,
    customerOrdersDonePageInfo,
    doneState,
    'done',
    'אין הזמנות שהושלמו.'
  );
}

function applyCustomerOrdersFilters(resetPage = false) {
  if (resetPage) {
    customerOrdersState.currentPage = 1;
    Object.values(customerOrdersPageStates).forEach((state) => {
      state.currentPage = 1;
    });
  }

  customerOrdersState.filteredItems = getCustomerOrdersFilteredItems();
  renderCustomerOrders();
}

async function updateCustomerOrder(orderId, status, notes) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/staff/customer-orders/${orderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: authUser.id,
        status,
        notes,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update customer order');
    }

    setStatus('הזמנת הלקוח עודכנה בהצלחה.', 'success');
    await loadCustomerOrders();
  } catch (_err) {
    setStatus('לא ניתן לעדכן את הזמנת הלקוח כרגע.', 'danger');
  }
}

function bindCustomerOrderButtons() {
  document.querySelectorAll('[data-customer-order-save]').forEach((button) => {
    button.addEventListener('click', () => {
      const orderId = button.dataset.customerOrderSave;
      const select = document.querySelector(`[data-customer-order-status="${orderId}"]`);
      const notes = document.querySelector(`[data-customer-order-notes="${orderId}"]`);
      if (!select || !notes) return;
      updateCustomerOrder(orderId, select.value, notes.value);
    });
  });
}

async function startShift() {
  if (loadActiveShift()) {
    setStatus('כבר קיימת משמרת פעילה. יש לסיים אותה לפני פתיחת משמרת חדשה.', 'warning');
    return;
  }

  const activeShift = {
    id: `shift-${Date.now()}`,
    userId: authUser.id,
    fullName: authUser.fullName,
    checkIn: new Date().toISOString(),
    checkOut: null,
    notes: String(workHoursNotes?.value || '').trim(),
  };

  saveActiveShift(activeShift);
  const serverShift = await syncShiftStart(activeShift);
  if (serverShift?.id) {
    saveActiveShift({
      ...activeShift,
      id: serverShift.id,
    });
  }
  setStatus('משמרת נפתחה ונשמרה בהצלחה.', 'success');
  renderWorkHours();
}

async function endShift() {
  const activeShift = loadActiveShift();
  if (!activeShift) {
    setStatus('אין משמרת פעילה לסיום.', 'warning');
    return;
  }

  const entries = loadWorkHoursEntries();
  const finishedShift = {
    ...activeShift,
    checkOut: new Date().toISOString(),
    notes: String(workHoursNotes?.value || activeShift.notes || '').trim(),
  };

  entries.unshift(finishedShift);
  saveWorkHoursEntries(entries);
  const numericShiftId = Number(activeShift.id);
  if (Number.isInteger(numericShiftId) && numericShiftId > 0) {
    await syncShiftFinish(numericShiftId, finishedShift.checkOut, finishedShift.notes);
  }
  saveActiveShift(null);
  setStatus('המשמרת נסגרה ונשמרה בדו"ח.', 'success');
  renderWorkHours();
}

async function saveShiftNote() {
  const activeShift = loadActiveShift();
  if (!activeShift) {
    setStatus('אפשר לשמור הערה רק בזמן משמרת פעילה.', 'warning');
    return;
  }

  const updatedShift = {
    ...activeShift,
    notes: String(workHoursNotes?.value || '').trim(),
  };
  saveActiveShift(updatedShift);
  const numericShiftId = Number(updatedShift.id);
  if (Number.isInteger(numericShiftId) && numericShiftId > 0) {
    await syncShiftNote(numericShiftId, updatedShift.notes);
  }
  setStatus('הערת המשמרת נשמרה.', 'success');
  renderWorkHours();
}

function exportWorkHoursReport() {
  const activeShift = loadActiveShift();
  const entries = activeShift ? [activeShift, ...loadWorkHoursEntries()] : loadWorkHoursEntries();
  const rows = [
    ['תאריך', 'כניסה', 'יציאה', 'משך', 'הערות'],
    ...entries.map((entry) => [
      formatDateValue(entry.checkIn),
      formatClockValue(entry.checkIn),
      entry.checkOut ? formatClockValue(entry.checkOut) : 'פעילה',
      formatDuration(getEntryDuration(entry)),
      String(entry.notes || '').replaceAll('"', '""'),
    ]),
  ];

  const csv = rows
    .map((row) => row.map((value) => `"${String(value ?? '')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `work-hours-${authUser.id}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  setStatus('דו"ח שעות העבודה יוצא כקובץ CSV.', 'success');
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

  document.querySelectorAll('[data-edit-inventory]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = (window.__inventoryItems || []).find((entry) => entry.productId === button.dataset.editInventory);
      if (item) openInventoryProductModal(item);
    });
  });
}

function loadItemIntoForm(item) {
  currentEditProductId = item.productId;
  if (inventoryProductId) inventoryProductId.value = item.productId;
  if (inventoryProductId) inventoryProductId.readOnly = true;
  if (inventoryProductName) inventoryProductName.value = item.productName;
  if (inventoryCategory) inventoryCategory.value = item.category;
  if (inventoryPrice) inventoryPrice.value = String(item.price ?? '');
  if (inventoryStock) inventoryStock.value = String(item.stock);
  if (inventoryMinStock) inventoryMinStock.value = String(item.min_stock);
  if (inventoryLocation) inventoryLocation.value = item.location || 'מחסן ראשי';
  if (inventorySupplierId) inventorySupplierId.value = item.supplierId ? String(item.supplierId) : '';
  if (inventorySaveBtn) inventorySaveBtn.textContent = 'עדכון מוצר';
  if (inventoryImageUrl) inventoryImageUrl.value = item.imageUrl || '';
  if (inventoryImageFile) inventoryImageFile.value = '';
  setImagePreview(item.imageUrl || '');
  setStatus(`המוצר ${item.productName} נטען לעריכה.`, 'info');
}

function resetInventoryForm() {
  currentEditProductId = null;
  if (inventoryForm) inventoryForm.reset();
  if (inventoryProductId) inventoryProductId.value = '';
  if (inventoryProductId) inventoryProductId.readOnly = false;
  if (inventoryProductName) inventoryProductName.value = '';
  if (inventoryCategory) inventoryCategory.value = 'צבע';
  if (inventoryPrice) inventoryPrice.value = '';
  if (inventoryStock) inventoryStock.value = '0';
  if (inventoryMinStock) inventoryMinStock.value = '5';
  if (inventoryLocation) inventoryLocation.value = 'מחסן ראשי';
  if (inventorySupplierId) inventorySupplierId.value = '';
  if (inventoryImageUrl) inventoryImageUrl.value = '';
  if (inventoryImageFile) inventoryImageFile.value = '';
  if (inventorySaveBtn) inventorySaveBtn.textContent = 'שמירת מוצר';
  resetImagePreview();
}

async function upsertInventoryItem(event) {
  event.preventDefault();

  try {
    const imageFile = getSelectedImageFile();
    const imageUrl = imageFile ? await readFileAsDataUrl(imageFile) : getTrimmedImageUrl();
    const priceValue = inventoryPrice ? Number(inventoryPrice.value || 0) : null;
    const supplierValue = String(inventorySupplierId?.value || '').trim();

    if (hasInventoryManagementView && !currentEditProductId) {
      if (!imageUrl) {
        setStatus('יש לבחור תמונה כדי להוסיף מוצר חדש.', 'warning');
        return;
      }
      if (!isSupportedImageSource(imageUrl)) {
        setStatus('יש להזין קישור תמונה תקין או להעלות קובץ תמונה.', 'warning');
        return;
      }
      if (!Number.isFinite(priceValue) || priceValue <= 0) {
        setStatus('יש להזין מחיר תקין למוצר החדש.', 'warning');
        return;
      }
    }

    const payload = {
      userId: authUser.id,
      productId: String(inventoryProductId?.value || '').trim(),
      productName: String(inventoryProductName?.value || '').trim(),
      category: String(inventoryCategory?.value || '').trim(),
      stock: Number(inventoryStock?.value || 0),
      minStock: Number(inventoryMinStock?.value || 0),
      location: String(inventoryLocation?.value || 'מחסן ראשי').trim(),
    };
    if (supplierValue) {
      payload.supplierId = Number(supplierValue);
    }
    if (Number.isFinite(priceValue) && priceValue > 0) {
      payload.price = priceValue;
    }
    if (imageUrl) {
      payload.imageUrl = imageUrl;
    }

    const response = await fetch(`${API_BASE_URL}/api/inventory/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to save inventory item');
    }

    clearStatus();
    resetInventoryForm();
    if (hasInventoryManagementView) {
      getInventoryProductModal()?.hide();
      inventoryPageState.currentPage = 1;
    }
    await refreshStaffData();
  } catch (_err) {
    setStatus('לא ניתן לשמור את פריט המלאי כרגע.', 'danger');
  }
}

async function createCatalogProduct(event) {
  event.preventDefault();

  try {
    const imageFile = getSelectedImageFile();
    const imageUrl = imageFile ? await readFileAsDataUrl(imageFile) : getTrimmedImageUrl();
    const priceValue = Number(inventoryPrice?.value || 0);

    if (!imageUrl) {
      setStatus('יש לצרף קישור או קובץ תמונה כדי לשמור מוצר חדש.', 'warning');
      return;
    }
    if (!isSupportedImageSource(imageUrl)) {
      setStatus('יש להזין קישור תמונה תקין או להעלות קובץ תמונה.', 'warning');
      return;
    }

    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      setStatus('יש להזין מחיר תקין למוצר החדש.', 'warning');
      return;
    }

    const payload = {
      userId: authUser.id,
      productId: String(inventoryProductId?.value || '').trim(),
      productName: String(inventoryProductName?.value || '').trim(),
      category: String(inventoryCategory?.value || '').trim(),
      price: priceValue,
      stock: Number(inventoryStock?.value || 0),
      minStock: Number(inventoryMinStock?.value || 0),
      location: String(inventoryLocation?.value || 'מחסן ראשי').trim(),
      imageUrl,
    };
    if (inventorySupplierId?.value) {
      payload.supplierId = Number(inventorySupplierId.value);
    }

    if (!payload.productId || !payload.productName || !payload.category) {
      setStatus('יש למלא את כל שדות החובה של המוצר.', 'warning');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/inventory/create-product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create product');
    }

    clearStatus();
    resetInventoryForm();
    setStatus('המוצר נוסף בהצלחה ויופיע בקטלוג המוצרים.', 'success');
  } catch (_err) {
    setStatus('לא ניתן לשמור את המוצר כרגע. ודא שיש תמונה, מחיר ופרטים תקינים.', 'danger');
  }
}

function renderInventory(items) {
  if (!inventoryTableBody) return;

  window.__inventoryItems = items;

  if (hasInventoryManagementView) {
    inventoryPageState.allItems = [...items];
    syncInventoryCategoryOptions(items);
    applyInventoryFilters(true);
    return;
  }

  inventoryTableBody.innerHTML = items
    .map((item) => {
      const stockStatus = formatStockStatus(item.stock, item.min_stock);
      return `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-3">
              ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.productName}" class="rounded-3" style="width: 48px; height: 48px; object-fit: cover;">` : ''}
              <div>
                <div class="fw-semibold">${item.productName}</div>
                <div class="text-muted small">מיקום: ${item.location}</div>
                ${item.supplierName ? `<div class="text-muted small">ספק: ${item.supplierName}</div>` : ''}
                ${item.price ? `<div class="text-muted small">מחיר: ₪ ${Number(item.price).toFixed(2)}</div>` : ''}
              </div>
            </div>
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
              <button type="button" class="btn btn-outline-dark btn-sm" data-edit-inventory="${item.productId}">ערוך</button>
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
  if (inventoryMovementsBody) {
    if (!movements.length) {
      inventoryMovementsBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-muted">אין עדיין תנועות מלאי.</td>
        </tr>
      `;
      return;
    }

    inventoryMovementsBody.innerHTML = movements
      .map(
        (movement) => `
          <tr>
            <td class="fw-semibold">${escapeHtml(getInventoryProductLabel(movement.productId))}</td>
            <td class="${movement.delta > 0 ? 'text-success' : movement.delta < 0 ? 'text-danger' : 'text-muted'}">
              ${movement.delta > 0 ? '+' : ''}${escapeHtml(movement.delta)}
            </td>
            <td>${escapeHtml(movement.reason)}</td>
            <td>${new Date(movement.createdAt).toLocaleString('he-IL')}</td>
          </tr>
        `
      )
      .join('');
    return;
  }

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
              <span class="fw-semibold">${escapeHtml(getInventoryProductLabel(movement.productId))}</span>
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
  if (hasInventoryManagementView) {
    await loadInventory();
    if (inventoryMovementsModalEl?.classList.contains('show')) {
      await loadMovements();
    }
    return;
  }

  if (hasInventoryView) {
    await loadInventory();
    await loadMovements();
  }

  if (hasPurchaseOrdersView) {
    await loadPurchaseOrders();
  }

  if (hasCustomerOrdersView) {
    await loadCustomerOrders();
  }
}

function init() {
  if (!requireStaff()) return;

  if (staffUserLine) {
    const roleLabel = authUser.role === 'manager' ? 'מנהל חנות' : 'עובד חנות';
    staffUserLine.textContent = `מחובר כ-${authUser.fullName} · ${roleLabel}`;
  }

  syncSidebarActiveState();

  if (managerPanel && authUser.role === 'manager') {
    managerPanel.classList.remove('d-none');
  }

  if (inventoryForm) {
    if (hasInventoryManagementView) {
      inventoryForm.addEventListener('submit', upsertInventoryItem);
    } else if (hasProductCreateView) {
      inventoryForm.addEventListener('submit', createCatalogProduct);
    } else {
      inventoryForm.addEventListener('submit', upsertInventoryItem);
    }
  }
  if (hasSupplierSelectView) {
    loadSupplierOptions();
  }
  if (inventoryResetBtn) inventoryResetBtn.addEventListener('click', resetInventoryForm);
  if (inventoryAddProductBtn) {
    inventoryAddProductBtn.addEventListener('click', () => openInventoryProductModal(null));
  }
  if (inventoryMovementsBtn) {
    inventoryMovementsBtn.addEventListener('click', () => {
      openInventoryMovementsModal();
    });
  }
  if (inventorySearchInput) {
    inventorySearchInput.addEventListener('input', () => applyInventoryFilters(true));
  }
  if (inventoryCategoryFilter) {
    inventoryCategoryFilter.addEventListener('change', () => applyInventoryFilters(true));
  }
  if (inventoryClearFiltersBtn) {
    inventoryClearFiltersBtn.addEventListener('click', () => {
      if (inventorySearchInput) inventorySearchInput.value = '';
      if (inventoryCategoryFilter) inventoryCategoryFilter.value = '';
      applyInventoryFilters(true);
    });
  }
  if (inventoryPagination) {
    inventoryPagination.addEventListener('click', (event) => {
      const target = event.target.closest('[data-page]');
      if (!target || target.disabled) return;
      const page = Number(target.dataset.page);
      if (!Number.isInteger(page) || page < 1) return;
      inventoryPageState.currentPage = page;
      renderInventoryPageTable();
    });
  }
  if (purchaseOrdersSearchInput) {
    purchaseOrdersSearchInput.addEventListener('input', () => applyPurchaseOrderFilters(true));
  }
  if (purchaseOrdersStatusFilter) {
    purchaseOrdersStatusFilter.addEventListener('change', () => applyPurchaseOrderFilters(true));
  }
  if (purchaseOrdersClearFiltersBtn) {
    purchaseOrdersClearFiltersBtn.addEventListener('click', () => {
      if (purchaseOrdersSearchInput) purchaseOrdersSearchInput.value = '';
      if (purchaseOrdersStatusFilter) purchaseOrdersStatusFilter.value = 'open';
      applyPurchaseOrderFilters(true);
    });
  }
  if (purchaseOrdersPagination) {
    purchaseOrdersPagination.addEventListener('click', (event) => {
      const target = event.target.closest('[data-page]');
      if (!target || target.disabled) return;
      const page = Number(target.dataset.page);
      if (!Number.isInteger(page) || page < 1) return;
      purchaseOrdersState.currentPage = page;
      renderPurchaseOrders();
    });
  }
  if (customerOrdersSearchInput) {
    customerOrdersSearchInput.addEventListener('input', () => applyCustomerOrdersFilters(true));
  }
  const customerOrdersPaginationTargets = [
    [customerOrdersPagination, customerOrdersPageStates.new],
    [customerOrdersInProgressPagination, customerOrdersPageStates.in_progress],
    [customerOrdersSentPagination, customerOrdersPageStates.sent],
    [customerOrdersDonePagination, customerOrdersPageStates.done],
  ];
  customerOrdersPaginationTargets.forEach(([container, state]) => {
    if (!container) return;
    container.addEventListener('click', (event) => {
      const target = event.target.closest('[data-page]');
      if (!target || target.disabled) return;
      const page = Number(target.dataset.page);
      if (!Number.isInteger(page) || page < 1) return;
      state.currentPage = page;
      renderCustomerOrders();
    });
  });
  if (workHoursReportFilterInput) {
    workHoursReportFilterInput.addEventListener('input', () => applyWorkHoursReportFilters(true));
  }
  if (workHoursReportClearFiltersBtn) {
    workHoursReportClearFiltersBtn.addEventListener('click', () => {
      if (workHoursReportFilterInput) workHoursReportFilterInput.value = '';
      applyWorkHoursReportFilters(true);
    });
  }
  if (workHoursReportPagination) {
    workHoursReportPagination.addEventListener('click', (event) => {
      const target = event.target.closest('[data-page]');
      if (!target || target.disabled) return;
      const page = Number(target.dataset.page);
      if (!Number.isInteger(page) || page < 1) return;
      workHoursReportState.currentPage = page;
      renderWorkHoursReportPage();
    });
  }
  if (inventoryProductModalEl) {
    inventoryProductModalEl.addEventListener('hidden.bs.modal', () => {
      resetInventoryForm();
      if (inventoryProductModalTitle) inventoryProductModalTitle.textContent = 'הוספת מוצר חדש';
    });
  }
  if (inventoryImageUrl) {
    inventoryImageUrl.addEventListener('input', () => {
      const url = getTrimmedImageUrl();
      if (url) {
        setImagePreview(url);
      } else if (!getSelectedImageFile()) {
        resetImagePreview();
      }
    });
  }
  if (inventoryImageFile) {
    inventoryImageFile.addEventListener('change', async () => {
      const file = getSelectedImageFile();
      if (!file) {
        if (!getTrimmedImageUrl()) resetImagePreview();
        return;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        setImagePreview(dataUrl);
      } catch (_err) {
        setStatus('לא ניתן לקרוא את קובץ התמונה שנבחר.', 'danger');
      }
    });
  }
  if (workHoursCheckInBtn) workHoursCheckInBtn.addEventListener('click', startShift);
  if (workHoursCheckOutBtn) workHoursCheckOutBtn.addEventListener('click', endShift);
  if (workHoursSaveNoteBtn) workHoursSaveNoteBtn.addEventListener('click', saveShiftNote);
  if (workHoursExportBtn) workHoursExportBtn.addEventListener('click', exportWorkHoursReport);
  if (staffLogoutLink) {
    staffLogoutLink.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.removeItem('authUser');
      window.location.href = 'login.html';
    });
  }

  if (hasInventoryView && hasWorkHoursView) {
    setStatus('כאן אפשר לנהל מלאי ולעקוב אחרי שעות עבודה מהמסכים הייעודיים.', 'info');
  } else if (hasInventoryView) {
    setStatus('כאן אפשר לעדכן מלאי, לעקוב אחרי תנועות ולהמשיך להרחיב את שכבת הניהול.', 'info');
  } else if (hasInventoryFormView) {
    setStatus('כאן אפשר להוסיף מוצר חדש למערכת עם תמונה ומחיר.', 'info');
    resetImagePreview();
  } else if (hasPurchaseOrdersView) {
    setStatus('כאן רואים הזמנות חדשות ויכולים לעדכן את הסטטוס שלהן.', 'info');
  } else if (hasCustomerOrdersView) {
    setStatus('כאן רואים הזמנות לקוחות שבוצעו באתר.', 'info');
  } else if (hasWorkHoursView) {
    setStatus('כאן אפשר לתעד כניסה ויציאה למשמרת ולייצא את דו"ח השעות.', 'info');
  } else {
    setStatus('ברוך הבא לאזור העובדים. בחר מסך ייעודי מהניווט העליון.', 'info');
  }

  if (hasInventoryView) {
    refreshStaffData().catch(() => {
      setStatus('שגיאה בטעינת נתוני המלאי. ודא שהשרת רץ ושהמשתמש הוא עובד/מנהל.', 'danger');
    });
  }

  if (hasWorkHoursView) {
    renderWorkHours();
  }

  if (hasPurchaseOrdersView) {
    refreshStaffData().catch(() => {
      setStatus('שגיאה בטעינת הזמנות רכש. ודא שהשרת רץ ושהמשתמש הוא עובד/מנהל.', 'danger');
    });
  }

  if (hasCustomerOrdersView) {
    refreshStaffData().catch(() => {
      setStatus('שגיאה בטעינת הזמנות לקוחות. ודא שהשרת רץ ושהמשתמש הוא עובד/מנהל.', 'danger');
    });
  }
}

init();
