const API_BASE = '/api';

// --- MOCK DATABASE SETUP ---
const DUMMY_RECIPES = [
  { _id: 'r1', title: 'Classic Spaghetti Bolognese', category: 'Dinner', difficulty: 'Medium', prepTime: 15, cookTime: 45, servings: 4, ingredients: ['400g Spaghetti', '500g Minced Beef'], instructions: ['Boil pasta', 'Cook meat and sauce'], image: 'https://images.unsplash.com/photo-1622973536968-3ead9e780960?auto=format&fit=crop&w=800&q=80', author: { _id: 'u1', name: 'Chef Mario', profileImage: '' }, rating: 4.8, numReviews: 12, createdAt: new Date(Date.now() - 1000000).toISOString() },
  { _id: 'r2', title: 'Avocado Toast with Egg', category: 'Breakfast', difficulty: 'Easy', prepTime: 5, cookTime: 5, servings: 1, ingredients: ['2 slices Bread', '1 Avocado', '2 Eggs'], instructions: ['Toast bread', 'Mash avocado', 'Fry eggs'], image: 'https://images.unsplash.com/photo-1525351484163-836154504142?auto=format&fit=crop&w=800&q=80', author: { _id: 'u2', name: 'Healthy Jane', profileImage: '' }, rating: 4.5, numReviews: 8, createdAt: new Date().toISOString() },
  { _id: 'r3', title: 'Chocolate Lava Cake', category: 'Dessert', difficulty: 'Hard', prepTime: 20, cookTime: 15, servings: 2, ingredients: ['100g Chocolate', '50g Butter', '50g Sugar'], instructions: ['Melt chocolate and butter', 'Mix with sugar and bake'], image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=800&q=80', author: { _id: 'u3', name: 'Sweet Tooth', profileImage: '' }, rating: 4.9, numReviews: 24, createdAt: new Date(Date.now() - 500000).toISOString() },
  { _id: 'r4', title: 'Chicken Tikka Masala', category: 'Lunch', difficulty: 'Medium', prepTime: 30, cookTime: 40, servings: 4, ingredients: ['500g Chicken breast', '1 cup Yogurt', 'Spices varies'], instructions: ['Marinate chicken', 'Cook in spiced tomato sauce'], image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80', author: { _id: 'u1', name: 'Chef Mario', profileImage: '' }, rating: 4.7, numReviews: 15, createdAt: new Date(Date.now() - 800000).toISOString() }
];

if (!localStorage.getItem('recipe_db_recipes')) {
  localStorage.setItem('recipe_db_recipes', JSON.stringify(DUMMY_RECIPES));
} else {
  // Migrate any existing recipes that use 'imageUrl' instead of 'image' or object ingredients/instructions
  let existing = JSON.parse(localStorage.getItem('recipe_db_recipes'));
  let updated = false;
  existing = existing.map(r => {
    if (r.imageUrl && !r.image) {
      r.image = r.imageUrl;
      delete r.imageUrl;
      updated = true;
    }
    if (r.ingredients && r.ingredients.length > 0 && typeof r.ingredients[0] === 'object') {
      r.ingredients = r.ingredients.map(i => `${i.amount || ''} ${i.item || ''}`.trim());
      updated = true;
    }
    if (r.instructions && r.instructions.length > 0 && typeof r.instructions[0] === 'object') {
      r.instructions = r.instructions.map(i => i.step || '');
      updated = true;
    }
    return r;
  });
  if (updated) localStorage.setItem('recipe_db_recipes', JSON.stringify(existing));
}
if (!localStorage.getItem('recipe_db_users')) localStorage.setItem('recipe_db_users', JSON.stringify([]));
if (!localStorage.getItem('recipe_db_favorites')) localStorage.setItem('recipe_db_favorites', JSON.stringify({}));
if (!localStorage.getItem('recipe_db_reviews')) localStorage.setItem('recipe_db_reviews', JSON.stringify([]));

const db = {
  get: (key) => JSON.parse(localStorage.getItem('recipe_db_' + key) || '[]'),
  set: (key, val) => localStorage.setItem('recipe_db_' + key, JSON.stringify(val)),
  currentUser: () => {
    const token = localStorage.getItem('recipe_share_token');
    if (!token) return null;
    const users = db.get('users');
    return users.find(u => u._id === token) || null;
  }
};

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

const parseQuery = (url) => {
  const parts = url.split('?');
  if (parts.length < 2) return {};
  const query = new URLSearchParams(parts[1]);
  return Object.fromEntries(query.entries());
};

const matchRoute = (endpoint) => {
  const path = endpoint.split('?')[0];
  const segments = path.replace(/^\/api/, '').split('/').filter(Boolean);
  return segments;
};

// --- MOCK API IMPLEMENTATION ---
const mockRequest = async (method, endpoint, bodyStr) => {
  await delay();
  const segments = matchRoute(endpoint);
  const query = parseQuery(endpoint);
  
  // Handle FormData for image uploads
  let body = null;
  if (bodyStr instanceof FormData) {
     body = {};
     for (let [key, value] of bodyStr.entries()) {
        body[key] = value;
     }
  } else if (bodyStr) {
     body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr;
  }
  
  const user = db.currentUser();

  // Auth Routes
  if (segments[0] === 'auth') {
    const users = db.get('users');
    if (segments[1] === 'register' && method === 'POST') {
      if (users.find(u => u.email === body.email)) throw new Error('User already exists');
      const newUser = { _id: 'u_' + Date.now(), name: body.name, email: body.email, password: body.password, bio: '', profileImage: '' };
      users.push(newUser);
      db.set('users', users);
      return { success: true, token: newUser._id, user: { _id: newUser._id, name: newUser.name, email: newUser.email } };
    }
    if (segments[1] === 'login' && method === 'POST') {
      const u = users.find(u => u.email === body.email && u.password === body.password);
      if (!u) throw new Error('Invalid credentials');
      return { success: true, token: u._id, user: { _id: u._id, name: u.name, email: u.email } };
    }
    if (segments[1] === 'logout') return { message: 'Logged out' };
  }

  // Users Routes
  if (segments[0] === 'users' && segments[1] === 'profile') {
    if (!user) throw new Error('Unauthorized');
    if (method === 'GET') {
      const recipes = db.get('recipes').filter(r => r.author._id === user._id);
      return { user, recipes };
    }
    if (method === 'PUT') {
      const users = db.get('users');
      const idx = users.findIndex(u => u._id === user._id);
      users[idx] = { ...users[idx], name: body.name || users[idx].name, bio: body.bio || users[idx].bio, profileImage: body.profileImage || users[idx].profileImage };
      db.set('users', users);
      return { user: users[idx] };
    }
  }

  // Upload Route
  if (segments[0] === 'upload' && method === 'POST') {
    // Return a dummy image URL for file uploads since we cannot save file buffers
    return { imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80' };
  }

  // Favorites
  if (segments[0] === 'favorites') {
    if (!user) throw new Error('Unauthorized');
    const favs = db.get('favorites');
    const userFavs = favs[user._id] || [];
    
    if (method === 'GET') {
      const recipes = db.get('recipes');
      const filtered = recipes.filter(r => userFavs.includes(r._id));
      return { count: filtered.length, favorites: filtered };
    }
    if (method === 'POST' && segments[1]) {
      if (!userFavs.includes(segments[1])) {
        userFavs.push(segments[1]);
        favs[user._id] = userFavs;
        db.set('favorites', favs);
      }
      return { message: 'Added to favorites' };
    }
    if (method === 'DELETE' && segments[1]) {
      favs[user._id] = userFavs.filter(id => id !== segments[1]);
      db.set('favorites', favs);
      return { message: 'Removed from favorites' };
    }
  }

  // Reviews
  if (segments[0] === 'reviews') {
    const reviews = db.get('reviews');
    if (method === 'GET' && segments[1] === 'recipe') {
      const filtered = reviews.filter(r => r.recipeId === segments[2]);
      return { count: filtered.length, reviews: filtered };
    }
    if (method === 'POST' && segments[1] === 'recipe') {
      if (!user) throw new Error('Unauthorized');
      const newReview = { _id: 'rev_' + Date.now(), recipeId: segments[2], user: { _id: user._id, name: user.name, profileImage: user.profileImage }, rating: body.rating, comment: body.comment, createdAt: new Date().toISOString() };
      reviews.push(newReview);
      db.set('reviews', reviews);
      
      // Update recipe rating
      const recipes = db.get('recipes');
      const recipe = recipes.find(r => r._id === segments[2]);
      if(recipe) {
         const recipeReviews = reviews.filter(r => r.recipeId === recipe._id);
         recipe.numReviews = recipeReviews.length;
         recipe.rating = recipeReviews.reduce((sum, r) => sum + r.rating, 0) / recipe.numReviews || 0;
         db.set('recipes', recipes);
      }
      return newReview;
    }
    if (method === 'DELETE' && segments[1]) {
       if (!user) throw new Error('Unauthorized');
       const filtered = reviews.filter(r => r._id !== segments[1] || r.user._id !== user._id);
       db.set('reviews', filtered);
       return { message: 'Deleted' };
    }
  }

  // Recipes Routes
  if (segments[0] === 'recipes') {
    let recipes = db.get('recipes');
    
    if (method === 'GET') {
      if (segments[1] === 'trending') return { recipes: recipes.sort((a, b) => b.rating - a.rating).slice(0, query.limit || 4) };
      if (segments[1] === 'popular') return { recipes: recipes.sort((a, b) => b.numReviews - a.numReviews).slice(0, query.limit || 4) };
      if (segments[1] === 'recent') return { recipes: recipes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, query.limit || 4) };
      if (segments[1] === 'top-rated') return { recipes: recipes.sort((a, b) => b.rating - a.rating).slice(0, query.limit || 4) };
      
      if (segments[1] === 'category') {
         const filtered = recipes.filter(r => r.category.toLowerCase() === decodeURIComponent(segments[2]).toLowerCase());
         const subCats = [...new Set(filtered.map(r => r.subCategory || 'Other'))];
         return { recipes: filtered, total: filtered.length, subCategories: subCats };
      } else if (segments[1]) {
         const recipe = recipes.find(r => r._id === segments[1]);
         if (!recipe) throw new Error('Recipe not found');
         const relatedRecipes = recipes.filter(r => r.category === recipe.category && r._id !== recipe._id).slice(0, 3);
         return { recipe, relatedRecipes };
      }
      
      // Filtering
      if (query.search) {
         const q = query.search.toLowerCase();
         recipes = recipes.filter(r => r.title.toLowerCase().includes(q) || r.ingredients.some(i => i.item.toLowerCase().includes(q)));
      }
      if (query.category && query.category !== 'All') {
         recipes = recipes.filter(r => r.category === query.category);
      }
      if (query.difficulty && query.difficulty !== 'All') {
         recipes = recipes.filter(r => r.difficulty === query.difficulty);
      }
      if (query.time && query.time !== 'All') {
         const maxTime = parseInt(query.time);
         recipes = recipes.filter(r => (r.prepTime + r.cookTime) <= maxTime);
      }
      
      const page = parseInt(query.page || 1);
      const limit = parseInt(query.limit || 9);
      const startIndex = (page - 1) * limit;
      
      return {
         recipes: recipes.slice(startIndex, startIndex + limit),
         pagination: { totalPages: Math.ceil(recipes.length / limit), currentPage: page }
      };
    }
    
    if (method === 'POST') {
       if (!user) throw new Error('Unauthorized');
       const newRecipe = {
          _id: 'r_' + Date.now(),
          ...body,
          author: { _id: user._id, name: user.name, profileImage: user.profileImage },
          rating: 0,
          numReviews: 0,
          createdAt: new Date().toISOString()
       };
       recipes.push(newRecipe);
       db.set('recipes', recipes);
       return { recipe: newRecipe };
    }
    
    if (method === 'PUT' && segments[1]) {
       if (!user) throw new Error('Unauthorized');
       const idx = recipes.findIndex(r => r._id === segments[1]);
       if (idx === -1) throw new Error('Not found');
       if (recipes[idx].author._id !== user._id) throw new Error('Not authorized');
       recipes[idx] = { ...recipes[idx], ...body };
       db.set('recipes', recipes);
       return recipes[idx];
    }
    
    if (method === 'DELETE' && segments[1]) {
       if (!user) throw new Error('Unauthorized');
       const idx = recipes.findIndex(r => r._id === segments[1]);
       if (idx !== -1 && recipes[idx].author._id === user._id) {
          recipes.splice(idx, 1);
          db.set('recipes', recipes);
       }
       return { message: 'Deleted' };
    }
  }

  throw new Error('API Endpoint Not Found: ' + endpoint);
};

const API = {
  getToken() { return localStorage.getItem('recipe_share_token'); },
  getHeaders(isMultipart = false) { return {}; },
  async request(endpoint, options = {}) {
     try {
        return await mockRequest(options.method || 'GET', endpoint, options.body);
     } catch (err) {
        console.error('API Error [' + endpoint + ']:', err);
        throw err;
     }
  },
  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? endpoint + '?' + queryString : endpoint;
    return this.request(url, { method: 'GET' });
  },
  post(endpoint, body) { return this.request(endpoint, { method: 'POST', body }); },
  put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body }); },
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); },
};

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = '<div style=\"display:flex;align-items:center;gap:10px;\"><span style=\"font-weight:bold;\">' + icon + '</span><span>' + message + '</span></div><button style=\"color:var(--text-light);font-size:1.1rem;cursor:pointer;background:none;border:none;\" onclick=\"this.parentElement.remove()\">×</button>';
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
