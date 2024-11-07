const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/auth');
const controller = require('../controller/SeatController');

router.get("/", isAuthenticated ,controller.showSeats);
router.get("/check", isAuthenticated, controller.checkReserved);

module.exports = router;