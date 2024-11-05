const { checkFile } = require('../utils/fileUtil');

const { Play } = require('../models');

// 공연 추가
exports.postPlay = async (req, res) => {
    try {
        // 파일 유무 확인
        const filePath = checkFile(req.file);

    }catch (err) {
        console.log(err);
    }
};