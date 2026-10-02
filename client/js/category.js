/**
 * RecipeShare - Category Page Logic
 */

let activeCategory = 'Breakfast';
let activeSubCategory = 'All';
let activeSort = 'newest';

const categoryDescriptions = {
  Breakfast: 'Start your morning right with traditional South Indian tiffins, parathas, and wholesome energizing breakfast creations.',
  Lunch: 'Savor aromatic biryanis, full-course South Indian thali meals, creamy gravies, and fresh tawa rotis.',
  Starters: 'Crispy appetizers, sizzling tikkas, spicy 65 specials, and comforting homemade soups.',
  Dinner: 'Light, satisfying dinner curries, phulkas, dal makhani, and nourishing comfort bowls.',
  Desserts: 'Indulge your sweet tooth with frozen kulfis, decadent baked cakes, custards, fried delicacies, and fruit parfaits.',
};

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('cat');
  if (catParam) {
    activeCategory = catParam;
  }

  setupCategoryUI();
  loadCategoryRecipes();
});

function setupCategoryUI() {
  const titleEl = document.getElementById('category-title');
  const descEl = document.getElementById('category-desc');
  const mainCatTabs = document.querySelectorAll('.main-cat-tab');

  if (titleEl) titleEl.textContent = activeCategory;
  if (descEl) descEl.textContent = categoryDescriptions[activeCategory] || 'Discover mouthwatering recipes.';

  mainCatTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.cat.toLowerCase() === activeCategory.toLowerCase());
    tab.addEventListener('click', () => {
      activeCategory = tab.dataset.cat;
      activeSubCategory = 'All';
      window.history.pushState({}, '', `category.html?cat=${encodeURIComponent(activeCategory)}`);
      setupCategoryUI();
      loadCategoryRecipes();
    });
  });

  const sortSelect = document.getElementById('category-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      loadCategoryRecipes();
    });
  }
}

async function loadCategoryRecipes() {
  const grid = document.getElementById('category-recipes-grid');
  const subCategoryChipsContainer = document.getElementById('subcategory-chips');
  const totalCountEl = document.getElementById('category-count');

  if (!grid) return;

  grid.innerHTML = Array(4)
    .fill(0)
    .map(() => `<div class="skeleton skeleton-card"></div>`)
    .join('');

  try {
    const params = {
      subCategory: activeSubCategory !== 'All' ? activeSubCategory : undefined,
      sort: activeSort,
    };

    const data = await API.get(`/recipes/category/${encodeURIComponent(activeCategory)}`, params);

    if (totalCountEl) {
      totalCountEl.textContent = `${data.total || 0} recipes found`;
    }

    // Render Subcategory Chips
    if (subCategoryChipsContainer && data.subCategories) {
      let chipsHtml = `
        <button class="subcat-chip ${activeSubCategory === 'All' ? 'active' : ''}" onclick="selectSubCategory('All')">
          All ${activeCategory}
        </button>
      `;

      data.subCategories.forEach((sub) => {
        chipsHtml += `
          <button class="subcat-chip ${activeSubCategory === sub ? 'active' : ''}" onclick="selectSubCategory('${sub}')">
            ${sub}
          </button>
        `;
      });

      subCategoryChipsContainer.innerHTML = chipsHtml;
    }

    if (!data.recipes || data.recipes.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1;" class="empty-state">
          <div class="empty-icon">🍽️</div>
          <h3 class="empty-title">No recipes found in this subcategory</h3>
          <p class="empty-desc">Be the first to share an authentic ${activeSubCategory} recipe!</p>
          <a href="share-recipe.html" class="btn btn-primary">Share Your Recipe</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = data.recipes.map((r) => createRecipeCardHTML(r)).join('');
  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1;" class="empty-state">
        <p style="color:var(--danger)">Failed to load recipes for this category.</p>
      </div>
    `;
  }
}

function selectSubCategory(subCat) {
  activeSubCategory = subCat;
  loadCategoryRecipes();
}
