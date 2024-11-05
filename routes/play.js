const express = require('express');
const router = express.Router();
const controller = require('../controller/PlayController');

const multer = require('multer');
const fs = require('fs');


router.post("/postPlay", controller.postPlay);