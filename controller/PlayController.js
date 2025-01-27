const { checkFile } = require('../utils/fileUtil');

const { Play, Schedule } = require('../models');

// 공연 추가
exports.postPlay = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).send({
        error: '올바르지 않은 공연 제목',
      });
    }

    const filePath = checkFile(req.file); // 파일 유무 확인

    await Play.create({
      title: title,
      poster: filePath,
    });

    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 공연 일정 추가
exports.postSchedule = async (req, res) => {
  try {
    const { playId, dateTime, availableSeats } = req.body;

    if (!playId || !dateTime || !availableSeats) {
      return res.status(400).send({
        error: '올바르지 않은 공연 ID 또는 일정 또는 좌석 수',
      });
    }

    await Schedule.create({
      play_id: playId,
      date_time: dateTime,
      available_seats: availableSeats,
    });

    res.send({ suceess: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};
