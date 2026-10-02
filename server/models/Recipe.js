const mongoose = require('mongoose');

const nutritionSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 }, // in grams
    carbohydrates: { type: Number, default: 0 }, // in grams
    fat: { type: Number, default: 0 }, // in grams
    fiber: { type: Number, default: 0 }, // in grams
    sugar: { type: Number, default: 0 }, // in grams
    sodium: { type: Number, default: 0 }, // in mg
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a recipe title'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Please provide a recipe description'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: ['Breakfast', 'Lunch', 'Starters', 'Dinner', 'Desserts'],
    },
    subCategory: {
      type: String,
      required: [true, 'Please provide a subcategory'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Please provide an image for the recipe'],
    },
    imageAlt: {
      type: String,
      default: '',
    },
    ingredients: {
      type: [String],
      required: [true, 'Please add at least one ingredient'],
      validate: [v => Array.isArray(v) && v.length > 0, 'Ingredients list cannot be empty'],
    },
    instructions: {
      type: [String],
      required: [true, 'Please add step-by-step instructions'],
      validate: [v => Array.isArray(v) && v.length > 0, 'Instructions list cannot be empty'],
    },
    prepTime: {
      type: Number,
      required: true,
      default: 15, // in minutes
    },
    cookTime: {
      type: Number,
      required: true,
      default: 25, // in minutes
    },
    totalTime: {
      type: Number,
      default: function () {
        return (this.prepTime || 0) + (this.cookTime || 0);
      },
    },
    servings: {
      type: Number,
      required: true,
      default: 4,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Easy',
    },
    cuisine: {
      type: String,
      default: 'South Indian',
      trim: true,
    },
    diet: {
      type: String,
      enum: ['Vegetarian', 'Non-Vegetarian', 'Vegan'],
      default: 'Vegetarian',
    },
    nutrition: {
      type: nutritionSchema,
      default: () => ({}),
    },
    allergens: {
      type: [String],
      default: [],
    },
    tips: {
      type: String,
      default: '',
    },
    chefTips: {
      type: String,
      default: '',
    },
    storage: {
      type: String,
      default: '',
    },
    bestServedWith: {
      type: String,
      default: '',
    },
    spiceLevel: {
      type: String,
      enum: ['None', 'Mild', 'Medium', 'Hot', 'Extra Hot'],
      default: 'Medium',
    },
    equipment: {
      type: [String],
      default: [],
    },
    bestTimeToEat: {
      type: String,
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    authorName: {
      type: String,
      default: 'Chef RecipeShare',
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for reviews
recipeSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'recipeId',
  justOne: false,
});

// Update totalTime before save
recipeSchema.pre('save', function (next) {
  this.totalTime = (this.prepTime || 0) + (this.cookTime || 0);
  if (!this.imageAlt) {
    this.imageAlt = this.title;
  }
  next();
});

// Text index for search
recipeSchema.index({
  title: 'text',
  description: 'text',
  category: 'text',
  subCategory: 'text',
  cuisine: 'text',
  ingredients: 'text',
});

module.exports = mongoose.model('Recipe', recipeSchema);
