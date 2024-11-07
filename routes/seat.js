const express = require('express');
const router = express.Router();
const controller = require('../controller/SeatController');

router.get("/", controller.showSeats);

module.exports = router;