/**
 * RecipeShare - API Client Wrapper
 * Handles requests, headers, JWT tokens, and error toasts.
 */

const API_BASE = '/api';

const API = {
  // Get stored auth token
  getToken() {
    return localStorage.getItem('recipe_share_token');
  },

  // Get auth headers
  getHeaders(isMultipart = false) {
    const headers = {};
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Generic request handler
  async request(endpoint, options = {}) {
    const isMultipart = options.body instanceof FormData;
    const headers = { ...this.getHeaders(isMultipart), ...(options.headers || {}) };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong. Please try again.');
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // GET request with query params
  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  },

  // POST request
  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  // PUT request
  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  // DELETE request
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

// UI Toast Notification helper
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-weight:bold;">${icon}</span>
      <span>${message}</span>
    </div>
    <button style="color:var(--text-light);font-size:1.1rem;cursor:pointer;" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
