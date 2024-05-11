const { getRecipeNutrition, saveMeal, getMealsByUserId, updateMealWeight, deleteMeal, logWater, fetchRecipes, fetchIngredients, fetchNutritionalInfo, saveRecipeDetails } = require('../Model/tracker.js')
const cors = require('cors'); // CORS-modul til at tillade anmodninger


const fetchRecipeNutrition = (cors(), async (req, res) => {
    const { recipeId } = req.params;
    try {
        const nutrition = await getRecipeNutrition(recipeId);
        res.json(nutrition);
    } catch (error) {
        console.error('Error fetching recipe nutrition:', error);
        res.status(500).send('Error fetching recipe nutrition');
    }
});

const createMeal = (cors(), async (req, res) => {
    const { date, time, location, weight, userID, recipeID } = req.body;
    try {
        const result = await saveMeal(date, time, location, weight, userID, recipeID);
        if (result.success) {
            res.status(201).json({ success: true, mealID: result.mealID });
        } else {
            res.status(400).json({ success: false, message: "Unable to save meal" });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

const fetchMeals = (cors(), async (req, res) => {
    const { userID } = req.query;
    try {
        const meals = await getMealsByUserId(userID);
        res.json(meals);
    } catch (error) {
        console.error('Error fetching meals:', error);
        res.status(500).send('Error fetching meals');
    }
});

const updateMeal = (cors(), async (req, res) => {
    const { mealID } = req.params;
    const { weight } = req.body;
    
    if (!weight || isNaN(weight)) {
        return res.status(400).json({ error: 'Invalid weight provided' });
    }

    try {
        const rowsAffected = await updateMealWeight(mealID, weight);
        if (rowsAffected === 0) {
            return res.status(404).json({ message: 'Meal not found' });
        }
        res.status(200).json({ message: 'Meal updated successfully', weight: weight });
    } catch (error) {
        console.error('Server error updating meal:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

const deleteMealController = (cors(), async (req, res) => {
    const { mealID } = req.params;
    if (!mealID || isNaN(parseInt(mealID, 10))) {
        return res.status(400).send('Invalid meal ID');
    }

    try {
        await deleteMeal(mealID);
        res.send('Meal deleted successfully');
    } catch (error) {
        console.error('Error deleting meal:', error);
        res.status(500).send('Failed to delete meal');
    }
});

const addWater = (cors(), async (req, res) => {
    const { userID } = req.body;
    try {
        const result = await logWater(userID);
        res.status(201).json({ message: "Water intake logged successfully", id: result.insertId });
    } catch (error) {
        console.error('Error logging water intake:', error);
        res.status(500).send('Server error');
    }
});

const getRecipes = async (req, res) => {
    const { userID } = req.query;
    if (isNaN(userID) || userID <= 0) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    try {
        const result = await fetchRecipes(userID);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).send('Error fetching recipes');
    }
};


const getIngredients = async (req, res) => {
    const searchString = req.query.search || '';
    try {
        const result = await fetchIngredients(searchString);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        res.status(500).send('Error fetching ingredients');
    }
};

const getNutritionalInfo = async (req, res) => {
    const { foodID, parameterID } = req.query;
    try {
        const result = await fetchNutritionalInfo(foodID, parameterID);
        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).send('No data found');
        }
    } catch (error) {
        console.error('Error fetching nutritional information:', error);
        res.status(500).send('Error fetching nutritional information');
    }
};

const saveRecipe = async (req, res) => {
    const { recipeName, userID, protein, kcal, fat, fiber } = req.body;
    if (!recipeName || typeof recipeName !== 'string' || recipeName.trim() === '') {
        return res.status(400).json({ error: 'Invalid recipe name' });
    }
    if (isNaN(userID) || userID <= 0) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    if (isNaN(protein) || isNaN(kcal) || isNaN(fat) || isNaN(fiber) || protein < 0 || kcal < 0 || fat < 0 || fiber < 0) {
        return res.status(400).json({ error: 'Invalid nutritional values' });
    }
    try {
        const recipeID = await saveRecipeDetails(recipeName, userID, protein, kcal, fat, fiber);
        res.status(201).json({ recipeID: recipeID, message: "Recipe saved successfully" });
    } catch (error) {
        console.error('Error saving recipe:', error);
        res.status(500).send('Server error');
    }
};


module.exports = {
    fetchRecipeNutrition, createMeal, fetchMeals, updateMeal, deleteMealController, addWater, getRecipes, getIngredients, getNutritionalInfo, saveRecipe
};
