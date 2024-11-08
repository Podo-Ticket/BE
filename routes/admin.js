const express = require('express');
const router = express.Router();
const controller = require('../controller/AdminController');

router.get("/", controller.enterAdmin);

module.exports = router;