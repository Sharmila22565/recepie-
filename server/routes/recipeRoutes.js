const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const Favorite = require('../models/Favorite');
const Review = require('../models/Review');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// @route   GET /api/recipes
// @desc    Get recipes with search, multi-faceted filtering, sorting, and pagination
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      q,
      search,
      category,
      subCategory,
      difficulty,
      diet,
      cuisine,
      maxCookTime,
      author,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};

    // Search by text query
    const searchQuery = q || search;
    if (searchQuery && searchQuery.trim()) {
      const regex = new RegExp(searchQuery.trim(), 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { category: regex },
        { subCategory: regex },
        { cuisine: regex },
        { ingredients: regex },
      ];
    }

    // Category filter
    if (category && category !== 'All' && category !== 'all') {
      filter.category = new RegExp(`^${category}$`, 'i');
    }

    // SubCategory filter
    if (subCategory && subCategory !== 'All' && subCategory !== 'all') {
      filter.subCategory = new RegExp(`^${subCategory}$`, 'i');
    }

    // Difficulty filter
    if (difficulty && difficulty !== 'All') {
      filter.difficulty = difficulty;
    }

    // Diet filter
    if (diet && diet !== 'All') {
      filter.diet = diet;
    }

    // Cuisine filter
    if (cuisine && cuisine !== 'All') {
      filter.cuisine = new RegExp(`^${cuisine}$`, 'i');
    }

    // Max Cooking Time filter
    if (maxCookTime) {
      const maxTime = parseInt(maxCookTime, 10);
      if (!isNaN(maxTime) && maxTime > 0) {
        filter.cookTime = { $lte: maxTime };
      }
    }

    // Author filter
    if (author) {
      filter.author = author;
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default newest
    if (sort === 'rating') {
      sortOption = { rating: -1, numReviews: -1 };
    } else if (sort === 'popular') {
      sortOption = { viewsCount: -1, rating: -1 };
    } else if (sort === 'cookTime_asc') {
      sortOption = { cookTime: 1 };
    } else if (sort === 'cookTime_desc') {
      sortOption = { cookTime: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * pageSize;

    const total = await Recipe.countDocuments(filter);
    const recipes = await Recipe.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(pageSize)
      .populate('author', 'name profileImage');

    // If user logged in, check which recipes are favorited
    let favoritedIds = new Set();
    if (req.user) {
      const favs = await Favorite.find({
        userId: req.user._id,
        recipeId: { $in: recipes.map((r) => r._id) },
      });
      favoritedIds = new Set(favs.map((f) => f.recipeId.toString()));
    }

    const recipesWithFav = recipes.map((r) => {
      const obj = r.toObject();
      obj.isFavorited = favoritedIds.has(r._id.toString());
      return obj;
    });

    res.json({
      success: true,
      count: recipes.length,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: pageNum,
      recipes: recipesWithFav,
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipes',
    });
  }
});

// @route   GET /api/recipes/trending
// @desc    Get trending recipes
// @access  Public
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;
    const recipes = await Recipe.find({})
      .sort({ rating: -1, viewsCount: -1, createdAt: -1 })
      .limit(limit);

    let favoritedIds = new Set();
    if (req.user) {
      const favs = await Favorite.find({
        userId: req.user._id,
        recipeId: { $in: recipes.map((r) => r._id) },
      });
      favoritedIds = new Set(favs.map((f) => f.recipeId.toString()));
    }

    const result = recipes.map((r) => {
      const obj = r.toObject();
      obj.isFavorited = favoritedIds.has(r._id.toString());
      return obj;
    });

    res.json({ success: true, recipes: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load trending recipes' });
  }
});

// @route   GET /api/recipes/popular
// @desc    Get popular recipes
// @access  Public
router.get('/popular', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;
    const recipes = await Recipe.find({})
      .sort({ viewsCount: -1, rating: -1 })
      .limit(limit);

    let favoritedIds = new Set();
    if (req.user) {
      const favs = await Favorite.find({
        userId: req.user._id,
        recipeId: { $in: recipes.map((r) => r._id) },
      });
      favoritedIds = new Set(favs.map((f) => f.recipeId.toString()));
    }

    const result = recipes.map((r) => {
      const obj = r.toObject();
      obj.isFavorited = favoritedIds.has(r._id.toString());
      return obj;
    });

    res.json({ success: true, recipes: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load popular recipes' });
  }
});

// @route   GET /api/recipes/recent
// @desc    Get recently added recipes
// @access  Public
router.get('/recent', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;
    const recipes = await Recipe.find({})
      .sort({ createdAt: -1 })
      .limit(limit);

    let favoritedIds = new Set();
    if (req.user) {
      const favs = await Favorite.find({
        userId: req.user._id,
        recipeId: { $in: recipes.map((r) => r._id) },
      });
      favoritedIds = new Set(favs.map((f) => f.recipeId.toString()));
    }

    const result = recipes.map((r) => {
      const obj = r.toObject();
      obj.isFavorited = favoritedIds.has(r._id.toString());
      return obj;
    });

    res.json({ success: true, recipes: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load recent recipes' });
  }
});

// @route   GET /api/recipes/top-rated
// @desc    Get highly rated recipes
// @access  Public
router.get('/top-rated', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;
    const recipes = await Recipe.find({ rating: { $gte: 4.5 } })
      .sort({ rating: -1, numReviews: -1 })
      .limit(limit);

    let favoritedIds = new Set();
    if (req.user) {
      const favs = await Favorite.find({
        userId: req.user._id,
        recipeId: { $in: recipes.map((r) => r._id) },
      });
      favoritedIds = new Set(favs.map((f) => f.recipeId.toString()));
    }

    const result = recipes.map((r) => {
      const obj = r.toObject();
      obj.isFavorited = favoritedIds.has(r._id.toString());
      return obj;
    });

    res.json({ success: true, recipes: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load top rated recipes' });
  }
});

// @route   GET /api/recipes/category/:category
// @desc    Get recipes by specific category
// @access  Public
router.get('/category/:category', optionalAuth, async (req, res) => {
  try {
    const { category } = req.params;
    const { subCategory, sort, page = 1, limit = 12 } = req.query;

    const filter = { category: new RegExp(`^${category}$`, 'i') };
    if (subCategory && subCategory !== 'All') {
      filter.subCategory = new RegExp(`^${subCategory}$`, 'i');
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };
    if (sort === 'time') sortOption = { cookTime: 1 };

    const pageNum = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * pageSize;

    const total = await Recipe.countDocuments(filter);
    const recipes = await Recipe.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(pageSize);

    // Distinct subcategories for this category
    const subCategories = await Recipe.distinct('subCategory', {
      category: new RegExp(`^${category}$`, 'i'),
    });

    let favoritedIds = new Set();
    if (req.user) {
      const favs = await Favorite.find({
        userId: req.user._id,
        recipeId: { $in: recipes.map((r) => r._id) },
      });
      favoritedIds = new Set(favs.map((f) => f.recipeId.toString()));
    }

    const result = recipes.map((r) => {
      const obj = r.toObject();
      obj.isFavorited = favoritedIds.has(r._id.toString());
      return obj;
    });

    res.json({
      success: true,
      category,
      subCategories,
      count: recipes.length,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: pageNum,
      recipes: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch category recipes' });
  }
});

// @route   GET /api/recipes/:id
// @desc    Get single recipe details + related recipes
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewsCount: 1 } },
      { new: true }
    ).populate('author', 'name email profileImage');

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found',
      });
    }

    // Check if favorited by current user
    let isFavorited = false;
    if (req.user) {
      const fav = await Favorite.findOne({
        userId: req.user._id,
        recipeId: recipe._id,
      });
      isFavorited = !!fav;
    }

    // Recommendation logic for "You May Also Like" (4-6 recipes):
    // Priority:
    // 1. Same subcategory
    // 2. Same category
    // 3. Similar cuisine or diet
    // Exclude current recipe
    let relatedRecipes = await Recipe.find({
      _id: { $ne: recipe._id },
      subCategory: recipe.subCategory,
    }).limit(6);

    if (relatedRecipes.length < 4) {
      const needed = 6 - relatedRecipes.length;
      const additional = await Recipe.find({
        _id: { $nin: [recipe._id, ...relatedRecipes.map((r) => r._id)] },
        category: recipe.category,
      }).limit(needed);
      relatedRecipes = [...relatedRecipes, ...additional];
    }

    if (relatedRecipes.length < 4) {
      const needed = 6 - relatedRecipes.length;
      const additional = await Recipe.find({
        _id: { $nin: [recipe._id, ...relatedRecipes.map((r) => r._id)] },
        cuisine: recipe.cuisine,
      }).limit(needed);
      relatedRecipes = [...relatedRecipes, ...additional];
    }

    const recipeData = recipe.toObject();
    recipeData.isFavorited = isFavorited;

    res.json({
      success: true,
      recipe: recipeData,
      relatedRecipes,
    });
  } catch (error) {
    console.error('Error fetching recipe by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipe details',
    });
  }
});

// @route   POST /api/recipes
// @desc    Create a new recipe
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subCategory,
      image,
      ingredients,
      instructions,
      prepTime,
      cookTime,
      servings,
      difficulty,
      cuisine,
      diet,
      nutrition,
      allergens,
      tips,
      chefTips,
      storage,
      bestServedWith,
      spiceLevel,
      equipment,
      bestTimeToEat,
    } = req.body;

    if (!title || !description || !category || !subCategory || !image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Title, Description, Category, Subcategory, and Image',
      });
    }

    // Format ingredients & instructions if they arrive as strings or arrays
    const formattedIngredients = Array.isArray(ingredients)
      ? ingredients.filter((i) => i && i.trim())
      : typeof ingredients === 'string'
      ? ingredients.split('\n').map((i) => i.trim()).filter(Boolean)
      : [];

    const formattedInstructions = Array.isArray(instructions)
      ? instructions.filter((i) => i && i.trim())
      : typeof instructions === 'string'
      ? instructions.split('\n').map((i) => i.trim()).filter(Boolean)
      : [];

    if (formattedIngredients.length === 0 || formattedInstructions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one ingredient and one instruction step',
      });
    }

    const recipe = await Recipe.create({
      title,
      description,
      category,
      subCategory,
      image,
      ingredients: formattedIngredients,
      instructions: formattedInstructions,
      prepTime: Number(prepTime) || 15,
      cookTime: Number(cookTime) || 20,
      servings: Number(servings) || 4,
      difficulty: difficulty || 'Easy',
      cuisine: cuisine || 'Indian',
      diet: diet || 'Vegetarian',
      nutrition: nutrition || {},
      allergens: Array.isArray(allergens)
        ? allergens
        : typeof allergens === 'string'
        ? allergens.split(',').map((a) => a.trim()).filter(Boolean)
        : [],
      tips: tips || '',
      chefTips: chefTips || '',
      storage: storage || '',
      bestServedWith: bestServedWith || '',
      spiceLevel: spiceLevel || 'Medium',
      equipment: Array.isArray(equipment)
        ? equipment
        : typeof equipment === 'string'
        ? equipment.split(',').map((e) => e.trim()).filter(Boolean)
        : [],
      bestTimeToEat: bestTimeToEat || '',
      author: req.user._id,
      authorName: req.user.name,
      rating: 5.0,
      numReviews: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Recipe published successfully!',
      recipe,
    });
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create recipe',
    });
  }
});

// @route   PUT /api/recipes/:id
// @desc    Update an existing recipe
// @access  Private (Owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    let recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found',
      });
    }

    // Check ownership
    if (recipe.author && recipe.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this recipe',
      });
    }

    // Process array formats if passed as strings
    const updates = { ...req.body };
    if (typeof updates.ingredients === 'string') {
      updates.ingredients = updates.ingredients.split('\n').map((i) => i.trim()).filter(Boolean);
    }
    if (typeof updates.instructions === 'string') {
      updates.instructions = updates.instructions.split('\n').map((i) => i.trim()).filter(Boolean);
    }
    if (typeof updates.allergens === 'string') {
      updates.allergens = updates.allergens.split(',').map((a) => a.trim()).filter(Boolean);
    }
    if (typeof updates.equipment === 'string') {
      updates.equipment = updates.equipment.split(',').map((e) => e.trim()).filter(Boolean);
    }

    recipe = await Recipe.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Recipe updated successfully!',
      recipe,
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update recipe',
    });
  }
});

// @route   DELETE /api/recipes/:id
// @desc    Delete a recipe
// @access  Private (Owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found',
      });
    }

    // Check ownership
    if (recipe.author && recipe.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this recipe',
      });
    }

    await Recipe.findByIdAndDelete(req.params.id);
    // Remove all associated favorites & reviews
    await Favorite.deleteMany({ recipeId: req.params.id });
    await Review.deleteMany({ recipeId: req.params.id });

    res.json({
      success: true,
      message: 'Recipe deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recipe',
    });
  }
});

module.exports = router;
