const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/admin');
const controller = require('../controller/AdminController');

router.get('/', controller.enterAdmin);
router.get('/main', isAdmin, controller.showMain);

module.exports = router;
