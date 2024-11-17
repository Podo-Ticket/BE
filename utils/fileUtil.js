const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const checkFile = (file) => {
   let filePath = null;
   // 파일 정보 유무 확인
   if (file) {
       const { destination, filename } = file;
       filePath = destination.split(path.sep)[1] + path.sep + filename; // 파일명
   }

   return filePath;
};

module.exports = { checkFile };
