/**
 * RecipeShare - Authentication & Session Management
 */

const Auth = {
  TOKEN_KEY: 'recipe_share_token',
  USER_KEY: 'recipe_share_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getUser() {
    try {
      const user = localStorage.getItem(this.USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  setSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.updateNavbar();
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.updateNavbar();
  },

  async login(email, password) {
    const data = await API.post('/auth/login', { email, password });
    if (data.success && data.token) {
      this.setSession(data.token, data.user);
    }
    return data;
  },

  async register(name, email, password, confirmPassword) {
    const data = await API.post('/auth/register', {
      name,
      email,
      password,
      confirmPassword,
    });
    if (data.success && data.token) {
      this.setSession(data.token, data.user);
    }
    return data;
  },

  async logout() {
    try {
      await API.post('/auth/logout', {});
    } catch (e) {
      // ignore
    }
    this.clearSession();
    showToast('You have been logged out.', 'info');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500);
  },

  // Protect private pages
  requireAuth() {
    if (!this.isLoggedIn()) {
      showToast('Please log in to access this page.', 'error');
      sessionStorage.setItem('redirect_after_login', window.location.href);
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 600);
      return false;
    }
    return true;
  },

  // Dynamically update navbar based on auth state
  updateNavbar() {
    const user = this.getUser();
    const navAuthContainer = document.getElementById('nav-auth-container');
    const privateLinks = document.querySelectorAll('.private-nav-link');

    if (privateLinks) {
      privateLinks.forEach((link) => {
        link.style.display = this.isLoggedIn() ? 'flex' : 'none';
      });
    }

    if (!navAuthContainer) return;

    if (user && this.isLoggedIn()) {
      const initials = user.name
        ? user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'U';

      navAuthContainer.innerHTML = `
        <div class="user-profile-menu">
          <button class="user-btn" id="user-menu-btn" onclick="Auth.toggleUserDropdown()">
            <div class="user-avatar">${user.profileImage ? `<img src="${user.profileImage}" alt="${user.name}" style="width:100%;height:100%;border-radius:50%;">` : initials}</div>
            <span style="font-weight:600;font-size:0.9rem;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${user.name.split(' ')[0]}</span>
            <span style="font-size:0.75rem;">▼</span>
          </button>
          <div class="user-dropdown" id="user-dropdown">
            <a href="profile.html" class="user-dropdown-item">
              <span>👤</span> My Profile
            </a>
            <a href="share-recipe.html" class="user-dropdown-item">
              <span>➕</span> Share Recipe
            </a>
            <a href="favorites.html" class="user-dropdown-item">
              <span>❤️</span> My Favorites
            </a>
            <div class="user-dropdown-divider"></div>
            <button class="user-dropdown-item" onclick="Auth.logout()" style="color:var(--danger);width:100%;text-align:left;">
              <span>🚪</span> Logout
            </button>
          </div>
        </div>
      `;
    } else {
      navAuthContainer.innerHTML = `
        <a href="login.html" class="btn btn-secondary btn-sm">Login</a>
        <a href="register.html" class="btn btn-primary btn-sm">Register</a>
      `;
    }
  },

  toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
      dropdown.classList.toggle('show');
    }
  },
};

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const menu = document.querySelector('.user-profile-menu');
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown && menu && !menu.contains(e.target)) {
    dropdown.classList.remove('show');
  }
});
