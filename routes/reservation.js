const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/admin');
const controller = require('../controller/ReservationController');

// User
router.get("/", controller.showSchedule);
router.post("/",controller.reservation);

// Admin
router.get("/admin", isAdmin, controller.showScheduleAdmin);
router.post("/admin", isAdmin, controller.reservationAdmin);

module.exports = router;