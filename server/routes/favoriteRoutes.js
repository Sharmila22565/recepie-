const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const Recipe = require('../models/Recipe');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/favorites
// @desc    Get current user's favorite recipes
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'recipeId',
        populate: { path: 'author', select: 'name profileImage' },
      });

    // Filter out null recipes (in case a recipe was deleted)
    const validRecipes = favorites
      .filter((fav) => fav.recipeId !== null)
      .map((fav) => {
        const r = fav.recipeId.toObject();
        r.isFavorited = true;
        r.favoritedAt = fav.createdAt;
        return r;
      });

    res.json({
      success: true,
      count: validRecipes.length,
      favorites: validRecipes,
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites',
    });
  }
});

// @route   POST /api/favorites/:recipeId
// @desc    Add recipe to favorites
// @access  Private
router.post('/:recipeId', protect, async (req, res) => {
  try {
    const { recipeId } = req.params;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found',
      });
    }

    const existingFav = await Favorite.findOne({
      userId: req.user._id,
      recipeId,
    });

    if (existingFav) {
      return res.json({
        success: true,
        message: 'Recipe is already in your favorites ❤️',
        isFavorited: true,
      });
    }

    await Favorite.create({
      userId: req.user._id,
      recipeId,
    });

    res.status(201).json({
      success: true,
      message: 'Recipe added to favorites ❤️',
      isFavorited: true,
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to favorites',
    });
  }
});

// @route   DELETE /api/favorites/:recipeId
// @desc    Remove recipe from favorites
// @access  Private
router.delete('/:recipeId', protect, async (req, res) => {
  try {
    const { recipeId } = req.params;

    const deleted = await Favorite.findOneAndDelete({
      userId: req.user._id,
      recipeId,
    });

    res.json({
      success: true,
      message: 'Recipe removed from favorites',
      isFavorited: false,
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites',
    });
  }
});

// @route   GET /api/favorites/check/:recipeId
// @desc    Check if a recipe is in user's favorites
// @access  Private
router.get('/check/:recipeId', protect, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const fav = await Favorite.findOne({
      userId: req.user._id,
      recipeId,
    });

    res.json({
      success: true,
      isFavorited: !!fav,
    });
  } catch (error) {
    res.status(500).json({ success: false, isFavorited: false });
  }
});

module.exports = router;
