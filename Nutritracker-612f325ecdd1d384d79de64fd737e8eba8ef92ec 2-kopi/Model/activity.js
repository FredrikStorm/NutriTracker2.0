const sql = require('mssql');
const { getDbConnection } = require('../database.js');

async function getActivityById(activityId) {
    const pool = await getDbConnection();
    const result = await pool.request()
        .input('activityid', sql.Int, activityId)
        .query('SELECT activityid, activityname, kcal FROM [user].Activitytable WHERE activityid = @activityid');

    if (result.recordset.length > 0) {
        return result.recordset[0];
    } else {
        throw new Error('Activity not found');
    }
}

async function logActivity({ activityid, activityname, totalKcalBurned, hours, userId }) {
    const pool = await getDbConnection();
    await pool.request()
        .input('activityid', sql.Int, activityid)
        .input('activityname', sql.NVarChar, activityname)
        .input('kcal', sql.Float, totalKcalBurned)
        .input('hours', sql.Float, hours)
        .input('userId', sql.Int, userId)
        .query('INSERT INTO [user].Activities (activityId, activityName, kcal, hours, userId, timestamp) VALUES (@activityid, @activityname, @kcal, @hours, @userId, DEFAULT)');
}

async function getProfileFromDb(userId) {
    const pool = await getDbConnection();
    const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query('SELECT age, weight, gender FROM [user].profile WHERE userId = @userId');
    return result.recordset;
}

// Funktion til at gemme en brugers stofskifteinformation i databasen
async function saveMetabolism({ userId, metabolism }) {
    const pool = await getDbConnection();
    await pool.request()
        .input('userId', sql.Int, userId)
        .input('metabolism', sql.Float, metabolism)
        .query('INSERT INTO [user].metabolism (userId, stofskifte) VALUES (@userId, @metabolism)');
}

module.exports = { getActivityById, logActivity, getProfileFromDb, saveMetabolism };
