const express = require('express');
const router = express.Router();
const controller = require('../controller/AdminController');

// 관리자 페이지 로그인
router.get("/", controller.enterAdmin);

module.exports = router;