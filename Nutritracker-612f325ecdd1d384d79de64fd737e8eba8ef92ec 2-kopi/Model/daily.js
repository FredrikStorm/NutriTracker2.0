const sql = require('mssql');
const { getDbConnection } = require('../database.js');

async function fetchNutritionData(userId, timeGroup) {
    const pool = await getDbConnection();
    const queries = {
        mealsQuery: `
            SELECT 
                DATEPART(${timeGroup}, DanishTime) AS TimeGroup,
                SUM((weight / 100.0) * r.kcal) as TotalKcal
            FROM [user].meal m
            JOIN [user].recipe r ON m.recipeID = r.recipeID
            WHERE m.userID = @userId
            GROUP BY DATEPART(${timeGroup}, DanishTime)
        `,
        waterQuery: `
            SELECT 
                DATEPART(${timeGroup}, DanishTime) AS TimeGroup,
                COUNT(*) * 250 AS WaterIntake
            FROM [user].water
            WHERE userId = @userId
            GROUP BY DATEPART(${timeGroup}, Danishtime)
        `,
        metabolismQuery: `
            SELECT m.stofskifte
            FROM [user].metabolism m
            WHERE m.userId = @userId
        `,
        activitiesQuery: `
            SELECT 
                DATEPART(${timeGroup}, a.DanishTime) AS TimeGroup,
                SUM(a.kcal) AS TotalActivityKcal
            FROM [user].Activities a
            WHERE a.userId = @userId
            GROUP BY DATEPART(${timeGroup}, a.DanishTime)
        `
    };

    const { mealsQuery, waterQuery, metabolismQuery, activitiesQuery } = queries;
    const results = await Promise.all([
        pool.request().input('userId', sql.Int, userId).query(mealsQuery),
        pool.request().input('userId', sql.Int, userId).query(waterQuery),
        pool.request().input('userId', sql.Int, userId).query(metabolismQuery),
        pool.request().input('userId', sql.Int, userId).query(activitiesQuery)
    ]);

    return results;
}

module.exports = { fetchNutritionData };