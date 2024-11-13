const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/admin');
const controller = require('../controller/UserController');


// user
router.get("/check", controller.checkReservation);

// admin
router.get("/list", isAdmin, controller.showList);
router.get("/schedule", isAdmin, controller.showSchedule);
router.post("/admin", isAdmin, controller.reservationAdmin);
router.get("/info", isAdmin, controller.showAudienceInfo);
router.delete("/delete", isAdmin, controller.deleteAudience);
router.get("/update", isAdmin, controller.showUpdateAudienceInfo);
router.patch("/update", isAdmin, controller.updateAudience);

module.exports = router;