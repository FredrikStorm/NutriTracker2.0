const { getActivityById, logActivity, getProfileFromDb, saveMetabolism } = require('../Model/activity.js')
const cors = require('cors'); // CORS-modul til at tillade anmodninger

const getActivity = (cors(), async (req, res) => {
    const { activityid } = req.params;

    try {
        const activity = await getActivityById(parseInt(activityid));
        res.json(activity);
    } catch (err) {
        if (err.message === 'Activity not found') {
            res.status(404).send('Activity not found');
        } else {
            res.status(500).send('Database error: ' + err.message);
        }
    }
});

// Controller til at oprette en ny aktivitet
const createActivity = (cors(), async (req, res) => {
    const { activityid, activityname, totalKcalBurned, hours, userId } = req.body;
    try {
        await logActivity({ activityid, activityname, totalKcalBurned, hours, userId });
        res.status(201).send('Aktivitet logget med succes');
    } catch (err) {
        console.error(err);
        res.status(500).send('Databasefejl: ' + err.message);
    }
});

const getProfileController = async (req, res) => {
    const { userId } = req.params;
    try {
        const profileData = await getProfileFromDb(userId);
        if (profileData.length > 0) {
            res.json(profileData[0]); // Return the profile data as JSON
        } else {
            res.status(404).send('Brugerprofil ikke fundet'); // Profile not found
        }
    } catch (err) {
        res.status(500).send('Databasefejl: ' + err.message); // Handle database connection errors
    }
};

// Controller til at gemme brugerens stofskifte i databasen
const createMetabolism = (cors(), async (req, res) => {
    const { userId, metabolism } = req.body;
    try {
        await saveMetabolism({ userId, metabolism });
        res.status(201).send('Data om stofskifte gemt med succes');
    } catch (err) {
        res.status(500).send('Databasefejl: ' + err.message);
    }
});

module.exports = { getActivity, createActivity, getProfileController, createMetabolism };