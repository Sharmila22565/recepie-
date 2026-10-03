/**
 * RecipeShare - User Profile & Recipe Management
 */

let userProfileData = null;
let recipeToDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth()) return;
  loadUserProfile();
  setupProfileForm();
  setupDeleteModal();
});

async function loadUserProfile() {
  try {
    const data = await API.get('/users/profile');
    userProfileData = data;

    renderProfileHeader(data.user, data.stats);
    renderMyRecipes(data.myRecipes);
  } catch (err) {
    showToast('Failed to load profile details', 'error');
  }
}

function renderProfileHeader(user, stats) {
  document.getElementById('profile-name').textContent = user.name;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('profile-bio').textContent = user.bio || 'Food lover & passionate home chef';

  const avatarContainer = document.getElementById('profile-avatar');
  if (avatarContainer) {
    const initials = user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    if (user.profileImage) {
      avatarContainer.innerHTML = `<img src="${user.profileImage}" alt="${user.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      avatarContainer.textContent = initials;
    }
  }

  // Stats
  document.getElementById('stat-recipes').textContent = stats.recipesShared || 0;
  document.getElementById('stat-favorites').textContent = stats.favoritesCount || 0;
  document.getElementById('stat-reviews').textContent = stats.reviewsCount || 0;

  // Pre-fill profile edit inputs
  document.getElementById('edit-name').value = user.name || '';
  document.getElementById('edit-bio').value = user.bio || '';
  document.getElementById('edit-avatar-url').value = user.profileImage || '';
}

function renderMyRecipes(recipes = []) {
  const container = document.getElementById('my-recipes-grid');
  const countBadge = document.getElementById('my-recipes-count');

  if (countBadge) countBadge.textContent = `${recipes.length} recipes`;

  if (!container) return;

  if (recipes.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1;" class="empty-state">
        <div class="empty-icon">🍳</div>
        <h3 class="empty-title">You Haven't Shared Any Recipes Yet</h3>
        <p class="empty-desc">Share your family recipes, secret dishes, and culinary creations with the community!</p>
        <a href="share-recipe.html" class="btn btn-primary">Share Your First Recipe</a>
      </div>
    `;
    return;
  }

  container.innerHTML = recipes
    .map((r) => {
      const rating = (r.rating || 5.0).toFixed(1);
      return `
        <div class="recipe-card" id="recipe-card-${r._id}">
          <div class="card-image-wrap">
            <img src="${r.image}" alt="${r.title}" class="card-img" onerror="handleImageError(this)" />
            <span class="card-badge ${r.diet === 'Vegetarian' ? 'veg' : r.diet === 'Vegan' ? 'vegan' : 'non-veg'}">${r.diet}</span>
          </div>
          <div class="card-content">
            <div class="card-meta-top">
              <span style="font-weight:600;color:var(--primary);">${r.category}</span>
              <span class="card-rating">⭐ ${rating}</span>
            </div>
            <h3 class="card-title" title="${r.title}">${r.title}</h3>
            <p class="card-desc">${r.description}</p>
            <div style="display:flex;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid var(--border-light);">
              <a href="recipe.html?id=${r._id}" class="btn btn-secondary btn-sm" style="flex:1;">View</a>
              <a href="share-recipe.html?edit=${r._id}" class="btn btn-secondary btn-sm" style="flex:1;color:var(--primary);border-color:var(--primary-light);">Edit</a>
              <button class="btn btn-secondary btn-sm" onclick="openDeleteModal('${r._id}', '${r.title.replace(/'/g, "\\'")}')" style="color:var(--danger);padding:0 12px;">🗑</button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

// Setup Profile Edit Form
function setupProfileForm() {
  const form = document.getElementById('profile-edit-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('edit-name').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();
    const profileImage = document.getElementById('edit-avatar-url').value.trim();

    try {
      const res = await API.put('/users/profile', { name, bio, profileImage });
      Auth.setSession(Auth.getToken(), res.user);
      showToast('Profile updated successfully! ✨', 'success');
      loadUserProfile();
      toggleProfileEditModal(false);
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    }
  });
}

function toggleProfileEditModal(show = true) {
  const modal = document.getElementById('profile-modal');
  if (modal) {
    modal.classList.toggle('show', show);
  }
}

// Setup Delete Recipe Modal Confirmation
function setupDeleteModal() {
  const cancelBtn = document.getElementById('cancel-delete-btn');
  const confirmBtn = document.getElementById('confirm-delete-btn');

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      document.getElementById('delete-modal')?.classList.remove('show');
      recipeToDeleteId = null;
    };
  }

  if (confirmBtn) {
    confirmBtn.onclick = async () => {
      if (!recipeToDeleteId) return;

      try {
        await API.delete(`/recipes/${recipeToDeleteId}`);
        showToast('Recipe deleted successfully.', 'info');
        document.getElementById('delete-modal')?.classList.remove('show');
        document.getElementById(`recipe-card-${recipeToDeleteId}`)?.remove();
        recipeToDeleteId = null;
        loadUserProfile();
      } catch (err) {
        showToast(err.message || 'Failed to delete recipe', 'error');
      }
    };
  }
}

function openDeleteModal(recipeId, recipeTitle) {
  recipeToDeleteId = recipeId;
  const nameEl = document.getElementById('delete-recipe-name');
  if (nameEl) nameEl.textContent = recipeTitle;
  document.getElementById('delete-modal')?.classList.add('show');
}
