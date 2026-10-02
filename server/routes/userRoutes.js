const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const Favorite = require('../models/Favorite');
const Review = require('../models/Review');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/users/profile
// @desc    Get user profile details with stats and created recipes
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const myRecipes = await Recipe.find({ author: user._id }).sort({ createdAt: -1 });
    const favoritesCount = await Favorite.countDocuments({ userId: user._id });
    const reviewsCount = await Review.countDocuments({ userId: user._id });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
        createdAt: user.createdAt,
      },
      stats: {
        recipesShared: myRecipes.length,
        favoritesCount,
        reviewsCount,
      },
      myRecipes,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, bio, profileImage } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (profileImage !== undefined) user.profileImage = profileImage.trim();

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
});

// @route   GET /api/users/my-recipes
// @desc    Get all recipes created by the authenticated user
// @access  Private
router.get('/my-recipes', protect, async (req, res) => {
  try {
    const recipes = await Recipe.find({ author: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: recipes.length,
      recipes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your recipes',
    });
  }
});

module.exports = router;
