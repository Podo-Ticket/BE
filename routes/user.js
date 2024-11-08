const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/admin');
const controller = require('../controller/UserController');


// user
router.get("/check", controller.checkReservation);

// admin
router.get("/list", isAdmin, controller.showList);
router.get("/schedule", isAdmin, controller.showSchedule);
router.get("/admin", isAdmin, controller.showScheduleAdmin);
router.post("/admin", isAdmin, controller.reservationAdmin);

module.exports = router;