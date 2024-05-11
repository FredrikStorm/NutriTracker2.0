const express = require('express');
//Her exporter vi alle de funktioner vi skal bruge
const {  fetchRecipeNutrition, createMeal, fetchMeals, updateMeal, deleteMealController, addWater, getRecipes, getIngredients, getNutritionalInfo, saveRecipe } = require('../controllers/tracker.js')

const router = express.Router();

//Meal tracker
router.get('/user/recipe/:recipeId', fetchRecipeNutrition);

router.post('/user/meal', createMeal);

router.get('/user/meal', fetchMeals);

router.put('/user/meal/:mealID', updateMeal);

router.delete('/user/meal/:mealID', deleteMealController);

router.post('/user/water', addWater)

router.get('/user/recipe', getRecipes);

router.get('/foodbank/food', getIngredients);

router.get('/foodbank/foodParameter', getNutritionalInfo);

router.post('/user/recipe', saveRecipe);

module.exports = router;