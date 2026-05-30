const API_BASE_URL = 'http://localhost:4000';

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showLoginBtn = document.getElementById('showLoginBtn');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const authMessage = document.getElementById('authMessage');

if (loginForm && registerForm && showLoginBtn && showRegisterBtn && authMessage) {
  const authUserRaw = localStorage.getItem('authUser');
  const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;

  const showMessage = (text, type = 'success') => {
    authMessage.textContent = text;
    authMessage.className = `alert alert-${type}`;
  };

  const switchMode = (mode) => {
    const isLogin = mode === 'login';
    loginForm.classList.toggle('d-none', !isLogin);
    registerForm.classList.toggle('d-none', isLogin);

    showLoginBtn.classList.toggle('btn-dark', isLogin);
    showLoginBtn.classList.toggle('btn-outline-dark', !isLogin);

    showRegisterBtn.classList.toggle('btn-dark', !isLogin);
    showRegisterBtn.classList.toggle('btn-outline-dark', isLogin);

    authMessage.className = 'alert d-none';
    authMessage.textContent = '';
  };

  showLoginBtn.addEventListener('click', () => switchMode('login'));
  showRegisterBtn.addEventListener('click', () => switchMode('register'));

  if (authUser && authUser.fullName) {
    showMessage(`אתה כבר מחובר כ-${authUser.fullName}. אפשר להמשיך לאזור האישי.`, 'info');
  }

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(registerForm);
    const payload = {
      fullName: String(formData.get('fullName') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      password: String(formData.get('password') || ''),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        showMessage(data.message || 'הרשמה נכשלה', 'danger');
        return;
      }

      showMessage(`נרשמת בהצלחה: ${data.user.email}. אפשר להתחבר עכשיו.`, 'success');
      registerForm.reset();
      switchMode('login');
      document.getElementById('loginEmail').value = data.user.email;
    } catch (_err) {
      showMessage('לא ניתן להתחבר לשרת ההרשמה. ודא שהשרת רץ.', 'danger');
    }
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const payload = {
      email: String(formData.get('email') || '').trim(),
      password: String(formData.get('password') || ''),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        showMessage(data.message || 'התחברות נכשלה', 'danger');
        return;
      }

      localStorage.setItem('authUser', JSON.stringify(data.user));
      showMessage(`ברוך הבא ${data.user.fullName}! התחברת בהצלחה.`, 'success');
      loginForm.reset();
      setTimeout(() => {
        if (data.user.role === 'manager' || data.user.role === 'employee') {
          window.location.href = './staff.html';
          return;
        }
        window.location.href = './account.html';
      }, 700);
    } catch (_err) {
      showMessage('לא ניתן להתחבר לשרת ההתחברות. ודא שהשרת רץ.', 'danger');
    }
  });
}
