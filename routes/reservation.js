const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/admin');
const controller = require('../controller/ReservationController');

// user
router.get("/", controller.showSchedule);
router.post("/",controller.reservation);

module.exports = router;