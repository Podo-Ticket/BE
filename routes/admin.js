const express = require('express');
const router = express.Router();
const controller = require('../controller/AdminController');

router.get('/', controller.enterAdmin);
router.get('/main', controller.showMain);

module.exports = router;
