const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userAvatar: {
      type: String,
      default: '',
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Please provide a rating between 1 and 5'],
    },
    comment: {
      type: String,
      required: [true, 'Please provide review comments'],
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get avg rating and save
reviewSchema.statics.getAverageRating = async function (recipeId) {
  const stats = await this.aggregate([
    {
      $match: { recipeId: new mongoose.Types.ObjectId(recipeId) },
    },
    {
      $group: {
        _id: '$recipeId',
        averageRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  try {
    const Recipe = mongoose.model('Recipe');
    if (stats.length > 0) {
      await Recipe.findByIdAndUpdate(recipeId, {
        rating: Math.round(stats[0].averageRating * 10) / 10,
        numReviews: stats[0].numReviews,
      });
    } else {
      await Recipe.findByIdAndUpdate(recipeId, {
        rating: 0,
        numReviews: 0,
      });
    }
  } catch (err) {
    console.error('Error updating recipe rating stats:', err);
  }
};

// Call getAverageRating after save
reviewSchema.post('save', async function () {
  await this.constructor.getAverageRating(this.recipeId);
});

// Call getAverageRating after remove/delete
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.getAverageRating(doc.recipeId);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
