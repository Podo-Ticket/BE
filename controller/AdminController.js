const { Schedule, User, Seat, sequelize } = require('../models');

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

    const info = await Schedule.findAll({
      attributes: [
        'id',
        'date_time',
        [
          sequelize.fn(
            'COUNT',
            sequelize.fn('DISTINCT', sequelize.col('users.id'))
          ),
          'user',
        ],
        [
          sequelize.fn(
            'COUNT',
            sequelize.fn('DISTINCT', sequelize.col('seats.id'))
          ),
          'booked',
        ],
      ],
      include: [
        {
          model: User,
          as: 'users',
          attributes: [],
        },
        {
          model: Seat,
          as: 'seats',
          attributes: [],
          where: { state: true, lock: false },
          required: false,
        },
      ],
      where: { play_id: play },
      group: ['Schedule.id'],
    });

    res.send({ info });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 세션 확인
exports.checkSession = async (req, res) => {
  try {
    if (req.session.admin) {
      res.send({ session: true });
    } else {
      res.send({ session: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};
