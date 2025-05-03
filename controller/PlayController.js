const { checkFile } = require('../utils/fileUtil');

const { Play, Schedule } = require('../models');

//공연 추가
exports.postPlay = async (req, res) => {
  const transaction = await Play.sequelize.transaction(); // 트랜잭션 시작
  try {
    const { title, en_title, location, en_location, price, runningTime } =
      req.body;

    // schedules는 JSON 문자열로 넘어오기 때문에 파싱
    const schedules = req.body.schedules ? JSON.parse(req.body.schedules) : [];

    // 필수값 검증
    if (!title || !en_title || !location || !en_location || !runningTime) {
      return res.status(400).send({ error: '필수 입력값이 누락되었습니다.' });
    }

    if (!Array.isArray(schedules)) {
      return res
        .status(400)
        .send({ error: '스케줄 데이터 형식이 잘못되었습니다.' });
    }

    // 파일 체크
    const filePath = checkFile(req.file);

    // Play 테이블 저장
    const play = await Play.create(
      {
        title,
        en_title,
        location,
        en_location,
        price,
        running_time: runningTime,
        poster: filePath,
      },
      { transaction }
    );

    // Schedule 테이블 저장
    if (schedules.length > 0) {
      const scheduleData = schedules.map((schedule) => ({
        play_id: play.id,
        date_time: schedule.dateTime,
        available_seats: schedule.availableSeats,
      }));

      await Schedule.bulkCreate(scheduleData, { transaction });
    }

    await transaction.commit();

    // 성공 응답
    res.status(201).send({
      success: true,
      playId: play.id,
      posterUrl: filePath,
    });
  } catch (error) {
    console.error(error);
    if (transaction) await transaction.rollback();
    res
      .status(500)
      .send({ error: 'Internal server error', message: error.message });
  }
};
