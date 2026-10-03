/**
 * RecipeShare - Global Script & Utilities
 */

// Fallback SVG image in case of broken external images
const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23EDE4D8' width='400' height='300'/%3E%3Ctext fill='%23D35400' font-family='sans-serif' font-size='24' font-weight='bold' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3E🍴 RecipeShare%3C/text%3E%3C/svg%3E";

function handleImageError(img) {
  img.onerror = null;
  img.src = FALLBACK_IMAGE;
}

// Initialize Theme (Dark / Light)
function initTheme() {
  const savedTheme = localStorage.getItem('recipe_share_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('recipe_share_theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const themeBtns = document.querySelectorAll('.theme-toggle-btn');
  themeBtns.forEach((btn) => {
    btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('title', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
  });
}

// Mobile Menu Toggle
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('show');
      toggleBtn.innerHTML = navMenu.classList.contains('show') ? '✕' : '☰';
    });
  }
}

// Reusable Recipe Card HTML Generator
function createRecipeCardHTML(recipe) {
  const dietBadgeClass =
    recipe.diet === 'Vegetarian'
      ? 'veg'
      : recipe.diet === 'Vegan'
      ? 'vegan'
      : 'non-veg';

  const isFav = recipe.isFavorited;
  const rating = (recipe.rating || 5.0).toFixed(1);
  const totalCookTime = recipe.cookTime || 20;

  return `
    <div class="recipe-card" data-id="${recipe._id}">
      <div class="card-image-wrap">
        <img 
          src="${recipe.image}" 
          alt="${recipe.title}" 
          class="card-img" 
          loading="lazy" 
          onerror="handleImageError(this)" 
        />
        <button 
          class="card-favorite-btn ${isFav ? 'active' : ''}" 
          onclick="toggleFavorite('${recipe._id}', this, event)"
          title="${isFav ? 'Remove from favorites' : 'Add to favorites'}"
        >
          ${isFav ? '❤️' : '🤍'}
        </button>
        <span class="card-badge ${dietBadgeClass}">${recipe.diet}</span>
      </div>

      <div class="card-content">
        <div class="card-meta-top">
          <span class="card-category" style="font-weight:600;color:var(--primary);">${recipe.category}</span>
          <span class="card-rating">⭐ ${rating}</span>
        </div>

        <h3 class="card-title" title="${recipe.title}">${recipe.title}</h3>
        <p class="card-desc">${recipe.description}</p>

        <div class="card-footer">
          <div class="card-info-item">
            <span>⏱</span>
            <span>${totalCookTime} min</span>
          </div>
          <div class="card-info-item">
            <span>⚡</span>
            <span>${recipe.difficulty || 'Easy'}</span>
          </div>
          <a href="recipe.html?id=${recipe._id}" class="btn btn-primary btn-sm" style="border-radius: var(--radius-full);">
            View Recipe
          </a>
        </div>
      </div>
    </div>
  `;
}

// Global Favorite Toggle
async function toggleFavorite(recipeId, btnElement, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!Auth.isLoggedIn()) {
    showToast('Please log in to save recipes to your favorites ❤️', 'error');
    return;
  }

  const isCurrentlyFav = btnElement.classList.contains('active');

  try {
    if (isCurrentlyFav) {
      const res = await API.delete(`/favorites/${recipeId}`);
      btnElement.classList.remove('active');
      btnElement.innerHTML = '🤍';
      btnElement.setAttribute('title', 'Add to favorites');
      showToast('Recipe removed from favorites', 'info');
    } else {
      const res = await API.post(`/favorites/${recipeId}`);
      btnElement.classList.add('active');
      btnElement.innerHTML = '❤️';
      btnElement.setAttribute('title', 'Remove from favorites');
      showToast('Recipe added to favorites ❤️', 'success');
    }
  } catch (err) {
    showToast(err.message || 'Failed to update favorites', 'error');
  }
}

// Global Search Redirection
function handleHeaderSearch(e) {
  if (e.key === 'Enter') {
    const query = e.target.value.trim();
    if (query) {
      window.location.href = `index.html?search=${encodeURIComponent(query)}#explore-section`;
    }
  }
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  Auth.updateNavbar();
});
