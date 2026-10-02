const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Recipe = require('../models/Recipe');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/reviews/recipe/:recipeId
// @desc    Get reviews for a specific recipe
// @access  Public
router.get('/recipe/:recipeId', async (req, res) => {
  try {
    const reviews = await Review.find({ recipeId: req.params.recipeId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name profileImage');

    res.json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
    });
  }
});

// @route   POST /api/reviews/recipe/:recipeId
// @desc    Add review & rating to a recipe
// @access  Private
router.post('/recipe/:recipeId', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { recipeId } = req.params;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both star rating and a review comment',
      });
    }

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found',
      });
    }

    // Check if user already reviewed this recipe
    let review = await Review.findOne({
      userId: req.user._id,
      recipeId,
    });

    if (review) {
      // Update existing review
      review.rating = Number(rating);
      review.comment = comment.trim();
      review.updatedAt = Date.now();
      await review.save();

      return res.json({
        success: true,
        message: 'Your review has been updated!',
        review,
      });
    }

    // Create new review
    review = await Review.create({
      userId: req.user._id,
      userName: req.user.name,
      userAvatar: req.user.profileImage || '',
      recipeId,
      rating: Number(rating),
      comment: comment.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for rating and reviewing this recipe!',
      review,
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit review',
    });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this review',
      });
    }

    const { rating, comment } = req.body;
    if (rating) review.rating = Number(rating);
    if (comment) review.comment = comment.trim();
    review.updatedAt = Date.now();

    await review.save();

    res.json({
      success: true,
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
    });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review',
      });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
    });
  }
});

module.exports = router;
