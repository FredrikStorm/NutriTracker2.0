const express = require('express');
//Her exporter vi alle de funktioner vi skal bruge
const { profile, saveUser, checkProfile, saveChanges, deleteThisProfile } = require('../controllers/user.js')

const router = express.Router();

//brugerstyring
router.get('/user/profile/edit', profile);

router.post('/user/profile/save_user', saveUser);

router.get('/user/profile', checkProfile);

router.put('/user/profile/edit/save_changes', saveChanges);

router.delete('/user/profile/delete', deleteThisProfile);

module.exports = router;