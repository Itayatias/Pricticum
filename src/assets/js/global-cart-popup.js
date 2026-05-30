import { Modal } from 'bootstrap';

const API_BASE_URL = 'http://localhost:4000';

function getAuthUser() {
  try {
    const raw = localStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
}

function formatMoney(amount) {
  return `₪ ${Number(amount || 0).toFixed(2)}`;
}

function ensureModalElement() {
  const existing = document.getElementById('globalCartModal');
  if (existing) return existing;

  const modalWrapper = document.createElement('div');
  modalWrapper.innerHTML = `
    <div class="modal fade" id="globalCartModal" tabindex="-1" aria-labelledby="globalCartModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="globalCartModalLabel">סל הקניות שלי</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="סגירה"></button>
          </div>
          <div class="modal-body">
            <div id="globalCartModalState" class="small text-muted mb-3">טוען נתונים...</div>
            <ul id="globalCartItems" class="list-unstyled mb-3"></ul>
            <div class="d-flex justify-content-between fw-semibold">
              <span>סה"כ לתשלום</span>
              <span id="globalCartTotal">₪ 0.00</span>
            </div>
          </div>
          <div class="modal-footer">
            <a href="/pages/products.html#cart-section" id="globalCartManageLink" class="btn btn-primary">ניהול סל וביצוע הזמנה</a>
            <button type="button" class="btn btn-outline-dark" data-bs-dismiss="modal">סגירה</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalWrapper.firstElementChild);
  return document.getElementById('globalCartModal');
}

function updateModalDirection(modalEl) {
  const isInPages = window.location.pathname.includes('/pages/');
  const manageLink = modalEl.querySelector('#globalCartManageLink');
  if (manageLink) {
    manageLink.setAttribute('href', isInPages ? './products.html#cart-section' : './pages/products.html#cart-section');
  }
}

async function renderCartInModal(modalEl) {
  const user = getAuthUser();
  const state = modalEl.querySelector('#globalCartModalState');
  const list = modalEl.querySelector('#globalCartItems');
  const total = modalEl.querySelector('#globalCartTotal');
  const manageLink = modalEl.querySelector('#globalCartManageLink');

  if (!state || !list || !total || !manageLink) return;

  if (!user || !user.id) {
    state.className = 'small text-danger mb-3';
    state.textContent = 'לא זוהה משתמש מחובר. יש להתחבר כדי לצפות בסל.';
    list.innerHTML = '';
    total.textContent = formatMoney(0);
    const isInPages = window.location.pathname.includes('/pages/');
    manageLink.textContent = 'מעבר להתחברות';
    manageLink.setAttribute('href', isInPages ? './login.html' : './pages/login.html');
    return;
  }

  state.className = 'small text-muted mb-3';
  state.textContent = `משתמש מחובר: ${user.fullName}`;

  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/${user.id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to load cart');
    }

    if (!data.items || !data.items.length) {
      list.innerHTML = '<li class="text-muted">הסל שלך ריק כרגע.</li>';
    } else {
      list.innerHTML = data.items
        .map(
          (item) => `
            <li class="mb-2 pb-2 border-bottom">
              <div class="d-flex justify-content-between">
                <span>${item.productName}</span>
                <span>${formatMoney(item.price * item.quantity)}</span>
              </div>
              <div class="small text-muted">כמות: ${item.quantity}</div>
            </li>
          `
        )
        .join('');
    }

    total.textContent = formatMoney(data.total);
    manageLink.textContent = 'ניהול סל וביצוע הזמנה';
    updateModalDirection(modalEl);
  } catch (_err) {
    state.className = 'small text-danger mb-3';
    state.textContent = 'לא ניתן לטעון את הסל כרגע. ודא שהשרת פעיל.';
    list.innerHTML = '';
    total.textContent = formatMoney(0);
  }
}

function bindGlobalCartPopup() {
  const modalEl = ensureModalElement();
  if (!modalEl) return;

  updateModalDirection(modalEl);
  const modal = new Modal(modalEl);

  const cartLinks = document.querySelectorAll('.header-cart-link');
  if (!cartLinks.length) return;

  cartLinks.forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      await renderCartInModal(modalEl);
      modal.show();
    });
  });
}

document.addEventListener('DOMContentLoaded', bindGlobalCartPopup);
