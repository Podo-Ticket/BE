const express = require('express');
const router = express.Router();
const controller = require('../controller/ReservationController');

router.post("/",controller.reservation);

module.exports = router;