const sql = require('mssql');
const { getDbConnection } = require('../database.js');

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

module.exports = {
    fetchIngredients,
    fetchNutritionalInfo,
    saveRecipeDetails,
    fetchRecipes
};
