const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/auth');
const isAdmin = require('../middleware/admin');
const controller = require('../controller/SeatController');

// user
router.get('/', isAuthenticated, controller.showSeats);
router.get('/check', isAuthenticated, controller.checkReserved);
router.get('/ticketing', isAuthenticated, controller.showTicketing);
router.patch('/ticketing', isAuthenticated, controller.requestTicketing);
router.delete('/back', isAuthenticated, controller.cancelTicketing);

// admin
router.get('/realTime', isAdmin, controller.realTimeSeats);
router.get('/audience', isAdmin, controller.showAudience);
router.post('/check', isAdmin, controller.checkSeats);
router.post('/lock', isAdmin, controller.lockSeats);
router.delete('/unlock', isAdmin, controller.unlockSeats);

module.exports = router;
