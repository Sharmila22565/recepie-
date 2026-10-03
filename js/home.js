/**
 * RecipeShare - Home & Discovery Page Logic
 */

let currentFilters = {
  search: '',
  category: 'All',
  subCategory: 'All',
  difficulty: 'All',
  diet: 'All',
  cuisine: 'All',
  maxCookTime: '',
  sort: 'newest',
  page: 1,
  limit: 8,
};

// Initialize Home Page
document.addEventListener('DOMContentLoaded', async () => {
  // Check URL params for search query
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  if (searchParam) {
    currentFilters.search = searchParam;
    const searchInput = document.getElementById('catalog-search-input');
    if (searchInput) searchInput.value = searchParam;
    const heroSearchInput = document.getElementById('hero-search-input');
    if (heroSearchInput) heroSearchInput.value = searchParam;
  }

  const catParam = urlParams.get('category');
  if (catParam) {
    currentFilters.category = catParam;
  }

  // Load Sections
  loadFeaturedSections();
  loadCatalogRecipes();
  setupFilterListeners();
});

// Load Hero & Featured Sections
async function loadFeaturedSections() {
  // Trending Recipes
  try {
    const trendingData = await API.get('/recipes/trending', { limit: 4 });
    const trendingGrid = document.getElementById('trending-grid');
    if (trendingGrid && trendingData.recipes) {
      trendingGrid.innerHTML = trendingData.recipes
        .map((r) => createRecipeCardHTML(r))
        .join('');
    }
  } catch (err) {
    console.error('Failed to load trending recipes', err);
  }

  // Popular Recipes
  try {
    const popularData = await API.get('/recipes/popular', { limit: 4 });
    const popularGrid = document.getElementById('popular-grid');
    if (popularGrid && popularData.recipes) {
      popularGrid.innerHTML = popularData.recipes
        .map((r) => createRecipeCardHTML(r))
        .join('');
    }
  } catch (err) {
    console.error('Failed to load popular recipes', err);
  }

  // Recently Added Recipes
  try {
    const recentData = await API.get('/recipes/recent', { limit: 4 });
    const recentGrid = document.getElementById('recent-grid');
    if (recentGrid && recentData.recipes) {
      recentGrid.innerHTML = recentData.recipes
        .map((r) => createRecipeCardHTML(r))
        .join('');
    }
  } catch (err) {
    console.error('Failed to load recent recipes', err);
  }

  // Highly Rated Recipes
  try {
    const topData = await API.get('/recipes/top-rated', { limit: 4 });
    const topGrid = document.getElementById('top-rated-grid');
    if (topGrid && topData.recipes) {
      topGrid.innerHTML = topData.recipes
        .map((r) => createRecipeCardHTML(r))
        .join('');
    }
  } catch (err) {
    console.error('Failed to load top rated recipes', err);
  }
}

// Load Catalog Recipes with active filters
async function loadCatalogRecipes() {
  const catalogGrid = document.getElementById('catalog-grid');
  const countBadge = document.getElementById('catalog-count-badge');
  const paginationContainer = document.getElementById('catalog-pagination');

  if (!catalogGrid) return;

  // Show Skeleton Loaders
  catalogGrid.innerHTML = Array(4)
    .fill(0)
    .map(
      () =>
        `<div class="skeleton skeleton-card" style="border-radius:var(--radius-md);"></div>`
    )
    .join('');

  try {
    const data = await API.get('/recipes', currentFilters);

    if (countBadge) {
      countBadge.textContent = `${data.total || 0} recipes found`;
    }

    if (!data.recipes || data.recipes.length === 0) {
      catalogGrid.innerHTML = `
        <div style="grid-column: 1 / -1;" class="empty-state">
          <div class="empty-icon">🍳</div>
          <h3 class="empty-title">No Recipes Found</h3>
          <p class="empty-desc">We couldn't find any recipes matching your current filters. Try searching for something else or clear the filters.</p>
          <button class="btn btn-secondary" onclick="resetFilters()">Reset All Filters</button>
        </div>
      `;
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    catalogGrid.innerHTML = data.recipes
      .map((r) => createRecipeCardHTML(r))
      .join('');

    renderPagination(data.currentPage, data.totalPages);
  } catch (err) {
    catalogGrid.innerHTML = `
      <div style="grid-column: 1 / -1;" class="empty-state">
        <p style="color:var(--danger)">Failed to load recipes. Please check server connection.</p>
      </div>
    `;
  }
}

// Setup Event Listeners for Filters
function setupFilterListeners() {
  // Category tabs
  const catTabs = document.querySelectorAll('.cat-pill-btn');
  catTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      catTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilters.category = tab.dataset.category || 'All';
      currentFilters.page = 1;
      loadCatalogRecipes();
    });
  });

  // Search Inputs
  const searchInput = document.getElementById('catalog-search-input');
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        currentFilters.search = e.target.value;
        currentFilters.page = 1;
        loadCatalogRecipes();
      }, 400);
    });
  }

  // Hero Search Input
  const heroSearchInput = document.getElementById('hero-search-input');
  const heroSearchBtn = document.getElementById('hero-search-btn');
  if (heroSearchBtn && heroSearchInput) {
    const handleHeroSearch = () => {
      const q = heroSearchInput.value.trim();
      currentFilters.search = q;
      currentFilters.page = 1;
      if (searchInput) searchInput.value = q;
      loadCatalogRecipes();
      document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    heroSearchBtn.addEventListener('click', handleHeroSearch);
    heroSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleHeroSearch();
    });
  }

  // Difficulty Filter
  const diffSelect = document.getElementById('filter-difficulty');
  if (diffSelect) {
    diffSelect.addEventListener('change', (e) => {
      currentFilters.difficulty = e.target.value;
      currentFilters.page = 1;
      loadCatalogRecipes();
    });
  }

  // Diet Filter
  const dietSelect = document.getElementById('filter-diet');
  if (dietSelect) {
    dietSelect.addEventListener('change', (e) => {
      currentFilters.diet = e.target.value;
      currentFilters.page = 1;
      loadCatalogRecipes();
    });
  }

  // Cuisine Filter
  const cuisineSelect = document.getElementById('filter-cuisine');
  if (cuisineSelect) {
    cuisineSelect.addEventListener('change', (e) => {
      currentFilters.cuisine = e.target.value;
      currentFilters.page = 1;
      loadCatalogRecipes();
    });
  }

  // Max Cook Time Filter
  const timeSelect = document.getElementById('filter-time');
  if (timeSelect) {
    timeSelect.addEventListener('change', (e) => {
      currentFilters.maxCookTime = e.target.value;
      currentFilters.page = 1;
      loadCatalogRecipes();
    });
  }

  // Sort Filter
  const sortSelect = document.getElementById('filter-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentFilters.sort = e.target.value;
      currentFilters.page = 1;
      loadCatalogRecipes();
    });
  }
}

// Reset Filters
function resetFilters() {
  currentFilters = {
    search: '',
    category: 'All',
    subCategory: 'All',
    difficulty: 'All',
    diet: 'All',
    cuisine: 'All',
    maxCookTime: '',
    sort: 'newest',
    page: 1,
    limit: 8,
  };

  const searchInput = document.getElementById('catalog-search-input');
  if (searchInput) searchInput.value = '';
  const heroSearchInput = document.getElementById('hero-search-input');
  if (heroSearchInput) heroSearchInput.value = '';

  const diffSelect = document.getElementById('filter-difficulty');
  if (diffSelect) diffSelect.value = 'All';
  const dietSelect = document.getElementById('filter-diet');
  if (dietSelect) dietSelect.value = 'All';
  const timeSelect = document.getElementById('filter-time');
  if (timeSelect) timeSelect.value = '';
  const sortSelect = document.getElementById('filter-sort');
  if (sortSelect) sortSelect.value = 'newest';

  const catTabs = document.querySelectorAll('.cat-pill-btn');
  catTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.category === 'All');
  });

  loadCatalogRecipes();
}

// Render Pagination Buttons
function renderPagination(currentPage, totalPages) {
  const container = document.getElementById('catalog-pagination');
  if (!container || totalPages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  let html = `
    <button class="btn btn-secondary btn-sm" ${currentPage === 1 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''} onclick="goToPage(${currentPage - 1})">
      ◀ Previous
    </button>
    <span style="font-weight:600;font-size:0.92rem;color:var(--text-muted);">
      Page ${currentPage} of ${totalPages}
    </span>
    <button class="btn btn-secondary btn-sm" ${currentPage === totalPages ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''} onclick="goToPage(${currentPage + 1})">
      Next ▶
    </button>
  `;

  container.innerHTML = html;
}

function goToPage(page) {
  currentFilters.page = page;
  loadCatalogRecipes();
  document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' });
}
