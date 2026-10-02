/**
 * RecipeShare - Favorites Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth()) return;
  loadFavorites();
});

async function loadFavorites() {
  const grid = document.getElementById('favorites-grid');
  const countEl = document.getElementById('favorites-count');

  if (!grid) return;

  grid.innerHTML = Array(4)
    .fill(0)
    .map(() => `<div class="skeleton skeleton-card"></div>`)
    .join('');

  try {
    const data = await API.get('/favorites');

    if (countEl) {
      countEl.textContent = `${data.count || 0} saved recipes`;
    }

    if (!data.favorites || data.favorites.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1;" class="empty-state">
          <div class="empty-icon">💔</div>
          <h3 class="empty-title">No Favorite Recipes Yet</h3>
          <p class="empty-desc">Explore our wide catalog of delicious recipes and click the ❤️ icon to save your favorites here.</p>
          <a href="index.html" class="btn btn-primary">Discover Recipes</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = data.favorites
      .map((r) => {
        // Render custom card with instant remove button
        return createRecipeCardHTML(r);
      })
      .join('');
  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1;" class="empty-state">
        <p style="color:var(--danger)">Failed to load your favorite recipes.</p>
      </div>
    `;
  }
}
