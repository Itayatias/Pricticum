function getAuthUser() {
  try {
    const raw = localStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem('authUser');
}

function getLoginHref() {
  const isInPages = window.location.pathname.includes('/pages/');
  return isInPages ? './login.html' : './pages/login.html';
}

function ensureAuthNavItems() {
  const navLists = document.querySelectorAll('.navbar-nav');
  navLists.forEach((list) => {
    const existingAuthControl = list.querySelector('[data-auth-control="true"]');
    if (existingAuthControl) return;

    const li = document.createElement('li');
    li.className = 'nav-item';

    const link = document.createElement('a');
    link.className = 'nav-link';
    link.setAttribute('data-auth-control', 'true');
    link.href = getLoginHref();
    link.textContent = 'התחברות';

    li.appendChild(link);
    list.appendChild(li);
  });
}

function updateNavAuthState() {
  ensureAuthNavItems();

  const user = getAuthUser();
  const authControls = document.querySelectorAll('[data-auth-control="true"]');

  authControls.forEach((link) => {
    link.classList.add('btn', 'btn-sm', 'ms-2');
    if (!user || !user.fullName) {
      link.classList.remove('btn-outline-danger');
      link.classList.add('btn-outline-dark');
      link.textContent = 'התחברות';
      link.setAttribute('title', 'מעבר לדף התחברות');
      link.setAttribute('href', getLoginHref());
      link.onclick = null;
      return;
    }

    link.classList.remove('btn-outline-dark');
    link.classList.add('btn-outline-danger');
    link.textContent = 'התנתקות';
    link.setAttribute('title', `מחובר כ-${user.fullName}. לחץ להתנתקות`);
    link.setAttribute('href', '#');
    link.onclick = (event) => {
      event.preventDefault();
      clearAuth();
      window.location.href = getLoginHref();
    };
  });
}

document.addEventListener('DOMContentLoaded', updateNavAuthState);
