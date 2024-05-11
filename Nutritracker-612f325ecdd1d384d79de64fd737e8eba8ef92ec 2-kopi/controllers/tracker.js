const { getRecipeNutrition, saveMeal, getMealsByUserId, updateMealWeight, deleteMeal, logWater, fetchRecipes, fetchIngredients, fetchNutritionalInfo, saveRecipeDetails } = require('../Model/tracker.js')
const cors = require('cors'); // CORS-modul til at tillade anmodninger

// Funktion til at hente oplysningerne for en opskrift baseret på dens ID
const fetchRecipeNutrition = (cors(), async (req, res) => {
    const { recipeId } = req.params;  // Henter recipeId fra URL-parametre
    try {
        const nutrition = await getRecipeNutrition(recipeId);  // Kalder en funktion til at hente data
        res.json(nutrition);  // Sender dataen tilbage som JSON
    } catch (error) {
        console.error('Error fetching recipe nutrition:', error);  // Logger fejlen til konsollen
        res.status(500).send('Error fetching recipe nutrition');  // Sender en fejlmeddelelse til klienten
    }
});

// Funktion til at oprette et måltid
const createMeal = (cors(), async (req, res) => {
    const { date, time, location, weight, userID, recipeID } = req.body;  // Henter data fra request-body
    try {
        const result = await saveMeal(date, time, location, weight, userID, recipeID);  // Gemmer måltidet og returnerer resultatet
        if (result.success) {
            res.status(201).json({ success: true, mealID: result.mealID }); 
        } else {
            res.status(400).json({ success: false, message: "Unable to save meal" });  // Fejlrespons hvis ikke gemt korrekt
        }
    } catch (error) {
        console.error('Server error:', error);  // Logger serverfejl
        res.status(500).json({ error: 'Server error' });  // Sender serverfejlmeddelelse til klienten
    }
});

// Funktion til at hente alle måltider for en bruger
const fetchMeals = (cors(), async (req, res) => {
    const { userID } = req.query;  // Henter userID fra forespørgselsparametre
    try {
        const meals = await getMealsByUserId(userID);  // Henter måltider baseret på brugerID
        res.json(meals);  // Sender måltiderne som JSON-respons
    } catch (error) {
        console.error('Error fetching meals:', error);  // Logger fejl
        res.status(500).send('Error fetching meals');  // Sender fejlmeddelelse
    }
});

// Funktion til at opdatere vægten for et måltid
const updateMeal = (cors(), async (req, res) => {
    const { mealID } = req.params;  // Henter mealID fra URL-parametre
    const { weight } = req.body;  // Henter ny vægt fra request-body
    
    if (!weight || isNaN(weight)) {
        return res.status(400).json({ error: 'Invalid weight provided' }); 
    }

    try {
        const rowsAffected = await updateMealWeight(mealID, weight);  // Opdaterer måltidets vægt
        if (rowsAffected === 0) {
            return res.status(404).json({ message: 'Meal not found' });  // Ingen måltid fundet at opdatere
        }
        res.status(200).json({ message: 'Meal updated successfully', weight: weight });  // Succesrespons
    } catch (error) {
        console.error('Server error updating meal:', error);  // Logger serverfejl
        res.status(500).json({ error: 'Server error' });  // Sender fejlmeddelelse til klienten
    }
});

// Funktion til at slette et måltid baseret på dets ID
const deleteMealController = (cors(), async (req, res) => {
    const { mealID } = req.params;  // Henter mealID fra URL-parametre
    if (!mealID || isNaN(parseInt(mealID, 10))) {
        return res.status(400).send('Invalid meal ID');  
    }

    try {
        await deleteMeal(mealID);  // Sletter måltidet
        res.send('Meal deleted successfully');  // Bekræfter sletningen
    } catch (error) {
        console.error('Error deleting meal:', error);  // Logger fejl
        res.status(500).send('Failed to delete meal');  // Sender fejlmeddelelse
    }
});

// Funktion til at registrere vandindtag for en bruger
const addWater = (cors(), async (req, res) => {
    const { userID } = req.body;  // Henter userID fra request-kroppen
    try {
        const result = await logWater(userID);  // Logger vandindtaget
        res.status(201).json({ message: "Water intake logged successfully", id: result.insertId });  // Succesrespons med ID for logningen
    } catch (error) {
        console.error('Error logging water intake:', error);  // Logger fejl
        res.status(500).send('Server error');  // Sender serverfejlmeddelelse
    }
});

// Funktion til at hente opskrifter for en bruger
const getRecipes = async (req, res) => {
    const { userID } = req.query;  // Henter userID fra forespørgselsparametre
    if (isNaN(userID) || userID <= 0) {
        return res.status(400).json({ error: 'Invalid user ID' });  // Validerer userID
    }
    try {
        const result = await fetchRecipes(userID);  // Henter opskrifter for brugeren
        res.json(result.recordset);  // Sender opskrifterne som JSON-respons
    } catch (error) {
        console.error('Error fetching recipes:', error);  // Logger fejl
        res.status(500).send('Error fetching recipes');  // Sender fejlmeddelelse
    }
};

// Funktion til at søge efter ingredienser baseret på et søge felt
const getIngredients = async (req, res) => {
    const searchString = req.query.search || '';  // Henter søge feltet fra forespørgslen
    try {
        const result = await fetchIngredients(searchString);  // Henter ingredienser baseret på søge feltet
        res.json(result.recordset);  // Sender ingredienserne som JSON-respons
    } catch (error) {
        console.error('Error fetching ingredients:', error);  // Logger fejl
        res.status(500).send('Error fetching ingredients');  // Sender fejlmeddelelse
    }
};

// Funktion til at hente ernæringsoplysninger for en specifik fødevare
const getNutritionalInfo = async (req, res) => {
    const { foodID, parameterID } = req.query;  // Henter fødevare- og parameterID fra forespørgslen
    try {
        const result = await fetchNutritionalInfo(foodID, parameterID);  // Henter sdata baseret på ID'erne
        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);  // Sender oplysningerne som JSON-respons
        } else {
            res.status(404).send('No data found');  // Ingen data fundet
        }
    } catch (error) {
        console.error('Error fetching nutritional information:', error);  // Logger fejl
        res.status(500).send('Error fetching nutritional information');  // Sender fejlmeddelelse
    }
};

// Funktion til at gemme en opskrift med ernæringsoplysninger
const saveRecipe = async (req, res) => {
    const { recipeName, userID, protein, kcal, fat, fiber } = req.body;  // Henter opskrift og ernæringsdata fra request-body
    if (!recipeName || typeof recipeName !== 'string' || recipeName.trim() === '') {
        return res.status(400).json({ error: 'Invalid recipe name' });  
    }
    if (isNaN(userID) || userID <= 0) {
        return res.status(400).json({ error: 'Invalid user ID' });  // tjekker brugerens ID
    }
    if (isNaN(protein) || isNaN(kcal) || isNaN(fat) || isNaN(fiber) || protein < 0 || kcal < 0 || fat < 0 || fiber < 0) {
        return res.status(400).json({ error: 'Invalid nutritional values' });  // tjekker ernæringsværdierne
    }
    try {
        const recipeID = await saveRecipeDetails(recipeName, userID, protein, kcal, fat, fiber);  // Gemmer opskriften
        res.status(201).json({ recipeID: recipeID, message: "Recipe saved successfully" });  // Succesrespons med opskriftens ID
    } catch (error) {
        console.error('Error saving recipe:', error);  // Logger fejl
        res.status(500).send('Server error');  // Sender serverfejlmeddelelse
    }
};


module.exports = {
    fetchRecipeNutrition, createMeal, fetchMeals, updateMeal, deleteMealController, addWater, getRecipes, getIngredients, getNutritionalInfo, saveRecipe
};
