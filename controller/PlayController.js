const { checkFile } = require('../utils/fileUtil');

const { Play, Schedule } = require('../models');

// 공연 추가
exports.postPlay = async (req, res) => {
    try {
        const { title, place } = req.body;

        const filePath = checkFile(req.file); // 파일 유무 확인

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

        const schedule = await Schedule.create({
            play_id: playId,
            date_time: dateTime
        });

        res.send({ schedule: schedule });
    }catch (err) {
        console.log(err);
    }
}