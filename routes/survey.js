const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/auth');
const controller = require('../controller/SurveyController');

router.post("/", isAuthenticated, controller.evaluateService);

module.exports = router;