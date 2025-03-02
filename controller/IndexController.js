const { Play, Schedule, Count, sequelize } = require('../models');

// main 화면
exports.index = async (req, res) => {
  try {
    let { playId } = req.query;

    if (!playId) {
      return res.status(400).send({
        error: '올바르지 않은 공연 ID',
      });
    }

    const schedule = await Schedule.findAll({
      attributes: ['id', 'date_time'],
      include: [
        {
          model: Play,
          attributes: ['title', 'poster', 'location', 'running_time'],
        },
      ],
      where: { play_id: playId },
    });

    if (!schedule) {
      return res.status(404).send({
        error: '공연 조회 불가',
      });
    }

    const scheduleList = schedule.map((sch) => ({
      id: sch.id,
      date_time: sch.date_time,
    }));

    await Count.increment('mainCnt', { where: { id: 1 } });

    res.send({
      play: schedule[0].play,
      schedule: scheduleList,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// health check
exports.health = async (req, res) => {
  res.send('ok');
};
