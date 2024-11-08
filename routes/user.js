const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/admin');
const controller = require('../controller/UserController');


// user
router.get("/check", controller.checkReservation);

// admin
router.get("/list", isAdmin, controller.showList);
router.get("/schedule", isAdmin, controller.showSchedule);

module.exports = router;