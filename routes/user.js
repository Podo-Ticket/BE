const express = require('express');
const router = express.Router();
const controller = require('../controller/UserController');


// user
router.get("/check", controller.checkReservation);

// admin
router.get("/admin", controller.enterAdmin);

module.exports = router;