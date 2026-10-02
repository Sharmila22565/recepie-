const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate favorites for same user + recipe
favoriteSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
