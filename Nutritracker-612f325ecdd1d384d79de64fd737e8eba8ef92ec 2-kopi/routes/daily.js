const express = require('express');
//Her exporter vi alle de funktioner vi skal bruge
const { seeEnergi } = require('../controllers/daily.js')

const router = express.Router();

//Dailynutri energi
router.get('/user/meals/:userId', seeEnergi);

module.exports = router;