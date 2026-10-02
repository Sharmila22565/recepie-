/**
 * RecipeShare - Detailed Recipe Viewer & Cooking Companion
 */

let currentRecipe = null;
let baseServings = 4;
let currentServings = 4;
let originalIngredients = [];

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get('id');

  if (!recipeId) {
    window.location.href = 'index.html';
    return;
  }

  await loadRecipeDetails(recipeId);
  setupReviewForm(recipeId);
});

async function loadRecipeDetails(recipeId) {
  try {
    const data = await API.get(`/recipes/${recipeId}`);
    currentRecipe = data.recipe;
    baseServings = currentRecipe.servings || 4;
    currentServings = baseServings;
    originalIngredients = [...(currentRecipe.ingredients || [])];

    renderRecipeHeader(currentRecipe);
    renderIngredients();
    renderInstructions(currentRecipe.instructions);
    renderNutrition(currentRecipe.nutrition);
    renderAdditionalDetails(currentRecipe);
    renderReviews(recipeId);
    renderRelatedRecipes(data.relatedRecipes);
  } catch (err) {
    console.error('Failed to load recipe details', err);
    document.getElementById('recipe-container').innerHTML = `
      <div class="empty-state" style="margin:80px 0;">
        <div class="empty-icon">⚠️</div>
        <h3 class="empty-title">Recipe Not Found</h3>
        <p class="empty-desc">The recipe you are looking for might have been removed or does not exist.</p>
        <a href="index.html" class="btn btn-primary">Browse Other Recipes</a>
      </div>
    `;
  }
}

function renderRecipeHeader(recipe) {
  document.title = `${recipe.title} - RecipeShare`;

  const heroImg = document.getElementById('recipe-hero-img');
  if (heroImg) {
    heroImg.src = recipe.image;
    heroImg.alt = recipe.title;
    heroImg.onerror = () => handleImageError(heroImg);
  }

  // Badges
  const badgesContainer = document.getElementById('recipe-badges');
  if (badgesContainer) {
    const dietClass = recipe.diet === 'Vegetarian' ? 'badge-diet-veg' : recipe.diet === 'Vegan' ? 'badge-diet-vegan' : 'badge-diet-non-veg';
    badgesContainer.innerHTML = `
      <span class="badge badge-category">${recipe.category}</span>
      <span class="badge" style="background-color:var(--bg-alt);border:1px solid var(--border-color);">${recipe.subCategory}</span>
      <span class="badge ${dietClass}">${recipe.diet}</span>
      <span class="badge badge-difficulty">⚡ ${recipe.difficulty}</span>
      <span class="badge" style="background-color:var(--bg-alt);border:1px solid var(--border-color);">🌍 ${recipe.cuisine}</span>
    `;
  }

  // Titles & Description
  document.getElementById('recipe-title').textContent = recipe.title;
  document.getElementById('recipe-desc').textContent = recipe.description;

  // Rating & Review Count
  const ratingEl = document.getElementById('recipe-rating');
  if (ratingEl) {
    const ratingVal = (recipe.rating || 5.0).toFixed(1);
    ratingEl.innerHTML = `
      <span class="stars-rating">⭐ ${ratingVal}</span>
      <span style="color:var(--text-muted);font-size:0.95rem;">(${recipe.numReviews || 0} reviews)</span>
    `;
  }

  // Author Chip
  const authorEl = document.getElementById('recipe-author');
  if (authorEl) {
    const authorName = recipe.author?.name || recipe.authorName || 'Chef RecipeShare';
    const authorImg = recipe.author?.profileImage;
    authorEl.innerHTML = `
      <div class="author-avatar-fallback">${authorImg ? `<img src="${authorImg}" alt="${authorName}" style="width:100%;height:100%;border-radius:50%;">` : authorName[0]}</div>
      <div>
        <span style="font-size:0.82rem;color:var(--text-muted);display:block;">Curated by</span>
        <strong style="font-size:0.98rem;">${authorName}</strong>
      </div>
    `;
  }

  // Metrics
  document.getElementById('metric-prep').textContent = `${recipe.prepTime || 15}m`;
  document.getElementById('metric-cook').textContent = `${recipe.cookTime || 20}m`;
  document.getElementById('metric-total').textContent = `${(recipe.prepTime || 15) + (recipe.cookTime || 20)}m`;
  document.getElementById('metric-servings').textContent = `${recipe.servings || 4}`;

  // Favorite Button
  const favBtn = document.getElementById('btn-favorite-toggle');
  if (favBtn) {
    if (recipe.isFavorited) {
      favBtn.classList.add('active');
      favBtn.innerHTML = '❤️ Favorited';
    } else {
      favBtn.classList.remove('active');
      favBtn.innerHTML = '🤍 Add to Favorites';
    }

    favBtn.onclick = async () => {
      if (!Auth.isLoggedIn()) {
        showToast('Please log in to save recipes to your favorites ❤️', 'error');
        return;
      }

      const isFav = favBtn.classList.contains('active');
      try {
        if (isFav) {
          await API.delete(`/favorites/${recipe._id}`);
          favBtn.classList.remove('active');
          favBtn.innerHTML = '🤍 Add to Favorites';
          showToast('Recipe removed from favorites', 'info');
        } else {
          await API.post(`/favorites/${recipe._id}`);
          favBtn.classList.add('active');
          favBtn.innerHTML = '❤️ Favorited';
          showToast('Recipe added to favorites ❤️', 'success');
        }
      } catch (e) {
        showToast(e.message || 'Failed to update favorite', 'error');
      }
    };
  }

  // Share Button
  const shareBtn = document.getElementById('btn-share-recipe');
  if (shareBtn) {
    shareBtn.onclick = () => {
      if (navigator.share) {
        navigator.share({
          title: recipe.title,
          text: `Check out this delicious ${recipe.title} recipe on RecipeShare!`,
          url: window.location.href,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('Recipe link copied to clipboard! 🔗', 'success');
      }
    };
  }

  // Print Button
  const printBtn = document.getElementById('btn-print-recipe');
  if (printBtn) {
    printBtn.onclick = () => {
      window.print();
    };
  }
}

// Dynamic Servings Scaler & Ingredients Checklist
function changeServings(delta) {
  const newServings = currentServings + delta;
  if (newServings < 1 || newServings > 24) return;
  currentServings = newServings;
  document.getElementById('servings-display').textContent = currentServings;
  renderIngredients();
}

function renderIngredients() {
  const container = document.getElementById('ingredients-list');
  if (!container) return;

  const ratio = currentServings / (baseServings || 4);

  container.innerHTML = originalIngredients
    .map((item, index) => {
      // Attempt to scale numbers found in ingredient strings
      const scaledItem = item.replace(/(\d+(\.\d+)?(\/\d+)?)/g, (match) => {
        let num = 0;
        if (match.includes('/')) {
          const parts = match.split('/');
          num = parseFloat(parts[0]) / parseFloat(parts[1]);
        } else {
          num = parseFloat(match);
        }
        if (isNaN(num)) return match;
        const scaled = (num * ratio).toFixed(1).replace(/\.0$/, '');
        return scaled;
      });

      return `
        <li class="ingredient-item" onclick="toggleIngredientCheck(this)">
          <input type="checkbox" class="ingredient-checkbox" id="ing-${index}" onclick="event.stopPropagation(); toggleIngredientCheck(this.parentElement);" />
          <span>${scaledItem}</span>
        </li>
      `;
    })
    .join('');
}

function toggleIngredientCheck(itemEl) {
  itemEl.classList.toggle('checked');
  const cb = itemEl.querySelector('.ingredient-checkbox');
  if (cb) cb.checked = itemEl.classList.contains('checked');
}

// Step-by-Step Instructions
function renderInstructions(instructions) {
  const container = document.getElementById('instructions-list');
  if (!container) return;

  container.innerHTML = instructions
    .map(
      (step, idx) => `
      <div class="instruction-step">
        <div class="step-num">${idx + 1}</div>
        <div class="step-text">${step}</div>
      </div>
    `
    )
    .join('');
}

// Nutrition Facts
function renderNutrition(nutrition = {}) {
  const container = document.getElementById('nutrition-container');
  if (!container) return;

  const ratio = currentServings / (baseServings || 4);

  const cal = Math.round((nutrition.calories || 250) * ratio);
  const prot = Math.round((nutrition.protein || 8) * ratio);
  const carbs = Math.round((nutrition.carbohydrates || 35) * ratio);
  const fat = Math.round((nutrition.fat || 9) * ratio);
  const fiber = Math.round((nutrition.fiber || 3) * ratio);
  const sugar = Math.round((nutrition.sugar || 2) * ratio);
  const sodium = Math.round((nutrition.sodium || 240) * ratio);

  container.innerHTML = `
    <div class="nutrition-row"><span>Calories</span><span class="nutrition-val">${cal} kcal</span></div>
    <div class="nutrition-row"><span>Protein</span><span class="nutrition-val">${prot} g</span></div>
    <div class="nutrition-row"><span>Carbohydrates</span><span class="nutrition-val">${carbs} g</span></div>
    <div class="nutrition-row"><span>Total Fat</span><span class="nutrition-val">${fat} g</span></div>
    <div class="nutrition-row"><span>Dietary Fiber</span><span class="nutrition-val">${fiber} g</span></div>
    <div class="nutrition-row"><span>Sugars</span><span class="nutrition-val">${sugar} g</span></div>
    <div class="nutrition-row"><span>Sodium</span><span class="nutrition-val">${sodium} mg</span></div>
  `;
}

// Additional Details & Tips
function renderAdditionalDetails(recipe) {
  const tipsContainer = document.getElementById('chef-tips-text');
  if (tipsContainer) {
    tipsContainer.textContent = recipe.chefTips || recipe.tips || 'Follow the exact sequence of steps and maintain steady cooking temperatures for restaurant-quality flavor.';
  }

  const bestServedEl = document.getElementById('best-served-text');
  if (bestServedEl) {
    bestServedEl.textContent = recipe.bestServedWith || 'Freshly made accompaniments and traditional chutneys/breads.';
  }

  const storageEl = document.getElementById('storage-text');
  if (storageEl) {
    storageEl.textContent = recipe.storage || 'Store in an airtight container in the refrigerator.';
  }

  const allergensEl = document.getElementById('allergens-list');
  if (allergensEl) {
    if (recipe.allergens && recipe.allergens.length > 0) {
      allergensEl.innerHTML = recipe.allergens
        .map((a) => `<span class="badge" style="background-color:var(--danger-bg);color:var(--danger);">${a}</span>`)
        .join(' ');
    } else {
      allergensEl.textContent = 'None reported';
    }
  }

  const spiceEl = document.getElementById('spice-level-text');
  if (spiceEl) {
    spiceEl.textContent = recipe.spiceLevel || 'Medium';
  }
}

// Reviews & Ratings
async function renderReviews(recipeId) {
  const container = document.getElementById('reviews-list');
  const countEl = document.getElementById('reviews-total-count');
  if (!container) return;

  try {
    const data = await API.get(`/reviews/recipe/${recipeId}`);
    if (countEl) countEl.textContent = `(${data.count || 0})`;

    if (!data.reviews || data.reviews.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:30px;color:var(--text-muted);">
          <p>No reviews yet. Be the first to try and rate this recipe!</p>
        </div>
      `;
      return;
    }

    const currentUser = Auth.getUser();

    container.innerHTML = data.reviews
      .map((rev) => {
        const isOwner = currentUser && (rev.userId?._id === currentUser.id || rev.userId === currentUser.id);
        const stars = '⭐'.repeat(rev.rating);
        const dateFormatted = new Date(rev.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        return `
          <div class="review-item" id="review-${rev._id}">
            <div class="review-header">
              <div class="reviewer-info">
                <div class="reviewer-avatar">${rev.userName[0].toUpperCase()}</div>
                <div>
                  <strong style="display:block;font-size:0.95rem;">${rev.userName}</strong>
                  <span style="font-size:0.8rem;color:var(--text-muted);">${dateFormatted}</span>
                </div>
              </div>
              <div style="color:#F39C12;font-size:1.1rem;">${stars}</div>
            </div>
            <p class="review-comment">${rev.comment}</p>
            ${
              isOwner
                ? `
              <div class="review-actions">
                <button class="btn btn-sm btn-secondary" onclick="deleteReview('${rev._id}', '${recipeId}')" style="color:var(--danger);padding:4px 10px;font-size:0.8rem;">
                  🗑 Delete
                </button>
              </div>
            `
                : ''
            }
          </div>
        `;
      })
      .join('');
  } catch (err) {
    console.error('Failed to load reviews', err);
  }
}

function setupReviewForm(recipeId) {
  const form = document.getElementById('review-form');
  const authPrompt = document.getElementById('review-auth-prompt');

  if (!form) return;

  if (!Auth.isLoggedIn()) {
    form.style.display = 'none';
    if (authPrompt) authPrompt.style.display = 'block';
    return;
  }

  form.style.display = 'block';
  if (authPrompt) authPrompt.style.display = 'none';

  form.onsubmit = async (e) => {
    e.preventDefault();

    const ratingInput = form.querySelector('input[name="rating"]:checked');
    const commentInput = form.querySelector('#review-comment');

    if (!ratingInput) {
      showToast('Please select a star rating (1 to 5 stars)', 'error');
      return;
    }

    if (!commentInput || !commentInput.value.trim()) {
      showToast('Please write a short comment about your experience', 'error');
      return;
    }

    try {
      const res = await API.post(`/reviews/recipe/${recipeId}`, {
        rating: ratingInput.value,
        comment: commentInput.value.trim(),
      });

      showToast(res.message || 'Review submitted successfully!', 'success');
      form.reset();
      await renderReviews(recipeId);
    } catch (err) {
      showToast(err.message || 'Failed to submit review', 'error');
    }
  };
}

async function deleteReview(reviewId, recipeId) {
  if (!confirm('Are you sure you want to delete your review?')) return;

  try {
    await API.delete(`/reviews/${reviewId}`);
    showToast('Review deleted successfully', 'info');
    await renderReviews(recipeId);
  } catch (err) {
    showToast(err.message || 'Failed to delete review', 'error');
  }
}

// Related Recipes ("You May Also Like")
function renderRelatedRecipes(recipes = []) {
  const container = document.getElementById('related-recipes-grid');
  if (!container) return;

  if (recipes.length === 0) {
    document.getElementById('related-section')?.remove();
    return;
  }

  container.innerHTML = recipes.slice(0, 4).map((r) => createRecipeCardHTML(r)).join('');
}
