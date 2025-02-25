const { Schedule, sequelize } = require('../models');
const { Op } = require('sequelize');

// 접속
exports.enterAdmin = async (req, res) => {
  try {
    const { code } = req.query;

    let adminCode = process.env.ADMIN_CODE;
    let play_id = process.env.PLAY_ID; // 광운극회 단막극 공연 id

    if (code !== adminCode) {
      return res.status(400).send({
        error: '잘못된 인증코드',
      });
    }

    req.session.admin = {
      code: adminCode,
      play: play_id,
    };

    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 메인
exports.showMain = async (req, res) => {
  try {
    const { play } = req.session.admin;
    console.log('play', play);

    const info = await Schedule.findOne({
      attributes: [
        'id',
        'date_time',
        'available_seats',
        [
          sequelize.literal(
            `available_seats - (SELECT COUNT(*) FROM seat WHERE seat.schedule_id = schedule.id)`
          ),
          'free_seats',
        ],
      ],
      where: {
        play_id: play,
        date_time: {
          [Op.gt]: sequelize.fn('NOW'),
        },
      },
      order: [['date_time', 'ASC']],
    });

    res.send({ info });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};
