/**
 * RecipeShare - Share & Edit Recipe Form Logic
 */

const subCategoriesMap = {
  Breakfast: [
    'Idli Varieties',
    'Dosa Varieties',
    'Uthappam & Adai',
    'Upma & Pongal',
    'Paratha',
    'Bread & Egg',
  ],
  Lunch: [
    'Rice & Biryani',
    'South Indian Meals',
    'Gravies & Curries',
    'Roti & Sabzi',
  ],
  Starters: [
    'Vegetarian',
    'Non-Vegetarian',
    'Soups',
  ],
  Dinner: [
    'CHAPATI & CURRY',
    'RICE DISHES',
    'SOUTH INDIAN DINNER',
    'SOUPS & STARTERS',
    'NON-VEG SPECIALTIES',
    'ROTI & SABZI',
  ],
  Desserts: [
    'FROZEN',
    'BAKED',
    'CUSTARDS & PUDDINGS',
    'CHEESECAKES',
    'FRIED DESSERTS',
    'FRUIT-BASED',
  ],
};

let editRecipeId = null;
let currentImageUrl = '';

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;

  setupSubCategoryDropdown();
  setupImagePreview();
  setupDynamicRows();

  const urlParams = new URLSearchParams(window.location.search);
  editRecipeId = urlParams.get('edit');

  if (editRecipeId) {
    document.getElementById('form-page-title').textContent = 'Edit Your Recipe';
    document.getElementById('form-page-subtitle').textContent = 'Update your culinary masterpiece';
    document.getElementById('submit-recipe-btn').textContent = 'Update Recipe';
    await loadRecipeForEdit(editRecipeId);
  }

  setupFormSubmit();
});

// Category and Subcategory Selector
function setupSubCategoryDropdown() {
  const catSelect = document.getElementById('recipe-category');
  const subCatSelect = document.getElementById('recipe-subcategory');

  const updateSubCats = () => {
    const selectedCat = catSelect.value;
    const list = subCategoriesMap[selectedCat] || [];
    subCatSelect.innerHTML = list
      .map((sub) => `<option value="${sub}">${sub}</option>`)
      .join('');
  };

  catSelect.addEventListener('change', updateSubCats);
  updateSubCats();
}

// Live Image Preview (File Upload & URL input)
function setupImagePreview() {
  const fileInput = document.getElementById('recipe-image-file');
  const urlInput = document.getElementById('recipe-image-url');
  const previewImg = document.getElementById('image-preview-img');
  const previewWrap = document.getElementById('image-preview-wrap');

  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        // Upload immediately via API
        const formData = new FormData();
        formData.append('image', file);

        try {
          showToast('Uploading image...', 'info');
          const data = await API.post('/upload', formData);
          currentImageUrl = data.imageUrl;
          if (previewImg) {
            previewImg.src = currentImageUrl;
            previewWrap.style.display = 'block';
          }
          if (urlInput) urlInput.value = '';
          showToast('Image uploaded successfully! 📸', 'success');
        } catch (err) {
          showToast(err.message || 'Image upload failed', 'error');
        }
      }
    });
  }

  if (urlInput) {
    urlInput.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      if (url) {
        currentImageUrl = url;
        if (previewImg) {
          previewImg.src = url;
          previewWrap.style.display = 'block';
        }
      }
    });
  }
}

// Dynamic Add / Remove for Ingredients and Instructions
function setupDynamicRows() {
  // Add Ingredient
  const addIngBtn = document.getElementById('add-ingredient-btn');
  const ingContainer = document.getElementById('ingredients-inputs-container');

  if (addIngBtn && ingContainer) {
    addIngBtn.addEventListener('click', () => {
      const div = document.createElement('div');
      div.className = 'dynamic-row';
      div.style.display = 'flex';
      div.style.gap = '10px';
      div.style.marginBottom = '10px';
      div.innerHTML = `
        <input type="text" class="form-input ingredient-input" placeholder="e.g. 1 cup Basmati Rice" required style="padding-left:14px;" />
        <button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()" style="color:var(--danger);padding:0 14px;">✕</button>
      `;
      ingContainer.appendChild(div);
    });
  }

  // Add Instruction Step
  const addStepBtn = document.getElementById('add-step-btn');
  const stepContainer = document.getElementById('steps-inputs-container');

  if (addStepBtn && stepContainer) {
    addStepBtn.addEventListener('click', () => {
      const currentStep = stepContainer.children.length + 1;
      const div = document.createElement('div');
      div.className = 'dynamic-row';
      div.style.display = 'flex';
      div.style.gap = '10px';
      div.style.marginBottom = '10px';
      div.innerHTML = `
        <span style="font-weight:700;color:var(--primary);margin-top:10px;min-width:24px;">${currentStep}.</span>
        <textarea class="form-input step-input" rows="2" placeholder="Describe this cooking step in detail..." required style="padding-left:14px;resize:vertical;"></textarea>
        <button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove(); renumberSteps();" style="color:var(--danger);padding:0 14px;align-self:flex-start;">✕</button>
      `;
      stepContainer.appendChild(div);
    });
  }
}

function renumberSteps() {
  const stepContainer = document.getElementById('steps-inputs-container');
  if (!stepContainer) return;
  const rows = stepContainer.querySelectorAll('.dynamic-row');
  rows.forEach((row, i) => {
    const span = row.querySelector('span');
    if (span) span.textContent = `${i + 1}.`;
  });
}

// Load recipe data for editing
async function loadRecipeForEdit(recipeId) {
  try {
    const data = await API.get(`/recipes/${recipeId}`);
    const recipe = data.recipe;

    const currentUser = Auth.getUser();
    if (recipe.author && recipe.author._id !== currentUser.id && recipe.author !== currentUser.id) {
      showToast('You can only edit your own recipes.', 'error');
      setTimeout(() => (window.location.href = 'profile.html'), 1000);
      return;
    }

    document.getElementById('recipe-title').value = recipe.title || '';
    document.getElementById('recipe-desc').value = recipe.description || '';
    document.getElementById('recipe-category').value = recipe.category || 'Breakfast';
    setupSubCategoryDropdown();
    document.getElementById('recipe-subcategory').value = recipe.subCategory || '';

    currentImageUrl = recipe.image || '';
    document.getElementById('recipe-image-url').value = recipe.image || '';
    const previewImg = document.getElementById('image-preview-img');
    const previewWrap = document.getElementById('image-preview-wrap');
    if (previewImg && recipe.image) {
      previewImg.src = recipe.image;
      previewWrap.style.display = 'block';
    }

    document.getElementById('recipe-prep').value = recipe.prepTime || 15;
    document.getElementById('recipe-cook').value = recipe.cookTime || 20;
    document.getElementById('recipe-servings').value = recipe.servings || 4;
    document.getElementById('recipe-difficulty').value = recipe.difficulty || 'Easy';
    document.getElementById('recipe-cuisine').value = recipe.cuisine || 'Indian';
    document.getElementById('recipe-diet').value = recipe.diet || 'Vegetarian';
    document.getElementById('recipe-spice').value = recipe.spiceLevel || 'Medium';

    // Nutrition
    if (recipe.nutrition) {
      document.getElementById('nut-calories').value = recipe.nutrition.calories || '';
      document.getElementById('nut-protein').value = recipe.nutrition.protein || '';
      document.getElementById('nut-carbs').value = recipe.nutrition.carbohydrates || '';
      document.getElementById('nut-fat').value = recipe.nutrition.fat || '';
      document.getElementById('nut-fiber').value = recipe.nutrition.fiber || '';
      document.getElementById('nut-sugar').value = recipe.nutrition.sugar || '';
      document.getElementById('nut-sodium').value = recipe.nutrition.sodium || '';
    }

    // Additional info
    document.getElementById('recipe-allergens').value = (recipe.allergens || []).join(', ');
    document.getElementById('recipe-tips').value = recipe.tips || recipe.chefTips || '';
    document.getElementById('recipe-storage').value = recipe.storage || '';
    document.getElementById('recipe-served-with').value = recipe.bestServedWith || '';

    // Populate Ingredients
    const ingContainer = document.getElementById('ingredients-inputs-container');
    if (ingContainer && recipe.ingredients) {
      ingContainer.innerHTML = recipe.ingredients
        .map(
          (ing) => `
        <div class="dynamic-row" style="display:flex;gap:10px;margin-bottom:10px;">
          <input type="text" class="form-input ingredient-input" value="${ing}" required style="padding-left:14px;" />
          <button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()" style="color:var(--danger);padding:0 14px;">✕</button>
        </div>
      `
        )
        .join('');
    }

    // Populate Instructions
    const stepContainer = document.getElementById('steps-inputs-container');
    if (stepContainer && recipe.instructions) {
      stepContainer.innerHTML = recipe.instructions
        .map(
          (step, idx) => `
        <div class="dynamic-row" style="display:flex;gap:10px;margin-bottom:10px;">
          <span style="font-weight:700;color:var(--primary);margin-top:10px;min-width:24px;">${idx + 1}.</span>
          <textarea class="form-input step-input" rows="2" required style="padding-left:14px;resize:vertical;">${step}</textarea>
          <button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove(); renumberSteps();" style="color:var(--danger);padding:0 14px;align-self:flex-start;">✕</button>
        </div>
      `
        )
        .join('');
    }
  } catch (err) {
    showToast('Failed to load recipe details for editing', 'error');
  }
}

// Form Submission
function setupFormSubmit() {
  const form = document.getElementById('share-recipe-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentImageUrl) {
      showToast('Please provide a recipe image (upload file or paste image URL)', 'error');
      return;
    }

    const ingInputs = document.querySelectorAll('.ingredient-input');
    const ingredients = Array.from(ingInputs)
      .map((i) => i.value.trim())
      .filter(Boolean);

    const stepInputs = document.querySelectorAll('.step-input');
    const instructions = Array.from(stepInputs)
      .map((s) => s.value.trim())
      .filter(Boolean);

    if (ingredients.length === 0) {
      showToast('Please add at least one ingredient', 'error');
      return;
    }

    if (instructions.length === 0) {
      showToast('Please add at least one instruction step', 'error');
      return;
    }

    const payload = {
      title: document.getElementById('recipe-title').value.trim(),
      description: document.getElementById('recipe-desc').value.trim(),
      category: document.getElementById('recipe-category').value,
      subCategory: document.getElementById('recipe-subcategory').value,
      image: currentImageUrl,
      ingredients,
      instructions,
      prepTime: Number(document.getElementById('recipe-prep').value) || 15,
      cookTime: Number(document.getElementById('recipe-cook').value) || 20,
      servings: Number(document.getElementById('recipe-servings').value) || 4,
      difficulty: document.getElementById('recipe-difficulty').value,
      cuisine: document.getElementById('recipe-cuisine').value.trim() || 'Indian',
      diet: document.getElementById('recipe-diet').value,
      spiceLevel: document.getElementById('recipe-spice').value,
      nutrition: {
        calories: Number(document.getElementById('nut-calories').value) || 0,
        protein: Number(document.getElementById('nut-protein').value) || 0,
        carbohydrates: Number(document.getElementById('nut-carbs').value) || 0,
        fat: Number(document.getElementById('nut-fat').value) || 0,
        fiber: Number(document.getElementById('nut-fiber').value) || 0,
        sugar: Number(document.getElementById('nut-sugar').value) || 0,
        sodium: Number(document.getElementById('nut-sodium').value) || 0,
      },
      allergens: document.getElementById('recipe-allergens').value,
      tips: document.getElementById('recipe-tips').value.trim(),
      chefTips: document.getElementById('recipe-tips').value.trim(),
      storage: document.getElementById('recipe-storage').value.trim(),
      bestServedWith: document.getElementById('recipe-served-with').value.trim(),
    };

    const submitBtn = document.getElementById('submit-recipe-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving Recipe...';

    try {
      if (editRecipeId) {
        await API.put(`/recipes/${editRecipeId}`, payload);
        showToast('Recipe updated successfully! 🎉', 'success');
        setTimeout(() => {
          window.location.href = `recipe.html?id=${editRecipeId}`;
        }, 800);
      } else {
        const res = await API.post('/recipes', payload);
        showToast('Recipe published successfully! 🎉', 'success');
        setTimeout(() => {
          window.location.href = `recipe.html?id=${res.recipe._id}`;
        }, 800);
      }
    } catch (err) {
      showToast(err.message || 'Failed to save recipe', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = editRecipeId ? 'Update Recipe' : 'Publish Recipe';
    }
  });
}
