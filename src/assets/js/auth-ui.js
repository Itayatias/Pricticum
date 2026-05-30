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

function getAuthControls() {
  const controls = [];
  const navLists = document.querySelectorAll('.navbar-nav');

  navLists.forEach((list) => {
    let link = list.querySelector('a[data-auth-control="true"]');

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

    link.setAttribute('data-auth-control', 'true');
    controls.push(link);
  });

  return controls;
}

function applyLoggedOutState(link) {
  link.textContent = 'התחברות';
  link.setAttribute('title', 'מעבר לדף התחברות');
  link.setAttribute('href', getLoginHref());
  link.classList.remove('text-danger');
  link.classList.add('fw-semibold');
  link.onclick = null;
}

function applyLoggedInState(link, user) {
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

  controls.forEach((link) => {
    if (!user || !user.fullName) {
      applyLoggedOutState(link);
      return;
    }
    applyLoggedInState(link, user);
  });
}

document.addEventListener('DOMContentLoaded', updateNavAuthState);
