const express = require('express');
//Her exporter vi alle de funktioner vi skal bruge
const { getIngredients, getNutritionalInfo, saveRecipe, getRecipes } = require('../controllers/creator.js')

const router = express.Router();

router.get('/foodbank/food', getIngredients);

router.get('/foodbank/foodParameter', getNutritionalInfo);

router.post('/user/recipe', saveRecipe);

router.get('/user/recipe', getRecipes);

module.exports = router;