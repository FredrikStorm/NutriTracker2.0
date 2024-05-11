const sql = require('mssql');
const { getDbConnection } = require('../database.js');

const getUserProfile = async (userID) => {
    const pool = await getDbConnection();
    const result = await pool.request()
        .input('userID', sql.Int, userID)
        .query(`
        SELECT age, gender, weight
        FROM [user].profile
        WHERE userID = ${userID}  
    `);
        return result.recordset[0];
};

const createUser = async (userData) => {
    let pool = await getDbConnection();
    let sqlRequest = new sql.Request(pool);
    let sqlQuery = `INSERT INTO [user].profile (firstname, lastname, weight, age, gender, email, password)
                    OUTPUT inserted.userID 
                    VALUES (@firstname, @lastname, @weight, @age, @gender, @email, @password)`;

    sqlRequest.input('firstname', sql.VarChar, userData.firstname);
    sqlRequest.input('lastname', sql.VarChar, userData.lastname);
    sqlRequest.input('weight', sql.Int, userData.weight);
    sqlRequest.input('age', sql.Int, userData.age);
    sqlRequest.input('gender', sql.VarChar, userData.gender);
    sqlRequest.input('email', sql.VarChar, userData.email);
    sqlRequest.input('password', sql.VarChar, userData.password);

    const result = await sqlRequest.query(sqlQuery);
    return result.recordset[0];  // Assuming userID is returned after INSERT
};

const findProfileByEmail = async (email) => {
    let pool = await getDbConnection();
    let sqlRequest = new sql.Request(pool);
    sqlRequest.input('email', sql.VarChar, email);
    const result = await sqlRequest.query(`SELECT * FROM [user].profile WHERE email = @email;`);
    return result.recordset.length > 0 ? result.recordset[0] : null;
};

const updateUserProfile = async (data) => {
    let pool = await getDbConnection();
    let sqlRequest = new sql.Request(pool);
    sqlRequest.input('userID', sql.Int, data.userID);
    sqlRequest.input('age', sql.Int, data.age);
    sqlRequest.input('weight', sql.Int, data.weight);
    sqlRequest.input('gender', sql.VarChar, data.gender);

    const result = await sqlRequest.query(`
        UPDATE [user].profile 
        SET weight = @weight, age = @age, gender = @gender
        WHERE userID = @userID;
    `);
    return result.rowsAffected[0] > 0 ? result : null;
};

const deleteUserProfile = async (userID) => {
    let pool = await getDbConnection();
    let sqlRequest = new sql.Request(pool);

    sqlRequest.input('userID', sql.Int, userID);
    // Assuming cascade deletes or handling related data elsewhere in your app
    await sqlRequest.query(`DELETE FROM [user].Activities WHERE userId = @userID;`);
    await sqlRequest.query(`DELETE FROM [user].meal WHERE userID = @userID;`);
    await sqlRequest.query(`DELETE FROM [user].metabolism WHERE userId = @userID;`);
    await sqlRequest.query(`DELETE FROM [user].recipe WHERE userID = @userID;`);
    await sqlRequest.query(`DELETE FROM [user].water WHERE userId = @userID;`); 
    await sqlRequest.query(`DELETE FROM [user].profile WHERE userID = @userID;`);
};

module.exports = {
    getUserProfile,
    createUser,
    findProfileByEmail,
    updateUserProfile,
    deleteUserProfile
};
