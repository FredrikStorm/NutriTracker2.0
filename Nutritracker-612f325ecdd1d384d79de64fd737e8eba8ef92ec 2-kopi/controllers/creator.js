const { fetchIngredients, fetchNutritionalInfo, saveRecipeDetails, fetchRecipes } = require('../Model/creator.js')

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

module.exports = {
    getIngredients,
    getNutritionalInfo,
    saveRecipe,
    getRecipes
};