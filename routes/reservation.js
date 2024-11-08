const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/auth');
const controller = require('../controller/ReservationController');



module.exports = router;