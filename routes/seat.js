const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/auth');
const controller = require('../controller/SeatController');

router.get("/", isAuthenticated ,controller.showSeats);
router.get("/check", isAuthenticated, controller.checkReserved);
router.get("/ticketing", isAuthenticated, controller.showTicketing);
router.patch("/ticketing", isAuthenticated, controller.requestTicketing);
router.delete("/back", isAuthenticated, controller.cancelTicketing);

module.exports = router;