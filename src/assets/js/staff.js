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

let currentEditProductId = null;
const hasInventoryView = Boolean(inventoryTableBody || inventoryMovementsList);
const hasInventoryFormView = Boolean(inventoryForm);
const hasProductCreateView = Boolean(inventoryPrice || inventoryImageUrl || inventoryImageFile || inventoryImagePreview);
const hasSupplierSelectView = Boolean(inventorySupplierId);
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

function formatClockValue(value) {
  if (!value) return '--';
  return new Date(value).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
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

  if (!reportEntries.length) {
    workHoursReportBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-muted">אין עדיין משמרות מתועדות.</td>
      </tr>
    `;
    return;
  }

  workHoursReportBody.innerHTML = reportEntries
    .map((entry) => `
      <tr>
        <td>${formatDateValue(entry.checkIn)}</td>
        <td>${formatClockValue(entry.checkIn)}</td>
        <td>${entry.checkOut ? formatClockValue(entry.checkOut) : 'פעילה'}</td>
        <td>${formatDuration(getEntryDuration(entry))}</td>
      </tr>
    `)
    .join('');
}

function renderWorkHours() {
  const entries = loadWorkHoursEntries();
  updateWorkHoursSummary(entries);
  renderWorkHoursReport(entries);
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
      if (item) loadItemIntoForm(item);
    });
  });
}

function loadItemIntoForm(item) {
  currentEditProductId = item.productId;
  if (inventoryProductId) inventoryProductId.value = item.productId;
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
    const payload = {
      userId: authUser.id,
      productId: String(inventoryProductId?.value || '').trim(),
      productName: String(inventoryProductName?.value || '').trim(),
      category: String(inventoryCategory?.value || '').trim(),
      stock: Number(inventoryStock?.value || 0),
      minStock: Number(inventoryMinStock?.value || 0),
      location: String(inventoryLocation?.value || 'מחסן ראשי').trim(),
    };
    if (inventorySupplierId?.value) {
      payload.supplierId = Number(inventorySupplierId.value);
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
              <button type="button" class="btn btn-outline-primary btn-sm" data-edit-inventory="${item.productId}">ערוך</button>
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
  if (hasInventoryView) {
    await loadInventory();
    await loadMovements();
  }
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

  if (inventoryForm) {
    if (hasProductCreateView) {
      inventoryForm.addEventListener('submit', createCatalogProduct);
    } else {
      inventoryForm.addEventListener('submit', upsertInventoryItem);
    }
  }
  if (hasSupplierSelectView) {
    loadSupplierOptions();
  }
  if (inventoryResetBtn) inventoryResetBtn.addEventListener('click', resetInventoryForm);
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

  if (hasInventoryView && hasWorkHoursView) {
    setStatus('כאן אפשר לנהל מלאי ולעקוב אחרי שעות עבודה מהמסכים הייעודיים.', 'info');
  } else if (hasInventoryView) {
    setStatus('כאן אפשר לעדכן מלאי, לעקוב אחרי תנועות ולהמשיך להרחיב את שכבת הניהול.', 'info');
  } else if (hasInventoryFormView) {
    setStatus('כאן אפשר להוסיף מוצר חדש למערכת עם תמונה ומחיר.', 'info');
    resetImagePreview();
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
}

init();
