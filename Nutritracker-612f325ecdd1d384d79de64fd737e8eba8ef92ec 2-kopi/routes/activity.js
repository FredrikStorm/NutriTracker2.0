const express = require('express');
//Her exporter vi alle de funktioner vi skal bruge
const { createActivity, getActivity, getProfileController, createMetabolism } = require('../controllers/activity.js')

const router = express.Router();

//activity beregner
router.get('/user/Activitytable/:activityid', getActivity);

router.post('/user/Activities', createActivity);

router.get('/user/profile/:userId', getProfileController);

router.post('/user/metabolism', createMetabolism);

module.exports = router;