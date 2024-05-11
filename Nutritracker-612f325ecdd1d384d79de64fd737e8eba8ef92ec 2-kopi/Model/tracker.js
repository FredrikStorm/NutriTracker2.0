const sql = require('mssql');
const { getDbConnection } = require('../database.js');

const getRecipeNutrition = async (recipeId) => {
    try {
        const pool = await getDbConnection();
        const request = pool.request();
        const result = await request.query(`
            SELECT protein, kcal, fat, fiber, recipeName
            FROM [user].recipe
            WHERE recipeID = ${recipeId}
        `);
        return result.recordset[0];
    } catch (err) {
        console.error('Error fetching recipe nutrition:', err);
        throw err;
    }
};

const saveMeal = async (date, time, location, weight, userID, recipeID) => {
    try {
        const pool = await getDbConnection();
        const request = pool.request();
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
        `);
        return { success: true, mealID: result.recordset[0].mealID };
    } catch (err) {
        console.error('Database operation error:', err);
        throw err;
    }
};

const getMealsByUserId = async (userID) => {
    try {
        const pool = await getDbConnection();
        const request = pool.request();
        const result = await request.query(`
            SELECT * FROM [user].meal WHERE userID = ${userID};
        `);
        return result.recordset;
    } catch (err) {
        console.error('Database query error:', err);
        throw err;
    }
};

const updateMealWeight = async (mealID, weight) => {
    try {
        const pool = await getDbConnection();
        const request = pool.request();
        request.input('mealID', sql.Int, mealID);
        request.input('weight', sql.Int, weight);
        const result = await request.query('UPDATE [user].meal SET weight = @weight WHERE mealID = @mealID');
        return result.rowsAffected;
    } catch (err) {
        console.error('Error updating meal weight:', err);
        throw err;
    }
};

const deleteMeal = async (mealID) => {
    try {
        const pool = await getDbConnection();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        const request = new sql.Request(transaction);
        request.input('mealID', sql.Int, mealID);

        await request.query('DELETE FROM [user].meal WHERE mealID = @mealID');
        await transaction.commit();
    } catch (err) {
        console.error('Error deleting meal:', err);
        throw err;
    }
};

const logWater = async (userID) => {
    try {
        const pool = await getDbConnection();
        const request = pool.request();
        request.input('userID', sql.Int, userID);
        const result = await request.query('INSERT INTO [user].water (userID) VALUES (@userID)');
        return { success: true, recordset: result.recordset };
    } catch (error) {
        console.error('Failed to log water intake:', error);
        throw error;
    }
};

async function fetchRecipes(userID) {
    const pool = await getDbConnection();
    const request = pool.request();
    request.input('userID', sql.Int, userID);
    return request.query(`
        SELECT r.recipeID, r.recipeName, r.protein, r.kcal, r.fat, r.fiber
        FROM [user].recipe r
        WHERE r.userID = @userID;
    `);
}

async function fetchIngredients(searchString) {
    const pool = await getDbConnection();
    const request = new sql.Request(pool);
    request.input('searchString', sql.NVarChar, searchString);
    return request.query("SELECT FoodID, FoodName FROM foodbank.food WHERE FoodName LIKE '%' + @searchString + '%'");
}

async function fetchNutritionalInfo(foodID, parameterID) {
    const pool = await getDbConnection();
    const request = pool.request();
    request.input('FoodID', sql.Int, foodID);
    request.input('ParameterID', sql.Int, parameterID);
    return request.query(`
        SELECT ResVal
        FROM foodbank.foodParameter
        WHERE FoodID = @FoodID AND ParameterID = @ParameterID
    `);
}

async function saveRecipeDetails(recipeName, userID, protein, kcal, fat, fiber) {
    const pool = await getDbConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    const request = new sql.Request(transaction);
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
    `);
    await transaction.commit();
    return result.recordset[0].recipeID;
}



module.exports = { getRecipeNutrition, saveMeal, getMealsByUserId, updateMealWeight, deleteMeal, logWater, fetchRecipes, fetchIngredients, fetchNutritionalInfo, saveRecipeDetails };
