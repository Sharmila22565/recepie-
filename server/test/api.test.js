const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB, disconnectDB } = require('../config/db');
const { seedDatabase } = require('../seed/seedRecipes');
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const Favorite = require('../models/Favorite');
const Review = require('../models/Review');

dotenv.config();

const runApiTests = async () => {
  console.log('🧪 Starting RecipeShare Automated Integration & Verification Tests...');
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    // 1. DB Connection
    await connectDB();
    assert(mongoose.connection.readyState === 1, 'Database connected successfully');

    // 2. Seeding Test
    await Recipe.deleteMany({});
    await Review.deleteMany({});
    await Favorite.deleteMany({});
    await seedDatabase();

    const recipeCount = await Recipe.countDocuments();
    assert(recipeCount >= 15, `Seed recipes populated (Found: ${recipeCount})`);

    // 3. User Registration / Auth Test
    const testEmail = `testchef_${Date.now()}@example.com`;
    const user = await User.create({
      name: 'Test Chef Master',
      email: testEmail,
      password: 'SecurePassword123!',
      bio: 'Testing recipes with passion',
    });
    assert(user._id != null, 'User registration and password hashing');

    // 4. Password Verification Test
    const isPasswordValid = await user.matchPassword('SecurePassword123!');
    assert(isPasswordValid === true, 'Bcrypt password comparison works');

    // 5. Recipe Query & Category Filter Test
    const breakfastRecipes = await Recipe.find({ category: 'Breakfast' });
    assert(breakfastRecipes.length > 0, `Breakfast category query (Found: ${breakfastRecipes.length})`);

    const dessertRecipes = await Recipe.find({ category: 'Desserts' });
    assert(dessertRecipes.length > 0, `Desserts category query (Found: ${dessertRecipes.length})`);

    // 6. Recipe Search Test
    const searchResults = await Recipe.find({
      $or: [
        { title: /idli/i },
        { description: /idli/i },
        { ingredients: /idli/i },
      ],
    });
    assert(searchResults.length > 0, `Recipe search for 'Idli' (Found: ${searchResults.length})`);

    // 7. Recipe Creation Test
    const newRecipe = await Recipe.create({
      title: 'Crispy Garlic Butter Toast',
      description: 'Golden crunchy sourdough toast with fresh garlic herb butter.',
      category: 'Breakfast',
      subCategory: 'Bread & Egg',
      image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
      ingredients: ['2 slices Sourdough Bread', '2 tbsp Butter', '3 cloves Garlic'],
      instructions: ['Melt butter with garlic.', 'Toast bread in pan until golden brown.'],
      prepTime: 5,
      cookTime: 5,
      servings: 2,
      difficulty: 'Easy',
      cuisine: 'Continental',
      diet: 'Vegetarian',
      author: user._id,
      authorName: user.name,
    });
    assert(newRecipe.title === 'Crispy Garlic Butter Toast', 'Recipe creation with custom author');

    // 8. Favorite System Test
    const fav = await Favorite.create({
      userId: user._id,
      recipeId: newRecipe._id,
    });
    assert(fav._id != null, 'Recipe added to User Favorites');

    const userFavs = await Favorite.find({ userId: user._id });
    assert(userFavs.length === 1, 'User favorites query returned correct count');

    // 9. Review & Dynamic Average Rating Test
    const review = await Review.create({
      userId: user._id,
      userName: user.name,
      recipeId: newRecipe._id,
      rating: 5,
      comment: 'Absolutely delightful and quick breakfast toast!',
    });
    assert(review._id != null, 'Review submitted successfully');

    // Fetch updated recipe
    const updatedRecipe = await Recipe.findById(newRecipe._id);
    assert(updatedRecipe.rating === 5, 'Recipe average rating updated after review submission');

    // 10. Recipe Deletion & Cascade Clean-up
    await Recipe.findByIdAndDelete(newRecipe._id);
    await Favorite.deleteMany({ recipeId: newRecipe._id });
    await Review.deleteMany({ recipeId: newRecipe._id });

    const deletedRecipeCheck = await Recipe.findById(newRecipe._id);
    assert(deletedRecipeCheck === null, 'Recipe deletion successfully executed');

    console.log(`\n========================================================`);
    console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================================\n`);

    await disconnectDB();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
    await disconnectDB();
    process.exit(1);
  }
};

runApiTests();
