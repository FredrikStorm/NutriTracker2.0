const sql = require('mssql');
const { getDbConnection } = require('../database.js');

// Funktion til at hente ernæringsdata for en opskrift baseret på opskriftens ID
const getRecipeNutrition = async (recipeId) => {
    try {
        const pool = await getDbConnection(); // Opretter forbindelse til databasen
        const request = pool.request(); // Opretter en ny SQL forespørgsel
        const result = await request.query(`
            SELECT protein, kcal, fat, fiber, recipeName
            FROM [user].recipe
            WHERE recipeID = ${recipeId}
        `); // Udfører SQL-forespørgsel for at hente oplysninger om opskriften
        return result.recordset[0]; // Returnerer den første række fra resultatsættet
    } catch (err) {
        console.error('Error fetching recipe nutrition:', err); // Logger en fejlmeddelelse
        throw err;
    }
};

// Funktion til at gemme et måltid i databasen
const saveMeal = async (date, time, location, weight, userID, recipeID) => {
    try {
        const pool = await getDbConnection(); // Opretter forbindelse til databasen
        const request = pool.request(); // Opretter en ny SQL forespørgsel
        // Indsætter inputparametre i SQL-forespørgslen
        request.input('date', sql.Date, date);
        request.input('time', sql.VarChar(10), time);
        request.input('location', sql.VarChar, location);
        request.input('weight', sql.Int, weight);
        request.input('userID', sql.Int, userID);
        request.input('recipeID', sql.Int, recipeID);

        const result = await request.query(`
            INSERT INTO [user].meal (date, time, location, weight, userID, recipeID)
            OUTPUT INSERTED.mealID
            VALUES (@date, @time, @location, @weight, @userID, @recipeID);
        `); // Udfører SQL-forespørgsel for at indsætte måltidsdata og returnere det nye mealID
        return { success: true, mealID: result.recordset[0].mealID };
    } catch (err) {
        console.error('Database operation error:', err); // Logger en fejlmeddelelse
        throw err; 
    }
};

// Funktion til at hente alle måltider for en bruger baseret på brugerens ID
const getMealsByUserId = async (userID) => {
    try {
        const pool = await getDbConnection(); // Opretter forbindelse til databasen
        const request = pool.request(); // Opretter en ny SQL forespørgsel
        const result = await request.query(`
            SELECT * FROM [user].meal WHERE userID = ${userID};
        `); // Udfører SQL-forespørgsel for at hente måltidsdata for brugeren
        return result.recordset; // Returnerer resultatsættet
    } catch (err) {
        console.error('Database query error:', err); // Logger en fejlmeddelelse
        throw err; 
    }
};

// Funktion til at opdatere vægten for et måltid baseret på måltidets ID
const updateMealWeight = async (mealID, weight) => {
    try {
        const pool = await getDbConnection();
        const request = pool.request(); 
        request.input('mealID', sql.Int, mealID);
        request.input('weight', sql.Int, weight);
        const result = await request.query('UPDATE [user].meal SET weight = @weight WHERE mealID = @mealID'); // Udfører SQL-forespørgsel for at opdatere vægten
        return result.rowsAffected; // Returnerer antallet af berørte rækker
    } catch (err) {
        console.error('Error updating meal weight:', err); // Logger en fejlmeddelelse
        throw err; 
    }
};

// Funktion til at slette et måltid baseret på måltidets ID
const deleteMeal = async (mealID) => {
    try {
        const pool = await getDbConnection(); // Opretter forbindelse til databasen
        const transaction = new sql.Transaction(pool); // Starter en ny transaktion
        await transaction.begin(); // Starter transaktionen
        const request = new sql.Request(transaction); // Opretter en ny SQL forespørgsel inden for transaktionen
        request.input('mealID', sql.Int, mealID);

        await request.query('DELETE FROM [user].meal WHERE mealID = @mealID'); // Udfører SQL-forespørgsel for at slette måltidet
        await transaction.commit(); // Afslutter transaktionen ved at committe
    } catch (err) {
        console.error('Error deleting meal:', err); // Logger en fejlmeddelelse
        throw err; 
    }
};

// Funktion til at logge vandindtag for en bruger
const logWater = async (userID) => {
    try {
        const pool = await getDbConnection(); 
        const request = pool.request(); 
        request.input('userID', sql.Int, userID);
        const result = await request.query('INSERT INTO [user].water (userID) VALUES (@userID)'); // Udfører SQL-forespørgsel for at logge vandindtag
        return { success: true, recordset: result.recordset };
    } catch (error) {
        console.error('Failed to log water intake:', error); // Logger en fejlmeddelelse
        throw error; 
    }
};

// Funktion til at hente opskrifter tilhørende en specifik bruger
async function fetchRecipes(userID) {
    const pool = await getDbConnection();
    const request = pool.request(); 
    request.input('userID', sql.Int, userID);
    return request.query(`
        SELECT r.recipeID, r.recipeName, r.protein, r.kcal, r.fat, r.fiber
        FROM [user].recipe r
        WHERE r.userID = @userID;
    `); // Udfører SQL-forespørgsel for at hente opskrifter for brugeren
}

// Funktion til at søge efter ingredienser baseret på en søgestreng
async function fetchIngredients(searchString) {
    const pool = await getDbConnection(); // Opretter forbindelse til databasen
    const request = new sql.Request(pool); // Opretter en ny SQL forespørgsel
    request.input('searchString', sql.NVarChar, searchString);
    return request.query("SELECT FoodID, FoodName FROM foodbank.food WHERE FoodName LIKE '%' + @searchString + '%'"); // Udfører SQL-forespørgsel for at søge efter ingredienser
}

// Funktion til at hente ernæringsoplysninger for en specifik fødevare og parameter
async function fetchNutritionalInfo(foodID, parameterID) {
    const pool = await getDbConnection(); 
    const request = pool.request(); 
    request.input('FoodID', sql.Int, foodID);
    request.input('ParameterID', sql.Int, parameterID);
    return request.query(`
        SELECT ResVal
        FROM foodbank.foodParameter
        WHERE FoodID = @FoodID AND ParameterID = @ParameterID
    `); // Udfører SQL-forespørgsel for at hente ernæringsoplysninger
}

// Funktion til at gemme oplysninger om en opskrift i databasen
async function saveRecipeDetails(recipeName, userID, protein, kcal, fat, fiber) {
    const pool = await getDbConnection(); // Opretter forbindelse til databasen
    const transaction = new sql.Transaction(pool); // Starter en ny transaktion
    await transaction.begin(); // Starter transaktionen
    const request = new sql.Request(transaction); // Opretter en ny SQL forespørgsel inden for transaktionen
    request.input('recipeName', sql.VarChar, recipeName);
    request.input('userID', sql.Int, userID);
    request.input('protein', sql.Decimal(18, 2), protein);
    request.input('kcal', sql.Decimal(18, 2), kcal);
    request.input('fat', sql.Decimal(18, 2), fat);
    request.input('fiber', sql.Decimal(18, 2), fiber);
    const result = await request.query(`
        INSERT INTO [user].recipe (recipeName, userID, protein, kcal, fat, fiber)
        OUTPUT INSERTED.recipeID  
        VALUES (@recipeName, @userID, @protein, @kcal, @fat, @fiber);
    `); // Udfører SQL-forespørgsel for at indsætte opskriftsdetaljer og returnere det nye recipeID
    await transaction.commit(); // Afslutter transaktionen ved at committe
    return result.recordset[0].recipeID;
}


module.exports = { getRecipeNutrition, saveMeal, getMealsByUserId, updateMealWeight, deleteMeal, logWater, fetchRecipes, fetchIngredients, fetchNutritionalInfo, saveRecipeDetails };
