const { checkFile } = require('../utils/fileUtil');

const { Play } = require('../models');

// 공연 추가
exports.postPlay = async (req, res) => {
    try {
        const { title, place } = req.body;
        // 파일 유무 확인
        const filePath = checkFile(req.file);

        const play = await Play.create({
            title: title,
            place: place,
            poster: filePath
        });

        res.send({ play: play });
    }catch (err) {
        console.log(err);
    }
};

// 공연 일정 추가
exports.postSchedule = async (req, res) => {
    try {
        const { playId, dateTime } = req.body;


    }catch (err) {
        console.log(err);
    }
}