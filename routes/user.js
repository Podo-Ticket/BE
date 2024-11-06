const express = require('express');
const router = express.Router();
const controller = require('../controller/UserController');

router.get("/check", controller.checkReservation);

module.exports = router;