const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/auth');
const controller = require('../controller/SurveyController');

// user
// router.post('/question1', isAuthenticated, controller.questionOne);
// router.post('/question2', isAuthenticated, controller.questionTwo);
router.post('/question1', controller.questionOne);
router.post('/question2', controller.questionTwo);

module.exports = router;
