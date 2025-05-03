const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/admin');
const controller = require('../controller/ReservationController');

// user
router.get('/', controller.showSchedule);
router.post('/', controller.reservation);

// admin
router.get('/admin', isAdmin, controller.showOnSite);
router.patch('/approve', isAdmin, controller.approveOnSite);
router.delete('/delete', isAdmin, controller.deleteOnSite);

module.exports = router;
