const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/admin');
const controller = require('../controller/UserController');


// user
router.get("/check", controller.checkReservation);

// admin
router.get("/admin", controller.enterAdmin);
router.get("/list", isAdmin, controller.showList);

module.exports = router;