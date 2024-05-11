const { getUserProfile,
    createUser,
    findProfileByEmail,
    updateUserProfile,
    deleteUserProfile } = require('../Model/user.js')


const profile = async (req, res) => {
    const userID=req.query.userID;
   // res.json(userID);
    console.log(userID);
    try {
        const userInfo = await getUserProfile(userID);
        console.log(userInfo)
        res.json(userInfo);
    } catch (error) {
        console.error('Error fething userInfo:', error);
        res.status(500).send('Error fetching recipe userInfo');
    }
};

const saveUser = async (req, res) => {
    try {
        const userID = await createUser(req.body);
        res.status(201).json({ userID });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error while inserting data: ' + err.message);
    }
};

const checkProfile = async (req, res) => {
    const userEmail = req.query.email;
    try {
        const userProfile = await findProfileByEmail(userEmail);
        if (userProfile) {
            res.json(userProfile);
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Error while retrieving data: ' + error.message);
    }
};

const saveChanges = async (req, res) => {
    try {
        const result = await updateUserProfile(req.body);
        if (result) {
            res.status(200).json({ message: "User updated successfully", result });
        } else {
            res.status(404).send('User not found or no changes made.');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('Error updating user');
    }
};

const deleteThisProfile = async (req, res) => {
    const { userID } = req.body;
    try {
        await deleteUserProfile(userID);
        res.status(200).json({ message: "User and related activities deleted successfully" });
    } catch (error) {
        console.error('Error deleting user and activities:', error);
        res.status(500).send('Error deleting user and activities');
    }
};

module.exports = {
    profile,
    saveUser,
    checkProfile,
    saveChanges,
    deleteThisProfile
};