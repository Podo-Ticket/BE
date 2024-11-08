const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/auth');
const controller = require('../controller/TicketController');

router.get("/info", isAuthenticated, controller.showTicketInfo);

module.exports = router;