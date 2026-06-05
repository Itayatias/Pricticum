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

function getAccountHref() {
  const isInPages = window.location.pathname.includes('/pages/');
  return isInPages ? './account.html' : './pages/account.html';
}

function getManagerHref() {
  const isInPages = window.location.pathname.includes('/pages/');
  return isInPages ? './manager.html' : './pages/manager.html';
}

function getStaffHref() {
  const isInPages = window.location.pathname.includes('/pages/');
  return isInPages ? './staff.html' : './pages/staff.html';
}

function getRoleLabel(role) {
  if (role === 'customer') return 'אזור אישי';
  if (role === 'manager') return 'לוח מנהל';
  if (role === 'employee') return 'אזור עובדים';
  return 'אזור אישי';
}

function getDashboardHref(role) {
  if (role === 'customer') return getAccountHref();
  if (role === 'manager' || role === 'employee') {
    return role === 'manager' ? getManagerHref() : getStaffHref();
  }
  return getAccountHref();
}

function getAuthControls() {
  const controls = [];
  const navLists = document.querySelectorAll('.navbar-nav');

  navLists.forEach((list) => {
    let link = list.querySelector('a[data-auth-control="primary"]');

    if (!link) {
      // Prefer existing login links so we don't duplicate menu items.
      link = list.querySelector('a[href$="login.html"]');
    }

    if (!link) {
      const li = document.createElement('li');
      li.className = 'nav-item';
      link = document.createElement('a');
      link.className = 'nav-link';
      li.appendChild(link);
      list.appendChild(li);
    }

    link.setAttribute('data-auth-control', 'primary');
    controls.push(link);
  });

  return controls;
}

function getLogoutControls() {
  const controls = [];
  const navLists = document.querySelectorAll('.navbar-nav');

  navLists.forEach((list) => {
    let item = list.querySelector('li[data-auth-control="logout"]');
    let link = item?.querySelector('a');

    if (!item) {
      item = document.createElement('li');
      item.className = 'nav-item';
      item.setAttribute('data-auth-control', 'logout');
      link = document.createElement('a');
      link.className = 'nav-link';
      item.appendChild(link);
    }

    if (item.parentElement !== list) {
      const primaryLink = list.querySelector('a[data-auth-control="primary"]');
      const primaryItem = primaryLink?.closest('li');
      if (primaryItem && primaryItem.nextSibling) {
        primaryItem.parentNode.insertBefore(item, primaryItem.nextSibling);
      } else {
        list.appendChild(item);
      }
    }

    controls.push({ item, link });
  });

  return controls;
}

function applyLoggedOutState(link) {
  link.textContent = 'התחברות';
  link.setAttribute('title', 'מעבר לדף התחברות');
  link.setAttribute('href', getLoginHref());
  link.classList.remove('text-danger');
  link.classList.add('fw-semibold');
  link.classList.toggle('active', window.location.pathname.includes('/login.html'));
  link.onclick = null;
}

function applyLoggedInState(link, user) {
  const dashboardLabel = getRoleLabel(user.role);
  const dashboardHref = getDashboardHref(user.role);
  link.textContent = dashboardLabel;
  link.setAttribute('title', `מחובר כ-${user.fullName}. מעבר ל-${dashboardLabel}`);
  link.setAttribute('href', dashboardHref);
  link.classList.remove('text-danger');
  link.classList.add('fw-semibold');
  link.classList.toggle(
    'active',
    window.location.pathname.includes('/account.html') ||
      window.location.pathname.includes('/staff.html') ||
      window.location.pathname.includes('/manager.html') ||
      window.location.pathname.includes('/manager-users.html') ||
      window.location.pathname.includes('/manager-suppliers.html') ||
      window.location.pathname.includes('/manager-inventory.html') ||
      window.location.pathname.includes('/manager-reports.html')
  );
  link.onclick = null;
}

function applyLogoutState(link, user) {
  link.textContent = 'התנתקות';
  link.setAttribute('title', `מחובר כ-${user.fullName}. לחץ להתנתקות`);
  link.setAttribute('href', '#');
  link.classList.add('fw-semibold', 'text-danger');

  link.onclick = (event) => {
    event.preventDefault();
    clearAuth();
    window.location.href = getLoginHref();
  };
}

function updateNavAuthState() {
  const user = getAuthUser();
  const controls = getAuthControls();
  const logoutControls = getLogoutControls();

  controls.forEach((link) => {
    if (!user || !user.fullName) {
      applyLoggedOutState(link);
      return;
    }
    applyLoggedInState(link, user);
  });

  logoutControls.forEach(({ item, link }) => {
    if (!user || !user.fullName) {
      item.remove();
      return;
    }

    applyLogoutState(link, user);
  });
}

document.addEventListener('DOMContentLoaded', updateNavAuthState);
