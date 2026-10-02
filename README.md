# 🍴 RecipeShare — "Discover. Cook. Share."

> A modern, full-stack restaurant-inspired recipe sharing and food discovery platform built with Node.js, Express.js, MongoDB, HTML5, Vanilla CSS3, and JavaScript.

![RecipeShare Screenshot](https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Features

- 🌟 **Restaurant-Inspired Discovery UI**: Warm terracotta & cream gourmet aesthetics, smooth animations, and responsive grids.
- 🌓 **Dark Mode & Light Mode**: Seamless theme toggle with user preference persistence via `localStorage`.
- 🔐 **Secure Authentication**: User registration, login with bcrypt password hashing, and JWT authorization for private pages.
- 🥞 **Multi-Course & Subcategory Navigation**:
  - **Breakfast**: Idli Varieties, Dosa Varieties, Uthappam & Adai, Upma & Pongal, Paratha, Bread & Egg.
  - **Lunch**: Rice & Biryani, South Indian Meals, Gravies & Curries, Roti & Sabzi.
  - **Starters**: Vegetarian, Non-Vegetarian, Soups.
  - **Dinner**: Chapati & Curry, Rice Dishes, South Indian Dinner, Non-Veg Specialties, Roti & Sabzi.
  - **Desserts**: Frozen (Kulfi, Ice Cream), Baked (Cheesecakes, Cakes), Custards & Puddings, Fried (Gulab Jamun, Churros), Fruit-Based Parfaits.
- 🔍 **Dynamic Search & Multi-Faceted Filters**: Live search across recipe names, ingredients, and cuisines, plus filters for difficulty, diet (Veg, Non-Veg, Vegan), cooking time, and sorting.
- 📖 **Interactive Recipe Viewer**:
  - Dynamic **Serving Size Scaler** (`+` / `-`) that automatically recalculates ingredient measurements in real time!
  - Interactive **Ingredients Cooking Checklist** with strikethroughs.
  - Step-by-step numbered cooking instructions.
  - Full **Nutrition Facts Breakdown** (Calories, Protein, Carbs, Fat, Fiber, Sugar, Sodium).
  - Chef's secret tips, allergens list, storage guidance, and best served with pairings.
  - **Print Recipe** and **Web Share / Clipboard Copy** tools.
  - **"You May Also Like"** smart recommendation engine.
- ❤️ **User Favorites Collection**: User-specific saved favorites with animated heart feedback.
- ✍️ **Create & Edit Recipes**: Rich creator dashboard with live image file upload & URL preview, dynamic ingredient and step row builders.
- ⭐ **Ratings & Reviews**: 5-star interactive rating system with auto-recalculated average ratings and user comments.
- 👤 **Chef Profile & Recipe Management**: Profile statistics, edit profile modal, and full owner control to edit or delete shared recipes.
- 🛠️ **Zero-Config Database Support**: Automatic fallback to embedded in-memory MongoDB when local MongoDB daemon is not running.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design Tokens, Flexbox & CSS Grid, Animations), Modular Vanilla JavaScript.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB & Mongoose.
- **Authentication**: JWT (JSON Web Tokens), `bcryptjs` password hashing.
- **File Uploads**: `multer` for local image storage with static serving.
- **Testing**: Built-in automated integration test suite (`npm test`).

---

## 📁 Project Structure

```
recepie/
├── client/
│   ├── index.html            # Landing & Home discovery page (Hero, Categories, Catalog)
│   ├── category.html         # Category & Subcategory browsing page
│   ├── recipe.html           # Full Recipe Details (Scaler, Nutrition, Reviews)
│   ├── share-recipe.html     # Create & Edit Recipe form with live image preview
│   ├── favorites.html        # User's saved favorite recipes
│   ├── profile.html          # User profile, statistics, and "My Recipes" management
│   ├── login.html            # User login page
│   ├── register.html         # User registration page
│   ├── css/
│   │   ├── style.css         # Core design system & theme variables (Light/Dark)
│   │   ├── auth.css          # Login/Register styles
│   │   ├── recipe.css        # Recipe details, reviews, cooking view styles
│   │   └── responsive.css    # Responsive breakpoints for mobile, tablet, desktop
│   └── js/
│       ├── api.js            # API client wrapper & toast notifications
│       ├── auth.js           # Auth state & dynamic navbar rendering
│       ├── main.js           # Shared utilities (theme switcher, mobile navbar)
│       ├── home.js           # Landing page logic & dynamic menu filters
│       ├── category.js       # Category & subcategory filtering logic
│       ├── recipe-details.js # Detailed recipe viewer & servings scaler
│       ├── share-recipe.js   # Dynamic form handler & image preview
│       ├── favorites.js      # Favorites grid & toggle
│       └── profile.js        # Profile info, stats, and My Recipes edit/delete
├── server/
│   ├── server.js             # Express app entry point & static routes
│   ├── config/
│   │   └── db.js             # Mongoose connection with Memory DB fallback
│   ├── models/
│   │   ├── User.js           # User schema
│   │   ├── Recipe.js         # Rich Recipe schema & nutrition
│   │   ├── Favorite.js       # Favorite schema
│   │   └── Review.js         # Review schema & auto rating aggregator
│   ├── routes/
│   │   ├── authRoutes.js     # /api/auth (register, login, me)
│   │   ├── recipeRoutes.js   # /api/recipes (CRUD, search, categories)
│   │   ├── favoriteRoutes.js # /api/favorites (add, remove, list)
│   │   ├── reviewRoutes.js   # /api/reviews (add, delete, recipe reviews)
│   │   ├── userRoutes.js     # /api/users (profile, stats, my recipes)
│   │   └── uploadRoutes.js   # /api/upload (multer image upload)
│   ├── middleware/
│   │   ├── authMiddleware.js # JWT protection
│   │   └── uploadMiddleware.js# Multer config
│   ├── seed/
│   │   └── seedRecipes.js    # 30+ rich authentic sample recipes
│   └── test/
│       └── api.test.js       # Integration test suite
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/recipeshare
JWT_SECRET=recipeshare_super_secret_jwt_key_2026_production
```
*(Note: If you leave `MONGODB_URI` blank or don't have MongoDB installed locally, RecipeShare will automatically run an embedded in-memory database with pre-seeded recipes!)*

### 3. Run Automated Tests
```bash
npm test
```

### 4. Start the Application
```bash
npm start
```
Open your browser and navigate to:
👉 **`http://localhost:5000`**

---

## 🔑 Default Sample Credentials

- **Chef Account**:
  - **Email**: `chef@recipeshare.com`
  - **Password**: `Password123!`
- Or easily register any new user account via the Register page!

---

## 📡 API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user | No |
| `POST` | `/api/auth/login` | Login user & receive JWT | No |
| `GET` | `/api/auth/me` | Get current user profile | Yes |
| `GET` | `/api/recipes` | Search, filter & list recipes | No |
| `GET` | `/api/recipes/:id` | Get recipe details & related recipes | No |
| `POST` | `/api/recipes` | Create new recipe | Yes |
| `PUT` | `/api/recipes/:id` | Update own recipe | Yes (Owner) |
| `DELETE` | `/api/recipes/:id` | Delete own recipe | Yes (Owner) |
| `GET` | `/api/recipes/category/:cat` | List recipes in category & subcategories | No |
| `GET` | `/api/favorites` | Get user's saved favorites | Yes |
| `POST` | `/api/favorites/:id` | Add recipe to favorites | Yes |
| `DELETE` | `/api/favorites/:id` | Remove recipe from favorites | Yes |
| `GET` | `/api/reviews/recipe/:id`| Get all reviews for a recipe | No |
| `POST` | `/api/reviews/recipe/:id`| Add / update review & rating | Yes |
| `DELETE` | `/api/reviews/:id` | Delete own review | Yes (Owner) |
| `GET` | `/api/users/profile` | Get profile, stats & created recipes | Yes |
| `PUT` | `/api/users/profile` | Update profile bio & image | Yes |
| `POST` | `/api/upload` | Upload image file | Yes |

---

## 📄 License

ISC License. Built for food enthusiasts & developers worldwide.
